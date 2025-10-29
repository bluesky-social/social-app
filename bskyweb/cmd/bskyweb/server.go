package main

import (
	"bytes"
	"context"
	"crypto/subtle"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"net/http"
	"net/netip"
	"net/url"
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
	echo  *echo.Echo
	httpd *http.Server
	xrpcc *xrpc.Client
	cfg   *Config

	ipccClient http.Client
}

type Config struct {
	debug         bool
	httpAddress   string
	appviewHost   string
	ogcardHost    string
	linkHost      string
	ipccHost      string
	staticCDNHost string
}

func serve(cctx *cli.Context) error {
	debug := cctx.Bool("debug")
	httpAddress := cctx.String("http-address")
	appviewHost := cctx.String("appview-host")
	ogcardHost := cctx.String("ogcard-host")
	linkHost := cctx.String("link-host")
	ipccHost := cctx.String("ipcc-host")
	basicAuthPassword := cctx.String("basic-auth-password")
	corsOrigins := cctx.StringSlice("cors-allowed-origins")
	staticCDNHost := cctx.String("static-cdn-host")
	staticCDNHost = strings.TrimSuffix(staticCDNHost, "/")
	canonicalInstance := cctx.Bool("bsky-canonical-instance")
	robotsDisallowAll := cctx.Bool("robots-disallow-all")

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
		cfg: &Config{
			debug:         debug,
			httpAddress:   httpAddress,
			appviewHost:   appviewHost,
			ogcardHost:    ogcardHost,
			linkHost:      linkHost,
			ipccHost:      ipccHost,
			staticCDNHost: staticCDNHost,
		},
		ipccClient: http.Client{
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					InsecureSkipVerify: true,
				},
			},
		},
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

	// optional password gating of entire web interface
	if basicAuthPassword != "" {
		e.Use(middleware.BasicAuth(func(username, password string, c echo.Context) (bool, error) {
			// Be careful to use constant time comparison to prevent timing attacks
			if subtle.ConstantTimeCompare([]byte(username), []byte("admin")) == 1 &&
				subtle.ConstantTimeCompare([]byte(password), []byte(basicAuthPassword)) == 1 {
				return true, nil
			}
			return false, nil
		}))
	}

	// redirect trailing slash to non-trailing slash.
	// all of our current endpoints have no trailing slash.
	e.Use(middleware.RemoveTrailingSlashWithConfig(middleware.TrailingSlashConfig{
		RedirectCode: http.StatusFound,
	}))

	// CORS middleware
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: corsOrigins,
		AllowMethods: []string{http.MethodGet, http.MethodHead, http.MethodOptions},
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

	// enable some special endpoints for the "canonical" deployment (bsky.app). not having these enabled should *not* impact regular operation
	if canonicalInstance {
		e.GET("/ips-v4", echo.WrapHandler(staticHandler))
		e.GET("/ips-v6", echo.WrapHandler(staticHandler))
		e.GET("/security.txt", func(c echo.Context) error {
			return c.Redirect(http.StatusMovedPermanently, "/.well-known/security.txt")
		})
		e.GET("/.well-known/*", echo.WrapHandler(staticHandler))
	}

	// default to permissive, but Disallow all if flag set
	if robotsDisallowAll {
		e.File("/robots.txt", "static/robots-disallow-all.txt")
	} else {
		e.GET("/robots.txt", echo.WrapHandler(staticHandler))
	}

	e.GET("/iframe/youtube.html", echo.WrapHandler(staticHandler))
	e.GET("/static/*", echo.WrapHandler(http.StripPrefix("/static/", staticHandler)), func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Response().Before(func() {
				if c.Response().Status >= 300 {
					return
				}

				path := c.Request().URL.Path
				maxAge := 1 * (60 * 60) // default is 1 hour

				// all assets in /static/js, /static/css, /static/media are content-hashed and can be cached for a long time
				if strings.HasPrefix(path, "/static/js/") || strings.HasPrefix(path, "/static/css/") || strings.HasPrefix(path, "/static/media/") {
					maxAge = 365 * (60 * 60 * 24) // 1 year
				}

				c.Response().Header().Set("Cache-Control", fmt.Sprintf("public, max-age=%d", maxAge))
			})
			return next(c)
		}
	})

	// home
	e.GET("/", server.WebHome)

	// download
	e.GET("/download", server.Download)

	// generic routes
	e.GET("/hashtag/:tag", server.WebGeneric)
	e.GET("/topic/:topic", server.WebGeneric)
	e.GET("/search", server.WebGeneric)
	e.GET("/feeds", server.WebGeneric)
	e.GET("/notifications", server.WebGeneric)
	e.GET("/notifications/settings", server.WebGeneric)
	e.GET("/notifications/activity", server.WebGeneric)
	e.GET("/lists", server.WebGeneric)
	e.GET("/moderation", server.WebGeneric)
	e.GET("/moderation/modlists", server.WebGeneric)
	e.GET("/moderation/muted-accounts", server.WebGeneric)
	e.GET("/moderation/blocked-accounts", server.WebGeneric)
	e.GET("/moderation/verification-settings", server.WebGeneric)
	e.GET("/settings", server.WebGeneric)
	e.GET("/settings/language", server.WebGeneric)
	e.GET("/settings/app-passwords", server.WebGeneric)
	e.GET("/settings/following-feed", server.WebGeneric)
	e.GET("/settings/saved-feeds", server.WebGeneric)
	e.GET("/settings/threads", server.WebGeneric)
	e.GET("/settings/external-embeds", server.WebGeneric)
	e.GET("/settings/accessibility", server.WebGeneric)
	e.GET("/settings/appearance", server.WebGeneric)
	e.GET("/settings/account", server.WebGeneric)
	e.GET("/settings/privacy-and-security", server.WebGeneric)
	e.GET("/settings/privacy-and-security/activity", server.WebGeneric)
	e.GET("/settings/content-and-media", server.WebGeneric)
	e.GET("/settings/interests", server.WebGeneric)
	e.GET("/settings/about", server.WebGeneric)
	e.GET("/settings/notifications", server.WebGeneric)
	e.GET("/settings/notifications/replies", server.WebGeneric)
	e.GET("/settings/notifications/mentions", server.WebGeneric)
	e.GET("/settings/notifications/quotes", server.WebGeneric)
	e.GET("/settings/notifications/likes", server.WebGeneric)
	e.GET("/settings/notifications/reposts", server.WebGeneric)
	e.GET("/settings/notifications/new-followers", server.WebGeneric)
	e.GET("/settings/notifications/likes-on-reposts", server.WebGeneric)
	e.GET("/settings/notifications/reposts-on-reposts", server.WebGeneric)
	e.GET("/settings/notifications/activity", server.WebGeneric)
	e.GET("/settings/notifications/miscellaneous", server.WebGeneric)
	e.GET("/settings/app-icon", server.WebGeneric)
	e.GET("/sys/debug", server.WebGeneric)
	e.GET("/sys/debug-mod", server.WebGeneric)
	e.GET("/sys/log", server.WebGeneric)
	e.GET("/support", server.WebGeneric)
	e.GET("/support/privacy", server.WebGeneric)
	e.GET("/support/tos", server.WebGeneric)
	e.GET("/support/community-guidelines", server.WebGeneric)
	e.GET("/support/copyright", server.WebGeneric)
	e.GET("/intent/compose", server.WebGeneric)
	e.GET("/intent/verify-email", server.WebGeneric)
	e.GET("/intent/age-assurance", server.WebGeneric)
	e.GET("/messages", server.WebGeneric)
	e.GET("/messages/:conversation", server.WebGeneric)

	// profile endpoints; only first populates info
	e.GET("/profile/:handleOrDID", server.WebProfile)
	e.GET("/profile/:handleOrDID/follows", server.WebGeneric)
	e.GET("/profile/:handleOrDID/followers", server.WebGeneric)
	e.GET("/profile/:handleOrDID/known-followers", server.WebGeneric)
	e.GET("/profile/:handleOrDID/search", server.WebGeneric)
	e.GET("/profile/:handleOrDID/lists/:rkey", server.WebGeneric)
	e.GET("/profile/:handleOrDID/feed/:rkey", server.WebFeed)
	e.GET("/profile/:handleOrDID/feed/:rkey/liked-by", server.WebGeneric)
	e.GET("/profile/:handleOrDID/labeler/liked-by", server.WebGeneric)

	// profile RSS feed (DID not handle)
	e.GET("/profile/:ident/rss", server.WebProfileRSS)

	// post endpoints; only first populates info
	e.GET("/profile/:handleOrDID/post/:rkey", server.WebPost)
	e.GET("/profile/:handleOrDID/post/:rkey/liked-by", server.WebGeneric)
	e.GET("/profile/:handleOrDID/post/:rkey/reposted-by", server.WebGeneric)
	e.GET("/profile/:handleOrDID/post/:rkey/quotes", server.WebGeneric)

	// starter packs
	e.GET("/starter-pack/:handleOrDID/:rkey", server.WebStarterPack)
	e.GET("/starter-pack-short/:code", server.WebGeneric)
	e.GET("/start/:handleOrDID/:rkey", server.WebStarterPack)

	// bookmarks
	e.GET("/saved", server.WebGeneric)

	// ipcc
	e.GET("/ipcc", server.WebIpCC)

	if linkHost != "" {
		linkUrl, err := url.Parse(linkHost)
		if err != nil {
			return err
		}
		e.Group("/:linkId", server.LinkProxyMiddleware(linkUrl))
	}

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

