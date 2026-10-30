package main

import (
	"errors"
	"io"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"testing/fstest"
	"time"

	"github.com/labstack/echo/v4"
)

// fakeS3 serves files like the public statics bucket, where a missing key is a 403.
type fakeS3 struct {
	mu       sync.Mutex
	files    map[string]string
	gets     map[string]int
	status   int
	failNext int
	release  chan struct{}
}

func newFakeS3(t *testing.T, files map[string]string) (*fakeS3, string) {
	t.Helper()
	f := &fakeS3{files: files, gets: map[string]int{}}
	srv := httptest.NewServer(f)
	t.Cleanup(srv.Close)
	return f, srv.URL + "/v1"
}

func (f *fakeS3) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	f.mu.Lock()
	f.gets[r.URL.Path]++
	body, ok := f.files[r.URL.Path]
	status, release := f.status, f.release
	if f.failNext > 0 {
		f.failNext--
		status = http.StatusInternalServerError
	}
	f.mu.Unlock()

	if release != nil {
		<-release
	}
	switch {
	case status != 0:
		w.WriteHeader(status)
	case !ok:
		w.WriteHeader(http.StatusForbidden)
	default:
		io.WriteString(w, body)
	}
}

func (f *fakeS3) update(fn func(f *fakeS3)) {
	f.mu.Lock()
	defer f.mu.Unlock()
	fn(f)
}

func (f *fakeS3) getsOf(path string) int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.gets[path]
}

func TestRemoteFSServesFromMemory(t *testing.T) {
	s3, baseURL := newFakeS3(t, map[string]string{"/v1/_expo/app.js": "console.log(1)"})
	remote := newRemoteFS(baseURL)

	for range 2 {
		b, err := fs.ReadFile(remote, "_expo/app.js")
		if err != nil {
			t.Fatal(err)
		}
		if string(b) != "console.log(1)" {
			t.Fatalf("got %q", b)
		}
	}
	if n := s3.getsOf("/v1/_expo/app.js"); n != 1 {
		t.Fatalf("got %d upstream GETs, want 1", n)
	}
}

func TestRemoteFSCoalescesConcurrentOpens(t *testing.T) {
	s3, baseURL := newFakeS3(t, map[string]string{"/v1/_expo/app.js": "console.log(1)"})
	release := make(chan struct{})
	s3.update(func(f *fakeS3) { f.release = release })
	remote := newRemoteFS(baseURL)

	const n = 10
	errs := make(chan error, n)
	var wg sync.WaitGroup
	for range n {
		wg.Go(func() {
			_, err := fs.ReadFile(remote, "_expo/app.js")
			errs <- err
		})
	}
	deadline := time.Now().Add(5 * time.Second)
	for s3.getsOf("/v1/_expo/app.js") == 0 {
		if time.Now().After(deadline) {
			t.Fatal("no upstream GET")
		}
		time.Sleep(time.Millisecond)
	}
	// Give the other opens time to join the download in flight.
	time.Sleep(50 * time.Millisecond)
	close(release)
	wg.Wait()
	close(errs)

	for err := range errs {
		if err != nil {
			t.Fatal(err)
		}
	}
	if got := s3.getsOf("/v1/_expo/app.js"); got != 1 {
		t.Fatalf("got %d upstream GETs, want 1", got)
	}
}

func TestRemoteFSMissingFile(t *testing.T) {
	for _, status := range []int{http.StatusForbidden, http.StatusNotFound} {
		s3, baseURL := newFakeS3(t, map[string]string{})
		s3.update(func(f *fakeS3) { f.status = status })
		_, err := newRemoteFS(baseURL).Open("_expo/app.js")
		if !errors.Is(err, fs.ErrNotExist) {
			t.Errorf("status %d: got %v, want fs.ErrNotExist", status, err)
		}
	}
}

