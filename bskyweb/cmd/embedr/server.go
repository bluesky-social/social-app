package main

import (
	"context"
	"errors"
	"fmt"
	"html/template"
	"io/fs"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
	"github.com/bluesky-social/indigo/atproto/syntax"
	"github.com/bluesky-social/indigo/util/cliutil"
	"github.com/bluesky-social/indigo/xrpc"
	"github.com/bluesky-social/social-app/bskyweb"

	"github.com/klauspost/compress/gzhttp"
	"github.com/klauspost/compress/gzip"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/urfave/cli/v2"
)

type Server struct {
	echo  *echo.Echo
	httpd *http.Server
	xrpcc *xrpc.Client
}

func serve(cctx *cli.Context) error {
	debug := cctx.Bool("debug")
	httpAddress := cctx.String("http-address")
	appviewHost := cctx.String("appview-host")

	// Echo
	e := echo.New()

	// create a new session (no auth)
	xrpcc := &xrpc.Client{
		Client: cliutil.NewHttpClient(),
		Host:   appviewHost,
	}

	// httpd
	var (
		httpTimeout          = 2 * time.Minute
		httpMaxHeaderBytes   = 2 * (1024 * 1024)
		gzipMinSizeBytes     = 1024 * 2
		gzipCompressionLevel = gzip.BestSpeed
		gzipExceptMIMETypes  = []string{"image/png"}
	)

	// Wrap the server handler in a gzip handler to compress larger responses.
	gzipHandler, err := gzhttp.NewWrapper(
		gzhttp.MinSize(gzipMinSizeBytes),
		gzhttp.CompressionLevel(gzipCompressionLevel),
		gzhttp.ExceptContentTypes(gzipExceptMIMETypes),
	)
	if err != nil {
		return err
	}

	//
	// server
	//
	server := &Server{
		echo:  e,
		xrpcc: xrpcc,
	}

	// Create the HTTP server.
	server.httpd = &http.Server{
		Handler:        gzipHandler(server),
		Addr:           httpAddress,
		WriteTimeout:   httpTimeout,
		ReadTimeout:    httpTimeout,
		MaxHeaderBytes: httpMaxHeaderBytes,
	}

	e.HideBanner = true

	tmpl := &Template{
		templates: template.Must(template.ParseGlob("embed-templates/*.html")),
	}
	e.Renderer = tmpl
	e.HTTPErrorHandler = server.errorHandler

	e.IPExtractor = echo.ExtractIPFromXFFHeader()

	// SECURITY: Do not modify without due consideration.
	e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
		ContentTypeNosniff: "nosniff",
		XFrameOptions:      "SAMEORIGIN",
		HSTSMaxAge:         31536000, // 365 days
		// TODO:
		// ContentSecurityPolicy
		// XSSProtection
	}))
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		// Don't log requests for static content.
		Skipper: func(c echo.Context) bool {
			return strings.HasPrefix(c.Request().URL.Path, "/embed-static")
		},
	}))
	e.Use(middleware.RateLimiterWithConfig(middleware.RateLimiterConfig{
		Skipper: middleware.DefaultSkipper,
		Store: middleware.NewRateLimiterMemoryStoreWithConfig(
			middleware.RateLimiterMemoryStoreConfig{
				Rate:      10,              // requests per second
				Burst:     30,              // allow bursts
				ExpiresIn: 3 * time.Minute, // garbage collect entries older than 3 minutes
			},
		),
		IdentifierExtractor: func(ctx echo.Context) (string, error) {
			id := ctx.RealIP()
			return id, nil
		},
		DenyHandler: func(c echo.Context, identifier string, err error) error {
			return c.String(http.StatusTooManyRequests, "Your request has been rate limited. Please try again later. Contact support@bsky.app if you believe this was a mistake.\n")
		},
	}))

	// redirect trailing slash to non-trailing slash.
	// all of our current endpoints have no trailing slash.
	e.Use(middleware.RemoveTrailingSlashWithConfig(middleware.TrailingSlashConfig{
		RedirectCode: http.StatusFound,
	}))

	//
	// configure routes
	//
	// static files
	staticHandler := http.FileServer(func() http.FileSystem {
		if debug {
			log.Debugf("serving static file from the local file system")
			return http.FS(os.DirFS("static"))
		}
		fsys, err := fs.Sub(bskyweb.StaticFS, "static")
		if err != nil {
			log.Fatal(err)
		}
		return http.FS(fsys)
	}())

	e.GET("/robots.txt", echo.WrapHandler(staticHandler))
	e.GET("/ips-v4", echo.WrapHandler(staticHandler))
	e.GET("/ips-v6", echo.WrapHandler(staticHandler))
	e.GET("/.well-known/*", echo.WrapHandler(staticHandler))
	e.GET("/security.txt", func(c echo.Context) error {
		return c.Redirect(http.StatusMovedPermanently, "/.well-known/security.txt")
	})
	e.GET("/static/*", echo.WrapHandler(http.StripPrefix("/static/", staticHandler)), func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			path := c.Request().URL.Path
			maxAge := 1 * (60 * 60) // default is 1 hour

			// Cache javascript and images files for 1 week, which works because
			// they're always versioned (e.g. /static/js/main.64c14927.js)
			if strings.HasPrefix(path, "/static/js/") || strings.HasPrefix(path, "/static/images/") {
				maxAge = 7 * (60 * 60 * 24) // 1 week
			}

			c.Response().Header().Set("Cache-Control", fmt.Sprintf("public, max-age=%d", maxAge))
			return next(c)
		}
	})

	// actual routes
	e.GET("/", server.WebHome)
	e.GET("/embed.js", echo.WrapHandler(staticHandler))
	e.GET("/oembed", server.WebOEmbed)
	e.GET("/embed/did/app.bsky.feed.post/rkey", server.WebPostEmbed)

	// Start the server.
	log.Infof("starting server address=%s", httpAddress)
	go func() {
		if err := server.httpd.ListenAndServe(); err != nil {
			if !errors.Is(err, http.ErrServerClosed) {
				log.Errorf("HTTP server shutting down unexpectedly: %s", err)
			}
		}
	}()

	// Wait for a signal to exit.
	log.Info("registering OS exit signal handler")
	quit := make(chan struct{})
	exitSignals := make(chan os.Signal, 1)
	signal.Notify(exitSignals, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		sig := <-exitSignals
		log.Infof("received OS exit signal: %s", sig)

		// Shut down the HTTP server.
		if err := server.Shutdown(); err != nil {
			log.Errorf("HTTP server shutdown error: %s", err)
		}

		// Trigger the return that causes an exit.
		close(quit)
	}()
	<-quit
	log.Infof("graceful shutdown complete")
	return nil
}