// NewTemplateContext returns a new pongo2 context with some default values.
func (srv *Server) NewTemplateContext() pongo2.Context {
	return pongo2.Context{
		"staticCDNHost": srv.cfg.staticCDNHost,
		"favicon":       fmt.Sprintf("%s/static/favicon.png", srv.cfg.staticCDNHost),
	}
}

func (srv *Server) errorHandler(err error, c echo.Context) {
	code := http.StatusInternalServerError
	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
	}
	c.Logger().Error(err)
	data := srv.NewTemplateContext()
	data["statusCode"] = code
	c.Render(code, "error.html", data)
}

// Handler for redirecting to the download page.
func (srv *Server) Download(c echo.Context) error {
	ua := c.Request().UserAgent()
	if strings.Contains(ua, "Android") {
		return c.Redirect(http.StatusFound, "https://play.google.com/store/apps/details?id=xyz.blueskyweb.app")
	}

	if strings.Contains(ua, "iPhone") || strings.Contains(ua, "iPad") || strings.Contains(ua, "iPod") {
		return c.Redirect(http.StatusFound, "https://apps.apple.com/tr/app/bluesky-social/id6444370199")
	}

	return c.Redirect(http.StatusFound, "/")
}

// Handler for proxying top-level paths to link service, which ends up serving a redirect
func (srv *Server) LinkProxyMiddleware(url *url.URL) echo.MiddlewareFunc {
	return middleware.ProxyWithConfig(
		middleware.ProxyConfig{
			Balancer: middleware.NewRoundRobinBalancer(
				[]*middleware.ProxyTarget{{URL: url}},
			),
			Skipper: func(c echo.Context) bool {
				req := c.Request()
				if req.Method == "GET" &&
					strings.LastIndex(strings.TrimRight(req.URL.Path, "/"), "/") == 0 && // top-level path
					!strings.HasPrefix(req.URL.Path, "/_") { // e.g. /_health endpoint
					return false
				}
				return true
			},
			RetryCount: 2,
			ErrorHandler: func(c echo.Context, err error) error {
				return c.Redirect(302, "/")
			},
		},
	)
}

