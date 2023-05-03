package main

import (
	"context"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"strings"

	comatproto "github.com/bluesky-social/indigo/api/atproto"
	appbsky "github.com/bluesky-social/indigo/api/bsky"
	cliutil "github.com/bluesky-social/indigo/cmd/gosky/util"
	"github.com/bluesky-social/indigo/xrpc"
	"github.com/bluesky-social/social-app/bskyweb"

	"github.com/flosch/pongo2/v6"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/urfave/cli/v2"
)

type Server struct {
	xrpcc *xrpc.Client
}

func serve(cctx *cli.Context) error {
	debug := cctx.Bool("debug")
	httpAddress := cctx.String("http-address")
	pdsHost := cctx.String("pds-host")
	atpHandle := cctx.String("handle")
	atpPassword := cctx.String("password")
	mailmodoAPIKey := cctx.String("mailmodo-api-key")
	mailmodoListName := cctx.String("mailmodo-list-name")

	// Mailmodo client.
	mailmodo := NewMailmodo(mailmodoAPIKey)

	// create a new session
	// TODO: does this work with no auth at all?
	xrpcc := &xrpc.Client{
		Client: cliutil.NewHttpClient(),
		Host:   pdsHost,
		Auth: &xrpc.AuthInfo{
			Handle: atpHandle,
		},
	}

	auth, err := comatproto.ServerCreateSession(context.TODO(), xrpcc, &comatproto.ServerCreateSession_Input{
		Identifier: &xrpcc.Auth.Handle,
		Password:   atpPassword,
	})
	if err != nil {
		return err
	}
	xrpcc.Auth.AccessJwt = auth.AccessJwt
	xrpcc.Auth.RefreshJwt = auth.RefreshJwt
	xrpcc.Auth.Did = auth.Did
	xrpcc.Auth.Handle = auth.Handle

	server := Server{xrpcc}

	staticHandler := http.FileServer(func() http.FileSystem {
		if debug {
			return http.FS(os.DirFS("static"))
		}
		fsys, err := fs.Sub(bskyweb.StaticFS, "static")
		if err != nil {
			log.Fatal(err)
		}
		return http.FS(fsys)
	}())

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		// Don't log requests for static content.
		Skipper: func(c echo.Context) bool {
			return strings.HasPrefix(c.Request().URL.Path, "/static")
		},
		Format: "method=${method} path=${uri} status=${status} latency=${latency_human}\n",
	}))
	e.Renderer = NewRenderer("templates/", &bskyweb.TemplateFS, debug)
	e.HTTPErrorHandler = customHTTPErrorHandler

	// configure routes
	e.GET("/robots.txt", echo.WrapHandler(staticHandler))
	e.GET("/static/*", echo.WrapHandler(http.StripPrefix("/static/", staticHandler)))
	e.GET("/", server.WebHome)

	// generic routes
	e.GET("/search", server.WebGeneric)
	e.GET("/notifications", server.WebGeneric)
	e.GET("/settings", server.WebGeneric)
	e.GET("/settings/app-passwords", server.WebGeneric)
	e.GET("/settings/muted-accounts", server.WebGeneric)
	e.GET("/settings/blocked-accounts", server.WebGeneric)
	e.GET("/sys/debug", server.WebGeneric)
	e.GET("/sys/log", server.WebGeneric)
	e.GET("/support", server.WebGeneric)
	e.GET("/support/privacy", server.WebGeneric)
	e.GET("/support/tos", server.WebGeneric)
	e.GET("/support/community-guidelines", server.WebGeneric)
	e.GET("/support/copyright", server.WebGeneric)

	// profile endpoints; only first populates info
	e.GET("/profile/:handle", server.WebProfile)
	e.GET("/profile/:handle/follows", server.WebGeneric)
	e.GET("/profile/:handle/followers", server.WebGeneric)

	// post endpoints; only first populates info
	e.GET("/profile/:handle/post/:rkey", server.WebPost)
	e.GET("/profile/:handle/post/:rkey/liked-by", server.WebGeneric)
	e.GET("/profile/:handle/post/:rkey/reposted-by", server.WebGeneric)

	// Mailmodo
	e.POST("/waitlist", func(c echo.Context) error {
		email := strings.TrimSpace(c.FormValue("email"))
		if err := mailmodo.AddToList(c.Request().Context(), mailmodoListName, email); err != nil {
			return err
		}
		return c.JSON(http.StatusOK, map[string]bool{"success": true})
	})

	log.Infof("starting server address=%s", httpAddress)
	return e.Start(httpAddress)
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
	c.Render(code, "error.html", data)
}

// handler for endpoint that have no specific server-side handling
func (srv *Server) WebGeneric(c echo.Context) error {
	data := pongo2.Context{}
	return c.Render(http.StatusOK, "base.html", data)
}

func (srv *Server) WebHome(c echo.Context) error {
	data := pongo2.Context{}
	return c.Render(http.StatusOK, "home.html", data)
}

func (srv *Server) WebPost(c echo.Context) error {
	data := pongo2.Context{}
	handle := c.Param("handle")
	rkey := c.Param("rkey")
	// sanity check argument
	if len(handle) > 4 && len(handle) < 128 && len(rkey) > 0 {
		ctx := c.Request().Context()
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
				data["postView"] = tpv.Thread.FeedDefs_ThreadViewPost.Post
			}
		}

	}
	return c.Render(http.StatusOK, "post.html", data)
}

func (srv *Server) WebProfile(c echo.Context) error {
	data := pongo2.Context{}
	handle := c.Param("handle")
	// sanity check argument
	if len(handle) > 4 && len(handle) < 128 {
		ctx := c.Request().Context()
		pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, handle)
		if err != nil {
			log.Warnf("failed to fetch handle: %s\t%v", handle, err)
		} else {
			data["profileView"] = pv
		}
	}

	return c.Render(http.StatusOK, "profile.html", data)
}
