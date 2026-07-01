package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func assertField(t *testing.T, field, got, want string) {
	t.Helper()
	if got != want {
		t.Errorf("%s: got %q, want %q", field, got, want)
	}
}

// testFullComputedJSON returns a realistic computed brand config JSON fixture.
func testFullComputedJSON() json.RawMessage {
	return json.RawMessage(`{
		"metadata": {
			"name": "testbrand",
			"displayName": "TestBrand",
			"slug": "testbrand",
			"communityDid": "did:plc:test123"
		},
		"web": {
			"themeColor": "#FF5733",
			"title": "TestBrand Web",
			"domains": {
				"main": "https://test.example.com",
				"shortlink": "https://go.test.example.com"
			},
			"links": {},
			"supportEmail": "support@test.example.com"
		},
		"messages": {
			"composerPlaceholder": "What's on your mind?",
			"primaryCTA": "Join the test",
			"welcomeMessage": "Welcome!",
			"splashTagline": "Test tagline",
			"migrationMessage": null
		},
		"theme": {
			"hue": 270,
			"bgHue": 270,
			"brand": {
				"black": "#000000",
				"white": "#FFFFFF",
				"twilight": "#222233",
				"gray300": "#AAAAAA",
				"gray400": "#888888",
				"gray600": "#666666",
				"primaryLight": "#7070FF",
				"primaryLightTint": "#9090FF",
				"primaryDark": "#5050DD",
				"primaryDarkTint": "#6060EE",
				"secondary": "#33FF57",
				"secondaryTint": "#55FF77",
				"negative": "#FF3333",
				"bgLight": "#FAFAFA",
				"bgDark": "#0A0A0A",
				"bgDim": "#1A1A2A"
			},
			"gradients": {
				"primary": [],
				"sky": [],
				"sunset": []
			},
			"colorScale": {},
			"css": {
				"selectionLight": "#AABBCC",
				"selectionDark": "#112233",
				"backgroundLightHsl": "hsl(270, 20%, 95%)",
				"backgroundDarkHsl": "hsl(270, 20%, 20%)",
				"backgroundDimHsl": "hsl(270, 20%, 10%)"
			}
		},
		"assets": {
			"logo": "https://cdn.example.com/logo.png",
			"logoDark": "https://cdn.example.com/logo-dark.png",
			"logoLight": "https://cdn.example.com/logo-light.png",
			"logotype": "https://cdn.example.com/logotype.png",
			"favicon": "https://cdn.example.com/favicon.ico",
			"socialCard": "https://cdn.example.com/social-card.png"
		},
		"feeds": {
			"discover": "at://did:plc:test/app.bsky.feed.generator/discover",
			"video": "at://did:plc:test/app.bsky.feed.generator/video",
			"defaultPinned": []
		},
		"onboarding": {
			"starterPack": "at://did:plc:test/app.bsky.graph.starterpack/default",
			"autoFollowDids": []
		},
		"services": {
			"pds": "https://pds.test.example.com"
		}
	}`)
}

// testBrandAPIServer creates an httptest server that records requests and
// returns a valid brandAPIResponse. It returns the server, and pointers to
// the last captured path, host query param, token query param, and request counter.
func testBrandAPIServer(t *testing.T) (*httptest.Server, *string, *string, *string, *int32) {
	t.Helper()
	var (
		lastPath  string
		lastHost  string
		lastToken string
		reqCount  int32
	)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&reqCount, 1)
		lastPath = r.URL.Path
		lastHost = r.URL.Query().Get("host")
		lastToken = r.URL.Query().Get("token")

		if lastHost == "unknown.example.com" {
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"error":"brand_not_found","message":"not found"}`))
			return
		}

		// Preview endpoint validates token presence
		if r.URL.Path == "/brands/resolve/preview" && lastToken == "" {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error":"invalid_token","message":"token required"}`))
			return
		}

		resp := map[string]interface{}{
			"slug":     "test",
			"status":   "published",
			"computed": json.RawMessage(testFullComputedJSON()),
			"raw":      map[string]interface{}{},
			"assets":   map[string]string{},
		}
		if r.URL.Path == "/brands/resolve/preview" {
			resp["status"] = "draft"
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	t.Cleanup(server.Close)
	return server, &lastPath, &lastHost, &lastToken, &reqCount
}