func TestRemoteFSRetriesFailures(t *testing.T) {
	s3, baseURL := newFakeS3(t, map[string]string{})
	remote := newRemoteFS(baseURL)

	s3.update(func(f *fakeS3) { f.status = http.StatusInternalServerError })
	_, err := remote.Open("_expo/app.js")
	if err == nil || errors.Is(err, fs.ErrNotExist) || errors.Is(err, fs.ErrPermission) {
		t.Fatalf("got %v, want an upstream error", err)
	}

	s3.update(func(f *fakeS3) { f.status = 0 })
	if _, err := remote.Open("_expo/app.js"); !errors.Is(err, fs.ErrNotExist) {
		t.Fatalf("got %v, want fs.ErrNotExist", err)
	}

	s3.update(func(f *fakeS3) { f.files["/v1/_expo/app.js"] = "console.log(1)" })
	b, err := fs.ReadFile(remote, "_expo/app.js")
	if err != nil {
		t.Fatal(err)
	}
	if string(b) != "console.log(1)" {
		t.Fatalf("got %q", b)
	}
	if n := s3.getsOf("/v1/_expo/app.js"); n != 3 {
		t.Fatalf("got %d upstream GETs, want 3", n)
	}
}

func TestRemoteFSUnreachable(t *testing.T) {
	srv := httptest.NewServer(http.NotFoundHandler())
	srv.Close()
	_, err := newRemoteFS(srv.URL).Open("_expo/app.js")
	if err == nil || errors.Is(err, fs.ErrNotExist) || errors.Is(err, fs.ErrPermission) {
		t.Fatalf("got %v, want an upstream error", err)
	}
}

func TestOverlayFSRouting(t *testing.T) {
	base := fstest.MapFS{
		"templates/base.html":    {Data: []byte("embedded base")},
		"templates/scripts.html": {Data: []byte("embedded scripts")},
		"static/favicon.png":     {Data: []byte("embedded favicon")},
		"static/_expo/old.js":    {Data: []byte("embedded old")},
		"static/_exporter.js":    {Data: []byte("embedded exporter")},
	}
	remote := fstest.MapFS{
		"scripts.html": {Data: []byte("remote scripts")},
		"_expo/app.js": {Data: []byte("remote app")},
	}
	templates := &overlayFS{base: base, remote: remote, dir: "templates", paths: []string{"scripts.html", "fonts.html"}}
	static, err := fs.Sub(&overlayFS{base: base, remote: remote, dir: "static", paths: []string{"_expo", "assets"}}, "static")
	if err != nil {
		t.Fatal(err)
	}

	for _, tc := range []struct {
		fsys fs.FS
		name string
		want string
	}{
		{templates, "templates/base.html", "embedded base"},
		{templates, "templates/scripts.html", "remote scripts"},
		{templates, "templates/fonts.html", ""},
		{static, "favicon.png", "embedded favicon"},
		{static, "_exporter.js", "embedded exporter"},
		{static, "_expo/app.js", "remote app"},
		{static, "_expo/old.js", ""},
		{static, "assets/logo.png", ""},
	} {
		b, err := fs.ReadFile(tc.fsys, tc.name)
		if tc.want == "" {
			if !errors.Is(err, fs.ErrNotExist) {
				t.Errorf("%s: got %q, %v, want fs.ErrNotExist", tc.name, b, err)
			}
			continue
		}
		if err != nil || string(b) != tc.want {
			t.Errorf("%s: got %q, %v, want %q", tc.name, b, err, tc.want)
		}
	}
}

