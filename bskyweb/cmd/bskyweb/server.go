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
	"io"
	"io/fs"
	"log/slog"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"os"
	"os/signal"
	"regexp"
	"strings"
	"syscall"
	"time"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
	chat "github.com/bluesky-social/indigo/api/chat"
	"github.com/bluesky-social/indigo/atproto/syntax"
	"github.com/bluesky-social/indigo/util/cliutil"
	"github.com/bluesky-social/indigo/xrpc"
	"github.com/bluesky-social/social-app/bskyweb"

	"github.com/flosch/pongo2/v6"
	"github.com/klauspost/compress/gzhttp"
	"github.com/klauspost/compress/gzip"
	"github.com/labstack/echo-contrib/echoprometheus"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/urfave/cli/v2"
)

type Server struct {
	echo         *echo.Echo
	httpd        *http.Server
	metricsHttpd *http.Server
	xrpcc        *xrpc.Client
	chatXrpcc    *xrpc.Client
	cfg          *Config

	ipccClient http.Client

	// sitemapClient is used for fetching sitemaps from the appview. It has
	// DisableCompression set to true so that gzipped responses are passed
	// through without being decompressed.
	sitemapClient http.Client
}

type Config struct {
	debug         bool
	httpAddress   string
	appviewHost   string
	chatHost      string
	ogcardHost    string
	linkHost      string
	ipccHost      string
	staticCDNHost string
}

