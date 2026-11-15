package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/bluesky-social/social-app/bskyweb"
	"github.com/flosch/pongo2/v6"
	"github.com/labstack/echo/v4"
)

const validFeaturePayload = `{"features":{"demo":{"defaultValue":false,"rules":[{"condition":{"did":{"$inGroup":"beta"}},"force":true}]}},"savedGroups":{"beta":["did:plc:beta"]},"dateUpdated":"2026-09-10T00:00:00Z"}`

func TestFeatureGateCacheRefresh(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/gb/api/features/sdk-test" {
			t.Errorf("unexpected fetch path: %s", r.URL.Path)
		}
		fmt.Fprint(w, validFeaturePayload)
	}))
	defer server.Close()
	cache := newFeatureGateCache(server.URL+"/gb/", "sdk-test")
	if cache.snapshot() != "" {
		t.Fatal("cold cache should omit the bootstrap")
	}
	if err := cache.refresh(context.Background()); err != nil {
		t.Fatal(err)
	}
	var bootstrap struct {
		SchemaVersion int             `json:"schemaVersion"`
		APIHost       string          `json:"apiHost"`
		ClientKey     string          `json:"clientKey"`
		FetchedAt     time.Time       `json:"fetchedAt"`
		Payload       json.RawMessage `json:"payload"`
	}
	if err := json.Unmarshal([]byte(cache.snapshot()), &bootstrap); err != nil {
		t.Fatal(err)
	}
	if bootstrap.SchemaVersion != 1 || bootstrap.APIHost != server.URL+"/gb" || bootstrap.ClientKey != "sdk-test" {
		t.Fatalf("wrong bootstrap identity: %+v", bootstrap)
	}
	if time.Since(bootstrap.FetchedAt) > time.Minute {
		t.Fatal("fetchedAt must reflect source verification, not the gate revision")
	}
	if string(bootstrap.Payload) != validFeaturePayload {
		t.Fatalf("payload changed: %s", bootstrap.Payload)
	}
}

func TestFeatureGateCacheRetainsValidSnapshot(t *testing.T) {
	for _, tc := range []struct {
		name   string
		status int
		body   string
	}{
		{"http error", 503, "unavailable"},
		{"invalid JSON", 200, "<html>error</html>"},
		{"missing features", 200, `{}`},
		{"invalid feature", 200, `{"features":{"demo":null},"dateUpdated":"2026-09-10T00:00:00Z"}`},
		{"invalid rules", 200, `{"features":{"demo":{"rules":[null]}},"dateUpdated":"2026-09-10T00:00:00Z"}`},
		{"invalid groups", 200, `{"features":{},"savedGroups":{"beta":null},"dateUpdated":"2026-09-10T00:00:00Z"}`},
		{"invalid revision", 200, `{"features":{},"dateUpdated":"invalid"}`},
		{"oversized response", 200, strings.Repeat(" ", featureGateMaxBytes+1)},
	} {
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tc.status)
				fmt.Fprint(w, tc.body)
			}))
			defer server.Close()
			cache := newFeatureGateCache(server.URL, "sdk-test")
			previous := &featureGateSnapshot{json: "previous", fetchedAt: time.Now()}
			cache.current.Store(previous)
			if err := cache.refresh(context.Background()); err == nil {
				t.Fatal("expected invalid upstream response to fail")
			}
			if cache.current.Load() != previous || cache.snapshot() != "previous" {
				t.Fatal("failed refresh replaced the last valid snapshot")
			}
		})
	}
}

func TestFeatureGateCacheExpiry(t *testing.T) {
	cache := newFeatureGateCache("https://unused.test", "sdk-test")
	cache.current.Store(&featureGateSnapshot{json: "old", fetchedAt: time.Now().Add(-featureGateMaxAge - time.Second)})
	if cache.snapshot() != "" {
		t.Fatal("stale fallback should be omitted")
	}
}