// ---------------------------------------------------------------------------
// TestMapAPIResponseToBrandConfig
// ---------------------------------------------------------------------------

func TestMapAPIResponseToBrandConfig(t *testing.T) {
	defaults := DefaultBrandConfig()

	tests := []struct {
		name   string
		resp   brandAPIResponse
		checks map[string]string // field name -> expected value
	}{
		{
			name: "full computed config",
			resp: brandAPIResponse{
				Slug:     "testbrand",
				Status:   "published",
				Computed: testFullComputedJSON(),
			},
			checks: map[string]string{
				"Name":           "TestBrand",
				"ThemeColor":     "#FF5733",
				"Domain":         "https://test.example.com",
				"Shortlink":      "https://go.test.example.com",
				"Title":          "TestBrand Web",
				"PrimaryCTA":     "Join the test",
				"SelectionLight": "#AABBCC",
				"SelectionDark":  "#112233",
				"BrandHue":       "270",
				"BgLight":        "#FAFAFA",
				"BgDark":         "#0A0A0A",
				"BgDim":          "#1A1A2A",
				"Favicon":        "https://cdn.example.com/favicon.ico",
				"Logo":           "https://cdn.example.com/logo.png",
				"LogoDark":       "https://cdn.example.com/logo-dark.png",
				"LogoLight":      "https://cdn.example.com/logo-light.png",
				"SocialCard":     "https://cdn.example.com/social-card.png",
			},
		},
		{
			name: "empty computed nil",
			resp: brandAPIResponse{Slug: "empty", Computed: nil},
			checks: map[string]string{
				"Name":       defaults.Name,
				"ThemeColor": defaults.ThemeColor,
				"Domain":     defaults.Domain,
				"BrandHue":   defaults.BrandHue,
			},
		},
		{
			name: "empty JSON object",
			resp: brandAPIResponse{Slug: "empty", Computed: json.RawMessage(`{}`)},
			checks: map[string]string{
				"Name":       defaults.Name,
				"ThemeColor": defaults.ThemeColor,
				"Domain":     defaults.Domain,
				"BrandHue":   defaults.BrandHue,
			},
		},
		{
			name: "metadata only",
			resp: brandAPIResponse{
				Slug:     "partial",
				Computed: json.RawMessage(`{"metadata":{"displayName":"PartialBrand"}}`),
			},
			checks: map[string]string{
				"Name":       "PartialBrand",
				"ThemeColor": defaults.ThemeColor,
				"Domain":     defaults.Domain,
			},
		},
		{
			name: "hue as number",
			resp: brandAPIResponse{
				Slug:     "hue-num",
				Computed: json.RawMessage(`{"theme":{"hue":180}}`),
			},
			checks: map[string]string{
				"BrandHue": "180",
			},
		},
		{
			name: "hue as string",
			resp: brandAPIResponse{
				Slug:     "hue-str",
				Computed: json.RawMessage(`{"theme":{"hue":"220"}}`),
			},
			checks: map[string]string{
				"BrandHue": "220",
			},
		},
		{
			name: "bg fallback to white/black/twilight",
			resp: brandAPIResponse{
				Slug: "bg-fallback",
				Computed: json.RawMessage(`{
					"theme":{
						"brand":{
							"white":"#F0F0F0",
							"black":"#101010",
							"twilight":"#202030"
						}
					}
				}`),
			},
			checks: map[string]string{
				"BgLight": "#F0F0F0",
				"BgDark":  "#101010",
				"BgDim":   "#202030",
			},
		},
		{
			name: "bg primary wins over fallback",
			resp: brandAPIResponse{
				Slug: "bg-primary",
				Computed: json.RawMessage(`{
					"theme":{
						"brand":{
							"white":"#F0F0F0",
							"black":"#101010",
							"twilight":"#202030",
							"bgLight":"#FAFAFA",
							"bgDark":"#0A0A0A",
							"bgDim":"#1A1A2A"
						}
					}
				}`),
			},
			checks: map[string]string{
				"BgLight": "#FAFAFA",
				"BgDark":  "#0A0A0A",
				"BgDim":   "#1A1A2A",
			},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			cfg := mapAPIResponseToBrandConfig(tc.resp)
			for field, want := range tc.checks {
				var got string
				switch field {
				case "Name":
					got = cfg.Name
				case "ThemeColor":
					got = cfg.ThemeColor
				case "Domain":
					got = cfg.Domain
				case "Shortlink":
					got = cfg.Shortlink
				case "Title":
					got = cfg.Title
				case "PrimaryCTA":
					got = cfg.PrimaryCTA
				case "SelectionLight":
					got = cfg.SelectionLight
				case "SelectionDark":
					got = cfg.SelectionDark
				case "BrandHue":
					got = cfg.BrandHue
				case "BgLight":
					got = cfg.BgLight
				case "BgDark":
					got = cfg.BgDark
				case "BgDim":
					got = cfg.BgDim
				case "Favicon":
					got = cfg.Favicon
				case "Logo":
					got = cfg.Logo
				case "LogoDark":
					got = cfg.LogoDark
				case "LogoLight":
					got = cfg.LogoLight
				case "SocialCard":
					got = cfg.SocialCard
				default:
					t.Fatalf("unknown field %q in test case", field)
				}
				assertField(t, field, got, want)
			}
		})
	}
}

