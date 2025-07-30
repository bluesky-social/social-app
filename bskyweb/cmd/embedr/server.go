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

	_ "net/http/pprof"

	"github.com/bluesky-social/indigo/atproto/identity"
	"github.com/bluesky-social/indigo/util/cliutil"
	"github.com/bluesky-social/indigo/xrpc"
	"github.com/bluesky-social/social-app/bskyweb"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/labstack/echo-contrib/echoprometheus"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/klauspost/compress/gzhttp"
	"github.com/klauspost/compress/gzip"
	"github.com/urfave/cli/v2"
)

type Server struct {
	echo         *echo.Echo
	httpd        *http.Server
	metricsHttpd *http.Server
	xrpcc        *xrpc.Client
	dir          identity.Directory
}

func serve(cctx *cli.Context) error {
	debug := cctx.Bool("debug")
	httpAddress := cctx.String("http-address")
	appviewHost := cctx.String("appview-host")
	metricsAddress := cctx.String("metrics-address")

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

	metricsMux := http.DefaultServeMux
	metricsMux.Handle("/metrics", promhttp.Handler())

	metricsHttpd := &http.Server{
		Addr:    metricsAddress,
		Handler: metricsMux,
	}

	go func() {
		if err := metricsHttpd.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("failed to start metrics server", "error", err)
		}
	}()

	//
	// server
	//
	server := &Server{
		echo:         e,
		xrpcc:        xrpcc,
		dir:          identity.DefaultDirectory(),
		metricsHttpd: metricsHttpd,
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
		templates: template.Must(template.ParseFS(bskyweb.EmbedrTemplateFS, "embedr-templates/*.html")),
	}
	e.Renderer = tmpl
	e.HTTPErrorHandler = server.errorHandler

	e.IPExtractor = echo.ExtractIPFromXFFHeader()

	// SECURITY: Do not modify without due consideration.
	e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
		ContentTypeNosniff: "nosniff",
		// diable XFrameOptions; we're embedding here!
		HSTSMaxAge: 31536000, // 365 days
		// TODO:
		// ContentSecurityPolicy
		// XSSProtection
	}))
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		// Don't log requests for static content.
		Skipper: func(c echo.Context) bool {
			return strings.HasPrefix(c.Request().URL.Path, "/static")
		},
	}))
	e.Use(middleware.RateLimiterWithConfig(middleware.RateLimiterConfig{
		Skipper: middleware.DefaultSkipper,
		Store: middleware.NewRateLimiterMemoryStoreWithConfig(
			middleware.RateLimiterMemoryStoreConfig{
				Rate:      20,              // requests per second
				Burst:     150,             // allow bursts
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

	e.Use(echoprometheus.NewMiddleware(""))

	//
	// configure routes
	//
	// static files
	staticHandler := http.FileServer(func() http.FileSystem {
		if debug {
			log.Debugf("serving static file from the local file system")
			return http.FS(os.DirFS("embedr-static"))
		}
		fsys, err := fs.Sub(bskyweb.EmbedrStaticFS, "embedr-static")
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
	e.GET("/iframe-resize.js", echo.WrapHandler(staticHandler))
	e.GET("/embed.js", echo.WrapHandler(staticHandler))
	e.GET("/oembed", server.WebOEmbed)
	e.GET("/embed/:did/app.bsky.feed.post/:rkey", server.WebPostEmbed)

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

	// Shutdown metrics server too
	if srv.metricsHttpd != nil {
		srv.metricsHttpd.Shutdown(ctx)
	}

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
