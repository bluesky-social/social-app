package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"

	"github.com/labstack/echo/v4"
)

func TestRendererDebugReloadsTemplates(t *testing.T) {
	templates := fstest.MapFS{
		"templates/home.html":    {Data: []byte(`<main>{% include "content.html" %}</main>`)},
		"templates/content.html": {Data: []byte("original content")},
	}
	renderer := NewRenderer("templates/", templates, true)
	e := echo.New()
	e.Renderer = renderer

	assertRender := func(want string) {
		t.Helper()
		rec := httptest.NewRecorder()
		c := e.NewContext(httptest.NewRequest(http.MethodGet, "/", nil), rec)
		if err := c.Render(http.StatusOK, "home.html", nil); err != nil {
			t.Fatalf("render home.html: %v", err)
		}
		if got := rec.Body.String(); got != want {
			t.Fatalf("rendered home.html = %q, want %q", got, want)
		}
	}

	assertRender("<main>original content</main>")
	templates["templates/content.html"].Data = []byte("updated content")
	assertRender("<main>updated content</main>")
}