// ---------------------------------------------------------------------------
// TestDoFetchRouting
// ---------------------------------------------------------------------------

func TestDoFetchRouting(t *testing.T) {
	server, lastPath, lastHost, _, _ := testBrandAPIServer(t)

	tests := []struct {
		name     string
		host     string
		wantPath string
		wantHost string
		wantErr  bool
	}{
		{
			name:     "published resolve",
			host:     "acme.example.com",
			wantPath: "/brands/resolve",
			wantHost: "acme.example.com",
		},
		{
			name:    "API 404",
			host:    "unknown.example.com",
			wantErr: true,
		},
		{
			name:     "custom domain",
			host:     "theinvite.us",
			wantPath: "/brands/resolve",
			wantHost: "theinvite.us",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			client := NewBrandConfigClient(server.URL, time.Minute)
			_, _, err := client.doFetch(tc.host)

			if tc.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			assertField(t, "path", *lastPath, tc.wantPath)
			assertField(t, "host", *lastHost, tc.wantHost)
		})
	}
}

// ---------------------------------------------------------------------------
// TestFetchBrandCaching
// ---------------------------------------------------------------------------

func TestFetchBrandCaching(t *testing.T) {
	server, _, _, _, reqCount := testBrandAPIServer(t)

	client := NewBrandConfigClient(server.URL, 50*time.Millisecond)

	// First fetch — should hit the server.
	if _, _, err := client.FetchBrand("test.example.com"); err != nil {
		t.Fatalf("first fetch: %v", err)
	}
	if got := atomic.LoadInt32(reqCount); got != 1 {
		t.Errorf("after first fetch: got %d requests, want 1", got)
	}

	// Second fetch — should use cache.
	if _, _, err := client.FetchBrand("test.example.com"); err != nil {
		t.Fatalf("second fetch: %v", err)
	}
	if got := atomic.LoadInt32(reqCount); got != 1 {
		t.Errorf("after second fetch (cache hit): got %d requests, want 1", got)
	}

	// Wait for TTL to expire.
	time.Sleep(60 * time.Millisecond)

	// Third fetch — cache expired, should hit server again.
	if _, _, err := client.FetchBrand("test.example.com"); err != nil {
		t.Fatalf("third fetch: %v", err)
	}
	if got := atomic.LoadInt32(reqCount); got != 2 {
		t.Errorf("after TTL expiry: got %d requests, want 2", got)
	}
}