// handler for endpoint that have no specific server-side handling
func (srv *Server) WebGeneric(c echo.Context) error {
	data := srv.NewTemplateContext()
	return c.Render(http.StatusOK, "base.html", data)
}

func (srv *Server) WebHome(c echo.Context) error {
	data := srv.NewTemplateContext()
	return c.Render(http.StatusOK, "home.html", data)
}

// Posts that include these labels will not have embeds passed to the metadata
// template.
var hideEmbedLabels = map[string]bool{
	"nudity":            true,
	"porn":              true,
	"sexual":            true,
	"sexual-figurative": true,
	"graphic-media":     true,
	"self-harm":         true,
	"sensitive":         true,
}

func (srv *Server) WebPost(c echo.Context) error {
	ctx := c.Request().Context()
	data := srv.NewTemplateContext()

	// sanity check arguments. don't 4xx, just let app handle if not expected format
	rkeyParam := c.Param("rkey")
	rkey, err := syntax.ParseRecordKey(rkeyParam)
	if err != nil {
		return c.Render(http.StatusOK, "post.html", data)
	}
	handleOrDIDParam := c.Param("handleOrDID")
	handleOrDID, err := syntax.ParseAtIdentifier(handleOrDIDParam)
	if err != nil {
		return c.Render(http.StatusOK, "post.html", data)
	}

	identifier := handleOrDID.Normalize().String()

	// requires two fetches: first fetch profile (!)
	pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, identifier)
	if err != nil {
		log.Warnf("failed to fetch profile for: %s\t%v", identifier, err)
		return c.Render(http.StatusOK, "post.html", data)
	}
	unauthedViewingOkay := true
	for _, label := range pv.Labels {
		if label.Src == pv.Did && label.Val == "!no-unauthenticated" {
			unauthedViewingOkay = false
		}
	}

	req := c.Request()
	if !unauthedViewingOkay {
		// Provide minimal OpenGraph data for auth-required posts
		data["requestURI"] = fmt.Sprintf("https://%s%s", req.Host, req.URL.Path)
		data["requiresAuth"] = true
		data["profileHandle"] = pv.Handle
		if pv.DisplayName != nil {
			data["profileDisplayName"] = *pv.DisplayName
		}
		return c.Render(http.StatusOK, "post.html", data)
	}

	// then fetch the post thread (with extra context)
	uri := fmt.Sprintf("at://%s/app.bsky.feed.post/%s", pv.Did, rkey)
	tpv, err := appbsky.FeedGetPostThread(ctx, srv.xrpcc, 1, 0, uri)
	if err != nil {
		log.Warnf("failed to fetch post: %s\t%v", uri, err)
		return c.Render(http.StatusOK, "post.html", data)
	}

	postView := tpv.Thread.FeedDefs_ThreadViewPost.Post
	data["postView"] = postView
	data["requestURI"] = fmt.Sprintf("https://%s%s", req.Host, req.URL.Path)

	// If any undesirable labels are set, the embed will not be included in
	// metadata
	isEmbedHidden := false
	for _, label := range postView.Labels {
		isNeg := label.Neg != nil && *label.Neg
		if hideEmbedLabels[label.Val] && !isNeg {
			isEmbedHidden = true
			break
		}
	}

	if postView.Record != nil {
		postRecord, ok := postView.Record.Val.(*appbsky.FeedPost)
		if ok {
			data["postText"] = ExpandPostText(postRecord)

			if !isEmbedHidden && postRecord.Labels != nil && postRecord.Labels.LabelDefs_SelfLabels != nil {
				for _, label := range postRecord.Labels.LabelDefs_SelfLabels.Values {
					if hideEmbedLabels[label.Val] {
						isEmbedHidden = true
						break
					}
				}
			}
		}
	}

	if postView.Embed != nil && !isEmbedHidden {
		hasImages := postView.Embed.EmbedImages_View != nil
		hasMedia := postView.Embed.EmbedRecordWithMedia_View != nil && postView.Embed.EmbedRecordWithMedia_View.Media != nil && postView.Embed.EmbedRecordWithMedia_View.Media.EmbedImages_View != nil

		if hasImages {
			var thumbUrls []string
			for i := range postView.Embed.EmbedImages_View.Images {
				thumbUrls = append(thumbUrls, postView.Embed.EmbedImages_View.Images[i].Thumb)
			}
			data["imgThumbUrls"] = thumbUrls
		} else if hasMedia {
			var thumbUrls []string
			for i := range postView.Embed.EmbedRecordWithMedia_View.Media.EmbedImages_View.Images {
				thumbUrls = append(thumbUrls, postView.Embed.EmbedRecordWithMedia_View.Media.EmbedImages_View.Images[i].Thumb)
			}
			data["imgThumbUrls"] = thumbUrls
		}
	}

	return c.Render(http.StatusOK, "post.html", data)
}

