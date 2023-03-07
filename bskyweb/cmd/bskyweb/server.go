package main

import (
	"context"
	"html/template"
	"io"
	"net/http"
	"strings"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
	cliutil "github.com/bluesky-social/indigo/cmd/gosky/util"
	"github.com/bluesky-social/indigo/xrpc"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/urfave/cli/v2"
)

// TODO: embed templates in executable

type Template struct {
	templates *template.Template
}

type Server struct {
	xrpcc *xrpc.Client
}

func (t *Template) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func serve(cctx *cli.Context) error {

	// create a new session
	// TODO: does this work with no auth at all?
	xrpcc := &xrpc.Client{
		Client: cliutil.NewHttpClient(),
		Host:   cctx.String("pds-host"),
		Auth:   &xrpc.AuthInfo{},
	}

	server := Server{ xrpcc }

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "method=${method} path=${uri} status=${status} latency=${latency_human}\n",
	}))
	e.Renderer = &Template{
		templates: template.Must(template.ParseGlob("templates/*.html")),
	}
	e.HTTPErrorHandler = customHTTPErrorHandler

	// configure routes
	e.File("/robots.txt", "static/robots.txt")
	e.Static("/static", "static")

	e.GET("/", server.WebHome)

	// generic routes
	e.GET("/contacts", server.WebGeneric)
	e.GET("/search", server.WebGeneric)
	e.GET("/notifications", server.WebGeneric)
	e.GET("/settings", server.WebGeneric)
	e.GET("/settings", server.WebGeneric)

	// profile endpoints; only first populates info
	e.GET("/profile/:handle", server.WebProfile)
	e.GET("/profile/:handle/follows", server.WebGeneric)
	e.GET("/profile/:handle/following", server.WebGeneric)

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
	data := map[string]interface{}{
		"statusCode": code,
		"skipBundle": true,
	}
	c.Render(code, "error.html", data)
}

// handler for endpoint that have no specific server-side handling
func (srv *Server) WebGeneric(c echo.Context) error {
	data := map[string]interface{}{}
	return c.Render(http.StatusOK, "base.html", data)
}

func (srv *Server) WebHome(c echo.Context) error {
	data := map[string]interface{}{}
	return c.Render(http.StatusOK, "home.html", data)
}

func (srv *Server) WebPost(c echo.Context) error {
	data := map[string]interface{}{}
	return c.Render(http.StatusOK, "post.html", data)
}

func (srv *Server) WebProfile(c echo.Context) error {
	ctx := context.TODO()
	data := map[string]interface{}{}
	handle := c.Param("handle")
	// sanity check argument
	if (len(handle) > 4 && len(handle) < 128 && strings.HasPrefix(handle, "did:")) {
		pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, handle)
		if err != nil {
			log.Warnf("failed to fetch handle: %s", handle)
		} else {
			data["profileView"] = pv
		}
	}

	return c.Render(http.StatusOK, "profile.html", data)
}