func TestRemoteStaticFileServer(t *testing.T) {
	s3, baseURL := newFakeS3(t, map[string]string{
		"/v1/_expo/static/js/app.js": "console.log(1)",
		"/v1/assets/logo.png":        "png",
	})
	_, static := remoteAppFS(baseURL)
	fsys, err := fs.Sub(static, "static")
	if err != nil {
		t.Fatal(err)
	}
	handler := http.FileServer(http.FS(fsys))
	get := func(path string, header ...string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		for i := 0; i+1 < len(header); i += 2 {
			req.Header.Set(header[i], header[i+1])
		}
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		return rec
	}

	rec := get("/_expo/static/js/app.js")
	if rec.Code != http.StatusOK || rec.Body.String() != "console.log(1)" {
		t.Fatalf("remote file: got %d %q", rec.Code, rec.Body.String())
	}
	if ct := rec.Header().Get("Content-Type"); !strings.Contains(ct, "javascript") {
		t.Errorf("remote file: got Content-Type %q", ct)
	}
	if rec := get("/_expo/static/js/app.js", "Range", "bytes=0-6"); rec.Code != http.StatusPartialContent || rec.Body.String() != "console" {
		t.Errorf("range: got %d %q", rec.Code, rec.Body.String())
	}
	if rec := get("/favicon.png"); rec.Code != http.StatusOK {
		t.Errorf("embedded file: got %d", rec.Code)
	}
	if rec := get("/_expo/static/js/missing.js"); rec.Code != http.StatusNotFound {
		t.Errorf("missing file: got %d", rec.Code)
	}
	if rec := get("/_expo/static/js"); rec.Code != http.StatusNotFound {
		t.Errorf("directory: got %d", rec.Code)
	}

	// A transient failure must be a 500, never a 404 the CDN could cache.
	s3.update(func(f *fakeS3) { f.failNext = 1 })
	if rec := get("/assets/logo.png"); rec.Code != http.StatusInternalServerError {
		t.Errorf("transient failure: got %d, want 500", rec.Code)
	}
	if rec := get("/assets/logo.png"); rec.Code != http.StatusOK {
		t.Errorf("after transient failure: got %d", rec.Code)
	}
	s3.update(func(f *fakeS3) { f.status = http.StatusServiceUnavailable })
	if rec := get("/_expo/static/js/other.js"); rec.Code != http.StatusInternalServerError {
		t.Errorf("upstream down: got %d, want 500", rec.Code)
	}
	if rec := get("/_expo/static/js/app.js"); rec.Code != http.StatusOK {
		t.Errorf("cached file with upstream down: got %d", rec.Code)
	}
}

func TestRemoteHomeNeedsFragments(t *testing.T) {
	s3, baseURL := newFakeS3(t, map[string]string{})
	templates, _ := remoteAppFS(baseURL)
	e := echo.New()
	e.HideBanner = true
	e.Logger.SetOutput(io.Discard)
	srv := &Server{echo: e, cfg: &Config{staticCDNHost: "https://cdn.test"}}
	e.Renderer = NewRenderer("templates/", templates, false)
	e.HTTPErrorHandler = srv.errorHandler
	e.GET("/", srv.WebHome)
	get := func() *httptest.ResponseRecorder {
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))
		return rec
	}

	for _, status := range []int{0, http.StatusInternalServerError} {
		s3.update(func(f *fakeS3) { f.status = status })
		if rec := get(); rec.Code != http.StatusInternalServerError {
			t.Fatalf("upstream status %d: got %d, want 500", status, rec.Code)
		}
	}

	// pongo2 must not have cached the failed parse.
	s3.update(func(f *fakeS3) {
		f.status = 0
		f.files["/v1/scripts.html"] = `<script src="{{ staticCDNHost }}/static/_expo/app.js"></script>`
		f.files["/v1/fonts.html"] = `<link rel="preload" href="/static/media/font.woff2">`
	})
	rec := get()
	if rec.Code != http.StatusOK {
		t.Fatalf("got %d, want 200", rec.Code)
	}
	body := rec.Body.String()
	for _, want := range []string{
		`<script src="https://cdn.test/static/_expo/app.js"></script>`,
		`<link rel="preload" href="/static/media/font.woff2">`,
	} {
		if !strings.Contains(body, want) {
			t.Errorf("body is missing %s", want)
		}
	}
}