func (srv *Server) WebStarterPack(c echo.Context) error {
	req := c.Request()
	ctx := req.Context()
	data := srv.NewTemplateContext()
	data["requestURI"] = fmt.Sprintf("https://%s%s", req.Host, req.URL.Path)
	// sanity check arguments. don't 4xx, just let app handle if not expected format
	rkeyParam := c.Param("rkey")
	rkey, err := syntax.ParseRecordKey(rkeyParam)
	if err != nil {
		log.Errorf("bad rkey: %v", err)
		return c.Render(http.StatusOK, "starterpack.html", data)
	}
	handleOrDIDParam := c.Param("handleOrDID")
	handleOrDID, err := syntax.ParseAtIdentifier(handleOrDIDParam)
	if err != nil {
		log.Errorf("bad identifier: %v", err)
		return c.Render(http.StatusOK, "starterpack.html", data)
	}
	identifier := handleOrDID.Normalize().String()
	starterPackURI := fmt.Sprintf("at://%s/app.bsky.graph.starterpack/%s", identifier, rkey)
	spv, err := appbsky.GraphGetStarterPack(ctx, srv.xrpcc, starterPackURI)
	if err != nil {
		log.Errorf("failed to fetch starter pack view for: %s\t%v", starterPackURI, err)
		return c.Render(http.StatusOK, "starterpack.html", data)
	}
	if spv.StarterPack == nil || spv.StarterPack.Record == nil {
		return c.Render(http.StatusOK, "starterpack.html", data)
	}
	rec, ok := spv.StarterPack.Record.Val.(*appbsky.GraphStarterpack)
	if !ok {
		return c.Render(http.StatusOK, "starterpack.html", data)
	}
	data["title"] = rec.Name
	if srv.cfg.ogcardHost != "" {
		data["imgThumbUrl"] = fmt.Sprintf("%s/start/%s/%s", srv.cfg.ogcardHost, identifier, rkey)
	}
	return c.Render(http.StatusOK, "starterpack.html", data)
}