func TestFeatureGateCacheCancellation(t *testing.T) {
	started := make(chan struct{})
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		close(started)
		<-r.Context().Done()
	}))
	defer server.Close()
	cache := newFeatureGateCache(server.URL, "sdk-test")
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	stopped := make(chan struct{})
	go func() {
		cache.run(ctx)
		close(stopped)
	}()
	select {
	case <-started:
	case <-time.After(time.Second):
		t.Fatal("cache did not start its first fetch")
	}
	// Reading the snapshot cannot wait for this blocked upstream request.
	if cache.snapshot() != "" {
		t.Fatal("expected empty cache")
	}
	cancel()
	select {
	case <-stopped:
	case <-time.After(time.Second):
		t.Fatal("worker did not stop on cancellation")
	}
}

func TestFeatureGateHTML(t *testing.T) {
	malicious := `</script><script>alert("injected")</script>&`
	var payload map[string]any
	if err := json.Unmarshal([]byte(validFeaturePayload), &payload); err != nil {
		t.Fatal(err)
	}
	payload["extra"] = malicious
	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatal(err)
	}
	// Exercise RawMessage escaping even if upstream uses literal HTML characters.
	body = []byte(strings.ReplaceAll(string(body), `\u003c`, "<"))
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write(body)
	}))
	defer server.Close()
	cache := newFeatureGateCache(server.URL, "sdk-test")
	if err := cache.refresh(context.Background()); err != nil {
		t.Fatal(err)
	}
	app := &Server{cfg: &Config{}, featureGates: cache}
	ctx := app.NewTemplateContext()
	pattern := regexp.MustCompile(`(?s)<script id="bsky-app-config" type="application/json">(.*?)</script>`)
	for _, name := range []string{"base.html", "home.html", "profile.html", "post.html", "feed.html"} {
		t.Run(name, func(t *testing.T) {
			html := renderFeatureGateTemplate(t, name, ctx)
			matches := pattern.FindAllStringSubmatch(html, -1)
			if len(matches) != 1 {
				t.Fatalf("expected one bootstrap, got %d", len(matches))
			}
			if strings.Contains(matches[0][1], "<") {
				t.Fatal("unescaped HTML in bootstrap")
			}
			var parsed struct {
				Payload map[string]any `json:"payload"`
			}
			if err := json.Unmarshal([]byte(matches[0][1]), &parsed); err != nil {
				t.Fatal(err)
			}
			if parsed.Payload["extra"] != malicious {
				t.Fatal("escaping changed the payload")
			}
		})
	}
	if html := renderFeatureGateTemplate(t, "base.html", pongo2.Context{}); strings.Contains(html, `id="bsky-app-config"`) {
		t.Fatal("unconfigured server should omit bootstrap")
	}
}

func TestFeatureGateHTMLRevalidates(t *testing.T) {
	e := echo.New()
	rec := httptest.NewRecorder()
	ctx := e.NewContext(httptest.NewRequest(http.MethodGet, "/settings", nil), rec)
	renderer := newFeatureGateTestRenderer()
	if err := renderer.Render(rec, "base.html", pongo2.Context{}, ctx); err != nil {
		t.Fatal(err)
	}
	if got := rec.Header().Get("Cache-Control"); got != "no-cache" {
		t.Fatalf("expected document revalidation, got %q", got)
	}
}

/** Supply the generated script include so HTML checks also run before a web build. */
type featureGateTestLoader struct {
	pongo2.TemplateLoader
}

func (loader featureGateTestLoader) Get(path string) (io.Reader, error) {
	if path == "templates/scripts.html" {
		return strings.NewReader(`<script defer src="/app.js"></script>`), nil
	}
	return loader.TemplateLoader.Get(path)
}

func newFeatureGateTestRenderer() *Renderer {
	renderer := NewRenderer("templates/", &bskyweb.TemplateFS, false)
	renderer.TemplateSet = pongo2.NewSet("feature-gates", featureGateTestLoader{
		TemplateLoader: NewRendererLoader("templates/", &bskyweb.TemplateFS),
	})
	return renderer
}

func renderFeatureGateTemplate(t *testing.T, name string, data pongo2.Context) string {
	t.Helper()
	var buf bytes.Buffer
	e := echo.New()
	ctx := e.NewContext(httptest.NewRequest(http.MethodGet, "/", nil), httptest.NewRecorder())
	if err := newFeatureGateTestRenderer().Render(&buf, name, data, ctx); err != nil {
		t.Fatal(err)
	}
	return buf.String()
}