// ---------------------------------------------------------------------------
// TestFetchBrandPreview
// ---------------------------------------------------------------------------

func TestFetchBrandPreview(t *testing.T) {
	server, lastPath, _, lastToken, reqCount := testBrandAPIServer(t)

	client := NewBrandConfigClient(server.URL, time.Minute)

	// Prime cache with a published fetch.
	if _, _, err := client.FetchBrand("test.example.com"); err != nil {
		t.Fatalf("prime cache: %v", err)
	}
	if got := atomic.LoadInt32(reqCount); got != 1 {
		t.Errorf("after priming cache: got %d requests, want 1", got)
	}

	// Preview fetch — should bypass cache, use token as query param.
	if _, _, err := client.FetchBrandPreview("test.example.com", "preview-tok-abc"); err != nil {
		t.Fatalf("preview fetch: %v", err)
	}
	if got := atomic.LoadInt32(reqCount); got != 2 {
		t.Errorf("after preview fetch: got %d requests, want 2", got)
	}
	assertField(t, "preview path", *lastPath, "/brands/resolve/preview")
	assertField(t, "preview token", *lastToken, "preview-tok-abc")

	// Second preview fetch — should still bypass cache.
	if _, _, err := client.FetchBrandPreview("test.example.com", "preview-tok-abc"); err != nil {
		t.Fatalf("second preview fetch: %v", err)
	}
	if got := atomic.LoadInt32(reqCount); got != 3 {
		t.Errorf("after second preview fetch: got %d requests, want 3", got)
	}
}

// ---------------------------------------------------------------------------
// TestFetchBrandPreviewNoToken
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// TestNegativeCaching — unknown hosts should be cached to prevent API floods
// ---------------------------------------------------------------------------

func TestNegativeCaching(t *testing.T) {
	server, _, _, _, reqCount := testBrandAPIServer(t)

	client := NewBrandConfigClient(server.URL, 50*time.Millisecond)

	// First fetch for unknown host — hits API, gets 404, returns defaults.
	cfg, raw, _ := client.FetchBrand("unknown.example.com")
	if cfg.Name != DefaultBrandConfig().Name {
		t.Errorf("expected default Name %q, got %q", DefaultBrandConfig().Name, cfg.Name)
	}
	if raw != nil {
		t.Errorf("expected nil computed JSON for negative cache, got %s", string(raw))
	}
	if got := atomic.LoadInt32(reqCount); got != 1 {
		t.Errorf("after first fetch: got %d requests, want 1", got)
	}

	// Second fetch for same unknown host — should use negative cache, NOT hit API.
	cfg2, _, _ := client.FetchBrand("unknown.example.com")
	if cfg2.Name != DefaultBrandConfig().Name {
		t.Errorf("expected default Name from cache, got %q", cfg2.Name)
	}
	if got := atomic.LoadInt32(reqCount); got != 1 {
		t.Errorf("after second fetch (negative cache hit): got %d requests, want 1", got)
	}

	// Wait for TTL to expire.
	time.Sleep(60 * time.Millisecond)

	// Third fetch — cache expired, should re-check API.
	client.FetchBrand("unknown.example.com")
	if got := atomic.LoadInt32(reqCount); got != 2 {
		t.Errorf("after TTL expiry: got %d requests, want 2", got)
	}
}

// ---------------------------------------------------------------------------
// TestCacheEviction — cache should evict oldest entries when at capacity
// ---------------------------------------------------------------------------

