package main

import (
	"io/fs"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/bluesky-social/social-app/bskyweb"
	"github.com/labstack/echo/v4"
)

// The test's working directory has no static/ directory, just like the
// production image, which ships only the binary.
func TestRobotsDisallowAllServedFromStaticFS(t *testing.T) {
	staticRoot, err := fs.Sub(bskyweb.StaticFS, "static")
	if err != nil {
		t.Fatal(err)
	}
	e := echo.New()
	e.GET("/robots.txt", robotsDisallowAllHandler(staticRoot))

	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/robots.txt", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if body := rec.Body.String(); !strings.Contains(body, "Disallow: /") {
		t.Fatalf("body does not disallow crawling:\n%s", body)
	}
}
