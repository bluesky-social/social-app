package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"io/ioutil"
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

	"github.com/flosch/pongo2/v6"
	"github.com/klauspost/compress/gzhttp"
	"github.com/klauspost/compress/gzip"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/urfave/cli/v2"
)

type Server struct {
	echo     *echo.Echo
	httpd    *http.Server
	mailmodo *Mailmodo
	xrpcc    *xrpc.Client
}

func serve(cctx *cli.Context) error {
	debug := cctx.Bool("debug")
	httpAddress := cctx.String("http-address")
	appviewHost := cctx.String("appview-host")
	mailmodoAPIKey := cctx.String("mailmodo-api-key")
	mailmodoListName := cctx.String("mailmodo-list-name")

	// Echo
	e := echo.New()

	// Mailmodo client.
	mailmodo := NewMailmodo(mailmodoAPIKey, mailmodoListName)

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
		echo:     e,
		mailmodo: mailmodo,
		xrpcc:    xrpcc,
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
	e.Renderer = NewRenderer("templates/", &bskyweb.TemplateFS, debug)
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
			return strings.HasPrefix(c.Request().URL.Path, "/static")
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
			return c.String(http.StatusTooManyRequests, "Your request has been rate limited. Please try again later. Contact security@bsky.app if you believe this was a mistake.\n")
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

	// home
	e.GET("/", server.WebHome)

	// generic routes
	e.GET("/search", server.WebGeneric)
	e.GET("/feeds", server.WebGeneric)
	e.GET("/notifications", server.WebGeneric)
	e.GET("/lists", server.WebGeneric)
	e.GET("/moderation", server.WebGeneric)
	e.GET("/moderation/modlists", server.WebGeneric)
	e.GET("/moderation/muted-accounts", server.WebGeneric)
	e.GET("/moderation/blocked-accounts", server.WebGeneric)
	e.GET("/settings", server.WebGeneric)
	e.GET("/settings/language", server.WebGeneric)
	e.GET("/settings/app-passwords", server.WebGeneric)
	e.GET("/settings/home-feed", server.WebGeneric)
	e.GET("/settings/saved-feeds", server.WebGeneric)
	e.GET("/settings/threads", server.WebGeneric)
	e.GET("/settings/external-embeds", server.WebGeneric)
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
	e.GET("/profile/:handle/lists/:rkey", server.WebGeneric)
	e.GET("/profile/:handle/feed/:rkey", server.WebGeneric)
	e.GET("/profile/:handle/feed/:rkey/liked-by", server.WebGeneric)

	// profile RSS feed (DID not handle)
	e.GET("/profile/:ident/rss", server.WebProfileRSS)

	// post endpoints; only first populates info
	e.GET("/profile/:handle/post/:rkey", server.WebPost)
	e.GET("/profile/:handle/post/:rkey/liked-by", server.WebGeneric)
	e.GET("/profile/:handle/post/:rkey/reposted-by", server.WebGeneric)

	// Mailmodo
	e.POST("/api/waitlist", server.apiWaitlist)

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
	ctx := c.Request().Context()
	data := pongo2.Context{}

	// sanity check arguments. don't 4xx, just let app handle if not expected format
	rkeyParam := c.Param("rkey")
	rkey, err := syntax.ParseRecordKey(rkeyParam)
	if err != nil {
		return c.Render(http.StatusOK, "post.html", data)
	}
	handleParam := c.Param("handle")
	handle, err := syntax.ParseHandle(handleParam)
	if err != nil {
		return c.Render(http.StatusOK, "post.html", data)
	}
	handle = handle.Normalize()

	// requires two fetches: first fetch profile (!)
	pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, handle.String())
	if err != nil {
		log.Warnf("failed to fetch handle: %s\t%v", handle, err)
		return c.Render(http.StatusOK, "post.html", data)
	}
	unauthedViewingOkay := true
	for _, label := range pv.Labels {
		if label.Src == pv.Did && label.Val == "!no-unauthenticated" {
			unauthedViewingOkay = false
		}
	}

	if !unauthedViewingOkay {
		return c.Render(http.StatusOK, "post.html", data)
	}
	did := pv.Did
	data["did"] = did

	// then fetch the post thread (with extra context)
	uri := fmt.Sprintf("at://%s/app.bsky.feed.post/%s", did, rkey)
	tpv, err := appbsky.FeedGetPostThread(ctx, srv.xrpcc, 1, 0, uri)
	if err != nil {
		log.Warnf("failed to fetch post: %s\t%v", uri, err)
		return c.Render(http.StatusOK, "post.html", data)
	}
	req := c.Request()
	postView := tpv.Thread.FeedDefs_ThreadViewPost.Post
	data["postView"] = postView
	data["requestURI"] = fmt.Sprintf("https://%s%s", req.Host, req.URL.Path)
	if postView.Embed != nil && postView.Embed.EmbedImages_View != nil {
		var thumbUrls []string
		for i := range postView.Embed.EmbedImages_View.Images {
			thumbUrls = append(thumbUrls, postView.Embed.EmbedImages_View.Images[i].Thumb)
		}
		data["imgThumbUrls"] = thumbUrls
	}
	return c.Render(http.StatusOK, "post.html", data)
}

func (srv *Server) WebProfile(c echo.Context) error {
	ctx := c.Request().Context()
	data := pongo2.Context{}

	// sanity check arguments. don't 4xx, just let app handle if not expected format
	handleParam := c.Param("handle")
	handle, err := syntax.ParseHandle(handleParam)
	if err != nil {
		return c.Render(http.StatusOK, "profile.html", data)
	}
	handle = handle.Normalize()

	pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, handle.String())
	if err != nil {
		log.Warnf("failed to fetch handle: %s\t%v", handle, err)
		return c.Render(http.StatusOK, "profile.html", data)
	}
	unauthedViewingOkay := true
	for _, label := range pv.Labels {
		if label.Src == pv.Did && label.Val == "!no-unauthenticated" {
			unauthedViewingOkay = false
		}
	}
	if !unauthedViewingOkay {
		return c.Render(http.StatusOK, "profile.html", data)
	}
	req := c.Request()
	data["profileView"] = pv
	data["requestURI"] = fmt.Sprintf("https://%s%s", req.Host, req.URL.Path)
	data["requestHost"] = req.Host
	return c.Render(http.StatusOK, "profile.html", data)
}

func (srv *Server) apiWaitlist(c echo.Context) error {
	type jsonError struct {
		Error string `json:"error"`
	}

	// Read the API request.
	type apiRequest struct {
		Email string `json:"email"`
	}

	bodyReader := http.MaxBytesReader(c.Response(), c.Request().Body, 16*1024)
	payload, err := ioutil.ReadAll(bodyReader)
	if err != nil {
		return err
	}
	var req apiRequest
	if err := json.Unmarshal(payload, &req); err != nil {
		return c.JSON(http.StatusBadRequest, jsonError{Error: "Invalid API request"})
	}

	if req.Email == "" {
		return c.JSON(http.StatusBadRequest, jsonError{Error: "Please enter a valid email address."})
	}

	if err := srv.mailmodo.AddToList(c.Request().Context(), req.Email); err != nil {
		log.Errorf("adding email to waitlist failed: %s", err)
		return c.JSON(http.StatusBadRequest, jsonError{
			Error: "Storing email in waitlist failed. Please enter a valid email address.",
		})
	}
	return c.JSON(http.StatusOK, map[string]bool{"success": true})
}