func serve(cctx *cli.Context) error {
	debug := cctx.Bool("debug")
	httpAddress := cctx.String("http-address")
	metricsAddress := cctx.String("metrics-address")
	appviewHost := cctx.String("appview-host")
	chatHost := cctx.String("chat-host")
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

	// optional client for the chat appview, used by /chat/<code> for OG previews.
	var chatXrpcc *xrpc.Client
	if chatHost != "" {
		chatXrpcc = &xrpc.Client{
			Client: cliutil.NewHttpClient(),
			Host:   chatHost,
		}
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
		echo:      e,
		xrpcc:     xrpcc,
		chatXrpcc: chatXrpcc,
		cfg: &Config{
			debug:         debug,
			httpAddress:   httpAddress,
			appviewHost:   appviewHost,
			chatHost:      chatHost,
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
		sitemapClient: http.Client{
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 10,
				IdleConnTimeout:     90 * time.Second,
				TLSHandshakeTimeout: 10 * time.Second,
				ForceAttemptHTTP2:   true,
				DisableCompression:  true,
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
		ContentTypeNosniff:    "nosniff",
		XFrameOptions:         "SAMEORIGIN",
		ContentSecurityPolicy: "frame-ancestors 'self' http://localhost:19006",
		HSTSMaxAge:            31536000, // 365 days
		// TODO:
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

	echoprom := echoprometheus.NewMiddlewareWithConfig(
		echoprometheus.MiddlewareConfig{
			DoNotUseRequestPathFor404: true,
		},
	)

	e.Use(echoprom)

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

	e.GET("/iframe/*", echo.WrapHandler(staticHandler))
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
	e.GET("/search", server.WebGenericNoindex)
	e.GET("/feeds", server.WebGenericNoindex)
	e.GET("/notifications", server.WebGenericNoindex)
	e.GET("/notifications/settings", server.WebGenericNoindex)
	e.GET("/notifications/activity", server.WebGenericNoindex)
	e.GET("/lists", server.WebGenericNoindex)
	e.GET("/moderation", server.WebGenericNoindex)
	e.GET("/moderation/modlists", server.WebGenericNoindex)
	e.GET("/moderation/muted-accounts", server.WebGenericNoindex)
	e.GET("/moderation/blocked-accounts", server.WebGenericNoindex)
	e.GET("/moderation/verification-settings", server.WebGenericNoindex)
	e.GET("/settings", server.WebGenericNoindex)
	e.GET("/settings/language", server.WebGenericNoindex)
	e.GET("/settings/app-passwords", server.WebGenericNoindex)
	e.GET("/settings/following-feed", server.WebGenericNoindex)
	e.GET("/settings/saved-feeds", server.WebGenericNoindex)
	e.GET("/settings/threads", server.WebGenericNoindex)
	e.GET("/settings/external-embeds", server.WebGenericNoindex)
	e.GET("/settings/accessibility", server.WebGenericNoindex)
	e.GET("/settings/appearance", server.WebGenericNoindex)
	e.GET("/settings/account", server.WebGenericNoindex)
	e.GET("/settings/automation-label", server.WebGenericNoindex)
	e.GET("/settings/privacy-and-security", server.WebGenericNoindex)
	e.GET("/settings/privacy-and-security/activity", server.WebGenericNoindex)
	e.GET("/settings/content-and-media", server.WebGenericNoindex)
	e.GET("/settings/interests", server.WebGenericNoindex)
	e.GET("/settings/about", server.WebGenericNoindex)
	e.GET("/settings/notifications", server.WebGenericNoindex)
	e.GET("/sys/debug", server.WebGenericNoindex)
	e.GET("/sys/debug-mod", server.WebGenericNoindex)
	e.GET("/sys/log", server.WebGenericNoindex)
	e.GET("/support", server.WebGeneric)
	e.GET("/support/privacy", server.WebGeneric)
	e.GET("/support/tos", server.WebGeneric)
	e.GET("/support/community-guidelines", server.WebGeneric)
	e.GET("/support/copyright", server.WebGeneric)
	e.GET("/intent/compose", server.WebGenericNoindexNofollow)
	e.GET("/intent/verify-email", server.WebGenericNoindexNofollow)
	e.GET("/intent/age-assurance", server.WebGenericNoindexNofollow)
	e.GET("/messages", server.WebGenericNoindex)
	e.GET("/messages/inbox", server.WebGenericNoindex)
	e.GET("/messages/:conversation", server.WebGenericNoindex)
	e.GET("/messages/:conversation/settings", server.WebGenericNoindex)
	e.GET("/messages/:conversation/requests", server.WebGenericNoindex)

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
	e.GET("/starter-pack-short/:code", server.WebGenericNoindex)
	e.GET("/start/:handleOrDID/:rkey", server.WebStarterPack)

	// chat invites
	e.GET("/chat/:code", server.WebChatInvite)

	// bookmarks
	e.GET("/saved", server.WebGenericNoindex)

	// ipcc
	e.GET("/ipcc", server.WebIpCC)

	// sitemap handlers
	e.GET("/sitemap/users.xml.gz", server.handleSitemapUsersIndex)
	e.GET("/sitemap/users/*", server.handleSitemapUsersSubpage)

	if linkHost != "" {
		linkUrl, err := url.Parse(linkHost)
		if err != nil {
			return err
		}
		e.Group("/:linkId", server.LinkProxyMiddleware(linkUrl))
	}

	metricsHttpd, metricsListener, err := newMetricsHTTPServer(metricsAddress)
	if err != nil {
		return err
	}
	server.metricsHttpd = metricsHttpd

	log.Infof("starting metrics server address=%s", metricsAddress)
	go func() {
		if err := metricsHttpd.Serve(metricsListener); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Errorf("metrics HTTP server shutting down unexpectedly: %s", err)
		}
	}()

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

func newMetricsHTTPServer(address string) (*http.Server, net.Listener, error) {
	metricsMux := http.NewServeMux()
	metricsMux.Handle("/metrics", promhttp.Handler())

	metricsHttpd := &http.Server{
		Addr:              address,
		Handler:           metricsMux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	metricsListener, err := net.Listen("tcp", address)
	if err != nil {
		return nil, nil, fmt.Errorf("listen metrics address %s: %w", address, err)
	}

	return metricsHttpd, metricsListener, nil
}

func (srv *Server) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	srv.echo.ServeHTTP(rw, req)
}

func (srv *Server) Shutdown() error {
	log.Info("shutting down")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var shutdownErr error
	if srv.metricsHttpd != nil {
		if err := srv.metricsHttpd.Shutdown(ctx); err != nil {
			shutdownErr = fmt.Errorf("metrics HTTP server shutdown error: %w", err)
		}
	}

	if err := srv.httpd.Shutdown(ctx); err != nil {
		return errors.Join(shutdownErr, err)
	}

	return shutdownErr
}

// NewTemplateContext returns a new pongo2 context with some default values.
func (srv *Server) NewTemplateContext() pongo2.Context {
	return pongo2.Context{
		"staticCDNHost": srv.cfg.staticCDNHost,
		"favicon":       fmt.Sprintf("%s/static/favicon.png", srv.cfg.staticCDNHost),
		"noindex":       false,
		"nofollow":      false,
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

// renderOptions controls per-request rendering flags for the generic web handler.
type renderOptions struct {
	noindex  bool
	nofollow bool
}

// webGeneric returns a handler that renders the base SPA shell with the given
// render options applied to the template context.
func (srv *Server) webGeneric(c echo.Context, o renderOptions) error {
	data := srv.NewTemplateContext()
	data["noindex"] = o.noindex
	data["nofollow"] = o.nofollow
	return c.Render(http.StatusOK, "base.html", data)
}

// handler for endpoint that have no specific server-side handling
func (srv *Server) WebGeneric(c echo.Context) error {
	return srv.webGeneric(c, renderOptions{})
}

// handler for routes that should not be indexed by search engines
// (e.g. auth-only user-state surfaces, internal/debug pages, action/intent dispatch URLs, search results)
func (srv *Server) WebGenericNoindex(c echo.Context) error {
	return srv.webGeneric(c, renderOptions{noindex: true})
}

// handler for action/intent dispatch URLs (e.g. /intent/compose). These accept
// arbitrary query parameters from arbitrary third-party referrers, so we treat
// them as link-graph dead-ends in addition to noindex. Anything legitimately
// reachable from a hydrated intent page is also reachable via its canonical URL.
func (srv *Server) WebGenericNoindexNofollow(c echo.Context) error {
	return srv.webGeneric(c, renderOptions{noindex: true, nofollow: true})
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

// Replies surfaced into a post's JSON-LD comment[] are dropped entirely when
// any of these labels are present (in addition to hideEmbedLabels). Targets
// abuse/spam in third-party reply text, since reply text would otherwise be
// emitted into the parent post's structured data.
var hideReplyLabels = map[string]bool{
	"!hide":         true,
	"!warn":         true,
	"porn":          true,
	"sexual":        true,
	"nudity":        true,
	"graphic-media": true,
	"spam":          true,
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

	req := c.Request()
	requestURI := fmt.Sprintf("https://%s%s", req.Host, req.URL.Path)

	// Fetch the post thread directly. The AT-URI authority accepts either a
	// handle or a DID (the appview resolves it), so we skip the separate
	// ActorGetProfile call and source identity, the canonical URL, and the
	// auth gate from the thread response's author view instead.
	// parentHeight=80 (the lexicon default) pulls the reply's ancestor chain
	// up to the root in nearly all threads, letting isPartOf resolve from this
	// response without a separate FeedGetPosts call.
	uri := fmt.Sprintf("at://%s/app.bsky.feed.post/%s", identifier, rkey)
	tpv, err := appbsky.FeedGetPostThread(ctx, srv.xrpcc, 1, 80, uri)
	if err != nil {
		log.Warnf("failed to fetch post: %s\t%v", uri, err)
		return c.Render(http.StatusOK, "post.html", data)
	}

	threadView := tpv.Thread.FeedDefs_ThreadViewPost
	if threadView == nil || threadView.Post == nil || threadView.Post.Author == nil {
		return c.Render(http.StatusOK, "post.html", data)
	}
	postView := threadView.Post

	// Always prefer the handle-form URL so JSON-LD `url` and
	// <link rel="canonical"> match. Falls back to requestURI when the
	// handle is unusable (template strips query/fragment).
	canonicalURL := bskyPostURL(postView.Author.Handle, rkey.String())

	// Gate before populating any post content into the template so that
	// !no-unauthenticated posts never leak text/media. The appview returns the
	// post (with the author self-label) to unauthed callers, so we detect the
	// label here rather than via a profile fetch.
	if postAuthorRequiresAuth(postView) {
		// Provide minimal OpenGraph data for auth-required posts
		data["requestURI"] = requestURI
		if canonicalURL != "" {
			data["canonicalURL"] = canonicalURL
		}
		data["requiresAuth"] = true
		data["noindex"] = true
		data["nofollow"] = true
		data["profileHandle"] = postView.Author.Handle
		if postView.Author.DisplayName != nil {
			data["profileDisplayName"] = *postView.Author.DisplayName
		}
		return c.Render(http.StatusOK, "post.html", data)
	}

	data["postView"] = postView
	data["requestURI"] = requestURI
	if canonicalURL != "" {
		data["canonicalURL"] = canonicalURL
	}

	// Share extraction helpers with jsonld.go so og:image and JSON-LD
	// image[] are byte-identical (per Google's requirement).
	isEmbedHidden := postEmbedHidden(postView, hideEmbedLabels)
	data["postText"] = postRecordText(postView)

	if thumbs := extractPostMedia(postView, isEmbedHidden); len(thumbs) > 0 {
		data["imgThumbUrls"] = thumbs
	}
	if vm := extractVideoMeta(postView, isEmbedHidden); vm.URL != "" {
		data["videoUrl"] = vm.URL
		data["videoType"] = vm.Type
		if vm.HasSize {
			data["videoWidth"] = vm.Width
			data["videoHeight"] = vm.Height
		}
	}

	// Build JSON-LD. Fall back to requestURI when handle is unusable so the
	// envelope url is never empty.
	jsonldURL := canonicalURL
	if jsonldURL == "" {
		jsonldURL = requestURI
	}

	// Best-effort: resolve a reply's thread root to its handle-form canonical
	// URL for isPartOf. Prefer the root already present in the thread response
	// (parentHeight=80); fall back to a bounded FeedGetPosts only when the
	// chain is truncated (very deep thread) or broken by a blocked/not-found
	// ancestor. On timeout, error, or an unresolvable root we omit isPartOf
	// rather than point at a non-indexable page.
	isPartOfURL := ""
	if rootURI := threadRootURI(postView); rootURI != "" {
		if rootPost := findRootPostInParents(threadView, rootURI); rootPost != nil && rootPost.Author != nil {
			isPartOfURL = bskyPostURLFromATURI(rootPost.Author.Handle, rootURI)
		} else {
			pctx, cancel := context.WithTimeout(ctx, 1*time.Second)
			if posts, perr := appbsky.FeedGetPosts(pctx, srv.xrpcc, []string{rootURI}); perr != nil {
				log.Warnf("failed to resolve thread root post for isPartOf: %s\t%v", rootURI, perr)
			} else if len(posts.Posts) > 0 && posts.Posts[0].Author != nil {
				// Handle-form only (no DID fallback): isPartOf must match the
				// root page's handle-form canonical, so an unusable handle omits
				// isPartOf rather than point at a non-canonical DID-form URL.
				isPartOfURL = bskyPostURLFromATURI(posts.Posts[0].Author.Handle, rootURI)
			}
			cancel()
		}
	}

	if jsonld, err := buildPostJSONLD(postView, threadView.Replies, jsonldURL, isPartOfURL, hideEmbedLabels, hideReplyLabels); err == nil {
		data["postJSONLD"] = jsonld
	} else {
		log.Warnf("failed to build post JSON-LD for %s: %v", uri, err)
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

// chatInviteCodeRe is a permissive sanity check on the join code so we don't
// proxy obviously-bad input to the chat appview. Codes are opaque per the
// lexicon, but in practice URL-safe and short.
var chatInviteCodeRe = regexp.MustCompile(`^[A-Za-z0-9_-]{1,64}$`)

func (srv *Server) WebChatInvite(c echo.Context) error {
	req := c.Request()
	ctx := req.Context()
	data := srv.NewTemplateContext()
	data["noindex"] = true
	data["requestURI"] = fmt.Sprintf("https://%s%s", req.Host, req.URL.Path)

	code := c.Param("code")
	if !chatInviteCodeRe.MatchString(code) {
		return c.Render(http.StatusOK, "chatinvite.html", data)
	}
	if srv.chatXrpcc == nil {
		return c.Render(http.StatusOK, "chatinvite.html", data)
	}

	out, err := chat.GroupGetJoinLinkPreviews(ctx, srv.chatXrpcc, []string{code})
	if err != nil {
		log.Errorf("failed to fetch chat invite preview for code=%s: %v", code, err)
		return c.Render(http.StatusOK, "chatinvite.html", data)
	}
	if len(out.JoinLinkPreviews) == 0 {
		return c.Render(http.StatusOK, "chatinvite.html", data)
	}
	preview := out.JoinLinkPreviews[0]

	data["title"] = preview.Name
	if srv.cfg.ogcardHost != "" {
		// bskyogcard registers this route as /chat-invite/:code, not /chat/:code.
		data["imgThumbUrl"] = fmt.Sprintf("%s/chat-invite/%s", srv.cfg.ogcardHost, code)
	}
	return c.Render(http.StatusOK, "chatinvite.html", data)
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
	unauthedViewingOkay := !profileRequiresAuth(pv)

	req := c.Request()
	data["profileView"] = pv
	data["requestURI"] = fmt.Sprintf("https://%s%s", req.Host, req.URL.Path)
	data["requestHost"] = req.Host

	// Prefer the handle-form URL so JSON-LD `url` and
	// <link rel="canonical"> match. Template falls back to requestURI
	// when the handle is unusable.
	if url := bskyProfileURL(pv.Handle); url != "" {
		data["canonicalURL"] = url
	}

	// Fetch recent posts for ProfilePage.hasPart. Skipped for auth-required
	// profiles (posts aren't publicly indexable anyway). Failures degrade
	// gracefully — the profile still renders without hasPart.
	//
	// NOTE: extra XRPC call on every public profile render; consider
	// caching per-profile if upstream load becomes a concern.
	var recentPosts []*appbsky.FeedDefs_PostView
	if unauthedViewingOkay {
		af, err := appbsky.FeedGetAuthorFeed(ctx, srv.xrpcc, pv.Did, "", "posts_no_replies", false, authorFeedFetchLimit)
		if err != nil {
			log.Warnf("failed to fetch author feed for: %s\t%v", pv.Did, err)
		} else {
			for _, p := range af.Feed {
				if p == nil || p.Post == nil {
					continue
				}
				// Only the author's own posts (matches RSS handler).
				if p.Post.Author == nil || p.Post.Author.Did != pv.Did {
					continue
				}
				recentPosts = append(recentPosts, p.Post)
				if len(recentPosts) >= maxRecentPosts {
					break
				}
			}
		}
	} else {
		data["requiresAuth"] = true
		data["noindex"] = true
		data["nofollow"] = true
	}

	if jsonld, err := buildProfileJSONLD(pv, recentPosts, hideEmbedLabels, hideReplyLabels); err == nil {
		data["profileJSONLD"] = jsonld
	} else {
		log.Warnf("failed to build profile JSON-LD for %s: %v", pv.Did, err)
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
	unauthedViewingOkay := !profileRequiresAuth(pv)

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

func (srv *Server) handleSitemapUsersIndex(c echo.Context) error {
	url := fmt.Sprintf("%s/external/sitemap/users.xml.gz", srv.cfg.appviewHost)
	return srv.serveSitemapRequest(c, url, "user index")
}

func (srv *Server) handleSitemapUsersSubpage(c echo.Context) error {
	path := c.Param("*")
	url := fmt.Sprintf("%s/external/sitemap/users/%s", srv.cfg.appviewHost, path)
	return srv.serveSitemapRequest(c, url, "user subpage")
}

func (srv *Server) serveSitemapRequest(c echo.Context, url, sitemapType string) error {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		slog.Error("failed to construct sitemap request", "err", err, "type", sitemapType)
		return c.String(http.StatusInternalServerError, "Internal Server Error")
	}

	resp, err := srv.sitemapClient.Do(req)
	if err != nil {
		slog.Error("failed to send sitemap request to appview", "err", err, "type", sitemapType)
		return c.String(http.StatusInternalServerError, "Internal Server Error")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		buf, err := io.ReadAll(resp.Body)
		if err != nil {
			slog.Error("failed to read sitemap error response body", "err", err)
		}

		slog.Error("invalid sitemap response code",
			"err", err,
			"type", sitemapType,
			"code", resp.StatusCode,
			"body", string(buf),
		)
		return c.String(http.StatusInternalServerError, "Internal Server Error")
	}

	c.Response().Header().Set("Content-Type", "application/xml")
	c.Response().Header().Set("Content-Encoding", "gzip")
	c.Response().WriteHeader(resp.StatusCode)

	if _, err = io.Copy(c.Response().Writer, resp.Body); err != nil {
		slog.Error("failed to copy sitemap response body to client", "err", err, "type", sitemapType)
	}

	return nil
}