func (srv *Server) WebProfile(c echo.Context) error {
	ctx := c.Request().Context()
	data := srv.NewTemplateContext()

	// sanity check arguments. don't 4xx, just let app handle if not expected format
	handleOrDIDParam := c.Param("handleOrDID")
	handleOrDID, err := syntax.ParseAtIdentifier(handleOrDIDParam)
	if err != nil {
		return c.Render(http.StatusOK, "profile.html", data)
	}
	identifier := handleOrDID.Normalize().String()

	pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, identifier)
	if err != nil {
		log.Warnf("failed to fetch profile for: %s\t%v", identifier, err)
		return c.Render(http.StatusOK, "profile.html", data)
	}
	unauthedViewingOkay := true
	for _, label := range pv.Labels {
		if label.Src == pv.Did && label.Val == "!no-unauthenticated" {
			unauthedViewingOkay = false
		}
	}

	req := c.Request()
	data["profileView"] = pv
	data["requestURI"] = fmt.Sprintf("https://%s%s", req.Host, req.URL.Path)
	data["requestHost"] = req.Host

	if !unauthedViewingOkay {
		data["requiresAuth"] = true
	}

	return c.Render(http.StatusOK, "profile.html", data)
}

func (srv *Server) WebFeed(c echo.Context) error {
	ctx := c.Request().Context()
	data := srv.NewTemplateContext()

	// sanity check arguments. don't 4xx, just let app handle if not expected format
	rkeyParam := c.Param("rkey")
	rkey, err := syntax.ParseRecordKey(rkeyParam)
	if err != nil {
		return c.Render(http.StatusOK, "feed.html", data)
	}
	handleOrDIDParam := c.Param("handleOrDID")
	handleOrDID, err := syntax.ParseAtIdentifier(handleOrDIDParam)
	if err != nil {
		return c.Render(http.StatusOK, "feed.html", data)
	}

	identifier := handleOrDID.Normalize().String()

	// requires two fetches: first fetch profile to get DID
	pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, identifier)
	if err != nil {
		log.Warnf("failed to fetch profile for: %s\t%v", identifier, err)
		return c.Render(http.StatusOK, "feed.html", data)
	}
	unauthedViewingOkay := true
	for _, label := range pv.Labels {
		if label.Src == pv.Did && label.Val == "!no-unauthenticated" {
			unauthedViewingOkay = false
		}
	}

	if !unauthedViewingOkay {
		return c.Render(http.StatusOK, "feed.html", data)
	}
	did := pv.Did
	data["did"] = did

	// then fetch the feed generator
	feedURI := fmt.Sprintf("at://%s/app.bsky.feed.generator/%s", did, rkey)
	fgv, err := appbsky.FeedGetFeedGenerator(ctx, srv.xrpcc, feedURI)
	if err != nil {
		log.Warnf("failed to fetch feed generator: %s\t%v", feedURI, err)
		return c.Render(http.StatusOK, "feed.html", data)
	}
	req := c.Request()
	data["feedView"] = fgv.View
	data["requestURI"] = fmt.Sprintf("https://%s%s", req.Host, req.URL.Path)

	return c.Render(http.StatusOK, "feed.html", data)
}