func (srv *Server) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	srv.echo.ServeHTTP(rw, req)
}

func (srv *Server) Shutdown() error {
	log.Info("shutting down")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	return srv.httpd.Shutdown(ctx)
}

func (srv *Server) errorHandler(err error, c echo.Context) {
	code := http.StatusInternalServerError
	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
	}
	c.Logger().Error(err)
	data := map[string]interface{}{
		"statusCode": code,
	}
	c.Render(code, "error.html", data)
}

func (srv *Server) WebHome(c echo.Context) error {
	data := map[string]interface{}{}
	return c.Render(http.StatusOK, "home.html", data)
}

func (srv *Server) WebOEmbed(c echo.Context) error {
	data := map[string]interface{}{}
	return c.Render(http.StatusOK, "oembed.html", data)
}

func (srv *Server) WebPostEmbed(c echo.Context) error {
	ctx := c.Request().Context()
	data := map[string]interface{}{}

	// sanity check arguments. don't 4xx, just let app handle if not expected format
	rkeyParam := c.Param("rkey")
	rkey, err := syntax.ParseRecordKey(rkeyParam)
	if err != nil {
		return c.Render(http.StatusOK, "postEmbed.html", data)
	}
	handleOrDIDParam := c.Param("handleOrDID")
	handleOrDID, err := syntax.ParseAtIdentifier(handleOrDIDParam)
	if err != nil {
		return c.Render(http.StatusOK, "postEmbed.html", data)
	}

	identifier := handleOrDID.Normalize().String()

	// requires two fetches: first fetch profile (!)
	pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, identifier)
	if err != nil {
		log.Warnf("failed to fetch profile for: %s\t%v", identifier, err)
		return c.Render(http.StatusOK, "postEmbed.html", data)
	}
	unauthedViewingOkay := true
	for _, label := range pv.Labels {
		if label.Src == pv.Did && label.Val == "!no-unauthenticated" {
			unauthedViewingOkay = false
		}
	}

	if !unauthedViewingOkay {
		return c.Render(http.StatusOK, "postEmbed.html", data)
	}
	did := pv.Did
	data["did"] = did

	// then fetch the post thread (with extra context)
	uri := fmt.Sprintf("at://%s/app.bsky.feed.post/%s", did, rkey)
	tpv, err := appbsky.FeedGetPostThread(ctx, srv.xrpcc, 1, 0, uri)
	if err != nil {
		log.Warnf("failed to fetch post: %s\t%v", uri, err)
		return c.Render(http.StatusOK, "postEmbed.html", data)
	}
	req := c.Request()
	postView := tpv.Thread.FeedDefs_ThreadViewPost.Post
	data["postView"] = postView
	data["requestURI"] = fmt.Sprintf("https://%s%s", req.Host, req.URL.Path)
	if postView.Embed != nil {
		if postView.Embed.EmbedImages_View != nil {
			var thumbUrls []string
			for i := range postView.Embed.EmbedImages_View.Images {
				thumbUrls = append(thumbUrls, postView.Embed.EmbedImages_View.Images[i].Thumb)
			}
			data["imgThumbUrls"] = thumbUrls
		} else if postView.Embed.EmbedRecordWithMedia_View != nil && postView.Embed.EmbedRecordWithMedia_View.Media != nil && postView.Embed.EmbedRecordWithMedia_View.Media.EmbedImages_View != nil {
			var thumbUrls []string
			for i := range postView.Embed.EmbedRecordWithMedia_View.Media.EmbedImages_View.Images {
				thumbUrls = append(thumbUrls, postView.Embed.EmbedRecordWithMedia_View.Media.EmbedImages_View.Images[i].Thumb)
			}
			data["imgThumbUrls"] = thumbUrls
		}
	}

	if postView.Record != nil {
		postRecord, ok := postView.Record.Val.(*appbsky.FeedPost)
		if ok {
			_ = postRecord
			data["postText"] = "" // XXX
		}
	}

	return c.Render(http.StatusOK, "postEmbed.html", data)
}