func TestCacheEviction(t *testing.T) {
	server, _, _, _, reqCount := testBrandAPIServer(t)

	client := NewBrandConfigClientWithMaxSize(server.URL, time.Minute, 3)

	// Fill cache with 3 known hosts.
	for i := 0; i < 3; i++ {
		host := fmt.Sprintf("host%d.example.com", i)
		if _, _, err := client.FetchBrand(host); err != nil {
			t.Fatalf("fetch %s: %v", host, err)
		}
	}
	if got := atomic.LoadInt32(reqCount); got != 3 {
		t.Errorf("after filling cache: got %d requests, want 3", got)
	}

	// Access host0 again — should be cached.
	client.FetchBrand("host0.example.com")
	if got := atomic.LoadInt32(reqCount); got != 3 {
		t.Errorf("host0 should be cached: got %d requests, want 3", got)
	}

	// Add a 4th host — should evict the oldest entry.
	client.FetchBrand("host3.example.com")
	if got := atomic.LoadInt32(reqCount); got != 4 {
		t.Errorf("host3 should hit API: got %d requests, want 4", got)
	}

	// Cache should now have 3 entries (not 4).
	client.mu.RLock()
	cacheLen := len(client.cache)
	client.mu.RUnlock()
	if cacheLen != 3 {
		t.Errorf("cache size after eviction: got %d, want 3", cacheLen)
	}
}

// ---------------------------------------------------------------------------
// TestOAuthMetadata404ForUnknownHost — OAuth metadata endpoint should return
// 404 for unrecognized hosts in multi-brand mode.
// ---------------------------------------------------------------------------

func TestOAuthMetadata404ForUnknownHost(t *testing.T) {
	apiServer, _, _, _, _ := testBrandAPIServer(t)
	brandClient := NewBrandConfigClient(apiServer.URL, time.Minute)

	srv := &Server{
		brandClient: brandClient,
		cfg:         &Config{brand: DefaultBrandConfig()},
	}

	e := echo.New()

	// Unknown host — should return 404.
	t.Run("unknown host returns 404", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/oauth-client-metadata.json", nil)
		req.Host = "unknown.example.com"
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		if err := srv.OAuthClientMetadata(c); err != nil {
			t.Fatalf("handler returned error: %v", err)
		}
		if rec.Code != http.StatusNotFound {
			t.Errorf("status: got %d, want %d", rec.Code, http.StatusNotFound)
		}

		var body map[string]string
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("failed to parse response body: %v", err)
		}
		if body["error"] != "unknown_client" {
			t.Errorf("error field: got %q, want %q", body["error"], "unknown_client")
		}
	})

	// Known host — should return 200 with valid metadata.
	t.Run("known host returns 200", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/oauth-client-metadata.json", nil)
		req.Host = "test.example.com"
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		if err := srv.OAuthClientMetadata(c); err != nil {
			t.Fatalf("handler returned error: %v", err)
		}
		if rec.Code != http.StatusOK {
			t.Errorf("status: got %d, want %d", rec.Code, http.StatusOK)
		}

		var body map[string]interface{}
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("failed to parse response body: %v", err)
		}
		clientID, _ := body["client_id"].(string)
		if clientID != "https://test.example.com/oauth-client-metadata.json" {
			t.Errorf("client_id: got %q, want %q", clientID, "https://test.example.com/oauth-client-metadata.json")
		}
		clientName, _ := body["client_name"].(string)
		if clientName != "TestBrand" {
			t.Errorf("client_name: got %q, want %q", clientName, "TestBrand")
		}
	})

	// Single-brand mode (no brandClient) — should always return 200.
	t.Run("single-brand mode always returns 200", func(t *testing.T) {
		singleBrandSrv := &Server{
			brandClient: nil,
			cfg:         &Config{brand: DefaultBrandConfig()},
		}

		req := httptest.NewRequest(http.MethodGet, "/oauth-client-metadata.json", nil)
		req.Host = "anything.example.com"
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		if err := singleBrandSrv.OAuthClientMetadata(c); err != nil {
			t.Fatalf("handler returned error: %v", err)
		}
		if rec.Code != http.StatusOK {
			t.Errorf("status: got %d, want %d", rec.Code, http.StatusOK)
		}
	})
}

func TestFetchBrandPreviewNoToken(t *testing.T) {
	server, _, _, _, _ := testBrandAPIServer(t)

	client := NewBrandConfigClient(server.URL, time.Minute)

	// Preview with empty token should fail (401 from server).
	_, _, err := client.FetchBrandPreview("test.example.com", "")
	if err == nil {
		t.Error("expected error for empty token, got nil")
	}
}