type IPCCRequest struct {
	IP string `json:"ip"`
}
type IPCCResponse struct {
	CC               string `json:"countryCode"`
	AgeRestrictedGeo bool   `json:"isAgeRestrictedGeo,omitempty"`
	AgeBlockedGeo    bool   `json:"isAgeBlockedGeo,omitempty"`
}

// This product includes GeoLite2 Data created by MaxMind, available from https://www.maxmind.com.
func (srv *Server) WebIpCC(c echo.Context) error {
	realIP := c.RealIP()
	addr, err := netip.ParseAddr(realIP)
	if err != nil {
		log.Warnf("could not parse IP %q %s", realIP, err)
		return c.JSON(400, IPCCResponse{})
	}
	var request []byte
	if addr.Is4() {
		ip4 := addr.As4()
		var dest [8]byte
		base64.StdEncoding.Encode(dest[:], ip4[:])
		request, _ = json.Marshal(IPCCRequest{IP: string(dest[:])})
	} else if addr.Is6() {
		ip6 := addr.As16()
		var dest [24]byte
		base64.StdEncoding.Encode(dest[:], ip6[:])
		request, _ = json.Marshal(IPCCRequest{IP: string(dest[:])})
	}

	ipccUrlBuilder, err := url.Parse(srv.cfg.ipccHost)
	if err != nil {
		log.Errorf("ipcc misconfigured bad url %s", err)
		return c.JSON(500, IPCCResponse{})
	}
	ipccUrlBuilder.Path = "ipccdata.IpCcService/Lookup"
	ipccUrl := ipccUrlBuilder.String()
	postBodyReader := bytes.NewReader(request)
	response, err := srv.ipccClient.Post(ipccUrl, "application/json", postBodyReader)
	if err != nil {
		log.Warnf("ipcc backend error %s", err)
		return c.JSON(500, IPCCResponse{})
	}
	defer response.Body.Close()
	dec := json.NewDecoder(response.Body)
	var outResponse IPCCResponse
	err = dec.Decode(&outResponse)
	if err != nil {
		log.Warnf("ipcc bad response %s", err)
		return c.JSON(500, IPCCResponse{})
	}
	return c.JSON(200, outResponse)
}
