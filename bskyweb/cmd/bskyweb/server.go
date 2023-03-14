package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"

	comatproto "github.com/bluesky-social/indigo/api/atproto"
	appbsky "github.com/bluesky-social/indigo/api/bsky"
	cliutil "github.com/bluesky-social/indigo/cmd/gosky/util"
	"github.com/bluesky-social/indigo/xrpc"

	"github.com/flosch/pongo2/v6"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/urfave/cli/v2"
)

// TODO: embed templates in executable

type Renderer struct {
	Debug bool
}

func (r Renderer) Render(w io.Writer, name string, data interface{}, c echo.Context) error {

	var ctx pongo2.Context

	if data != nil {
		var ok bool
		ctx, ok = data.(pongo2.Context)

		if !ok {
			return errors.New("no pongo2.Context data was passed...")
		}
	}

	var t *pongo2.Template
	var err error

	if r.Debug {
		t, err = pongo2.FromFile(name)
	} else {
		t, err = pongo2.FromCache(name)
	}

	if err != nil {
		return err
	}

	return t.ExecuteWriter(ctx, w)
}

type Server struct {
	xrpcc *xrpc.Client
}

func serve(cctx *cli.Context) error {

	// create a new session
	// TODO: does this work with no auth at all?
	xrpcc := &xrpc.Client{
		Client: cliutil.NewHttpClient(),
		Host:   cctx.String("pds-host"),
		Auth: &xrpc.AuthInfo{
			Handle: cctx.String("handle"),
		},
	}

	auth, err := comatproto.SessionCreate(context.TODO(), xrpcc, &comatproto.SessionCreate_Input{
		Identifier: &xrpcc.Auth.Handle,
		Password:   cctx.String("password"),
	})
	if err != nil {
		return err
	}
	xrpcc.Auth.AccessJwt = auth.AccessJwt
	xrpcc.Auth.RefreshJwt = auth.RefreshJwt
	xrpcc.Auth.Did = auth.Did
	xrpcc.Auth.Handle = auth.Handle

	server := Server{xrpcc}

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "method=${method} path=${uri} status=${status} latency=${latency_human}\n",
	}))
	e.Renderer = Renderer{Debug: true}
	e.HTTPErrorHandler = customHTTPErrorHandler

	// configure routes
	e.File("/robots.txt", "static/robots.txt")
	e.Static("/static", "static")
	e.Static("/static/js", "../web-build/static/js")

	e.GET("/", server.WebHome)

	// generic routes
	e.GET("/search", server.WebGeneric)
	e.GET("/notifications", server.WebGeneric)
	e.GET("/settings", server.WebGeneric)
	e.GET("/sys/debug", server.WebGeneric)
	e.GET("/sys/log", server.WebGeneric)
	e.GET("/support", server.WebGeneric)
	e.GET("/support/privacy", server.WebGeneric)

	// profile endpoints; only first populates info
	e.GET("/profile/:handle", server.WebProfile)
	e.GET("/profile/:handle/follows", server.WebGeneric)
	e.GET("/profile/:handle/followers", server.WebGeneric)

	// post endpoints; only first populates info
	e.GET("/profile/:handle/post/:rkey", server.WebPost)
	e.GET("/profile/:handle/post/:rkey/upvoted-by", server.WebGeneric)
	e.GET("/profile/:handle/post/:rkey/downvoted-by", server.WebGeneric)
	e.GET("/profile/:handle/post/:rkey/reposted-by", server.WebGeneric)

	bind := "localhost:8100"
	log.Infof("starting server bind=%s", bind)
	return e.Start(bind)
}

func customHTTPErrorHandler(err error, c echo.Context) {
	code := http.StatusInternalServerError
	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
	}
	c.Logger().Error(err)
	data := pongo2.Context{
		"statusCode": code,
	}
	c.Render(code, "templates/error.html", data)
}

// handler for endpoint that have no specific server-side handling
func (srv *Server) WebGeneric(c echo.Context) error {
	data := pongo2.Context{}
	return c.Render(http.StatusOK, "templates/base.html", data)
}

func (srv *Server) WebHome(c echo.Context) error {
	data := pongo2.Context{}
	return c.Render(http.StatusOK, "templates/home.html", data)
}

func (srv *Server) WebPost(c echo.Context) error {
	data := pongo2.Context{}
	handle := c.Param("handle")
	rkey := c.Param("rkey")
	// sanity check argument
	if len(handle) > 4 && len(handle) < 128 && len(rkey) > 0 {
		ctx := context.TODO()
		// requires two fetches: first fetch profile (!)
		pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, handle)
		if err != nil {
			log.Warnf("failed to fetch handle: %s\t%v", handle, err)
		} else {
			did := pv.Did
			data["did"] = did

			// then fetch the post thread (with extra context)
			uri := fmt.Sprintf("at://%s/app.bsky.feed.post/%s", did, rkey)
			tpv, err := appbsky.FeedGetPostThread(ctx, srv.xrpcc, 1, uri)
			if err != nil {
				log.Warnf("failed to fetch post: %s\t%v", uri, err)
			} else {
				data["postView"] = tpv.Thread.FeedGetPostThread_ThreadViewPost.Post
			}
		}

	}
	return c.Render(http.StatusOK, "templates/post.html", data)
}

func (srv *Server) WebProfile(c echo.Context) error {
	data := pongo2.Context{}
	handle := c.Param("handle")
	// sanity check argument
	if len(handle) > 4 && len(handle) < 128 {
		ctx := context.TODO()
		pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, handle)
		if err != nil {
			log.Warnf("failed to fetch handle: %s\t%v", handle, err)
		} else {
			data["profileView"] = pv
		}
	}

	return c.Render(http.StatusOK, "templates/profile.html", data)
}
