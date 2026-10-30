package main

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"net/url"
	"path"
	"strings"
	"sync"
	"time"

	"github.com/bluesky-social/social-app/bskyweb"
	"golang.org/x/sync/singleflight"
)

// remoteAppFS returns the template and static file systems for remote mode.
// The files that change with every web build come from the app version's
// folder at baseURL, and everything else from the binary.
func remoteAppFS(baseURL string) (templates fs.FS, static fs.FS) {
	remote := newRemoteFS(baseURL)
	templates = &overlayFS{
		base:   bskyweb.TemplateFS,
		remote: remote,
		dir:    "templates",
		paths:  []string{"scripts.html", "fonts.html"},
	}
	static = &overlayFS{
		base:   bskyweb.StaticFS,
		remote: remote,
		dir:    "static",
		paths:  []string{"_expo", "assets"},
	}
	return templates, static
}

// overlayFS serves the files and directories in paths, which are relative to
// dir, from remote, and every other name from base. In remote, the names are
// relative to its root: "<dir>/<path>" is opened as "<path>".
type overlayFS struct {
	base   fs.FS
	remote fs.FS
	dir    string
	paths  []string
}

func (o *overlayFS) Open(name string) (fs.File, error) {
	if rel, ok := strings.CutPrefix(name, o.dir+"/"); ok {
		for _, p := range o.paths {
			if rel == p || strings.HasPrefix(rel, p+"/") {
				return o.remote.Open(rel)
			}
		}
	}
	return o.base.Open(name)
}

// remoteFS is a read-only fs.FS over the files under baseURL. Each file is
// downloaded at most once and then served from memory. Concurrent opens of
// the same file share one download. Failed downloads and missing files aren't
// kept, so the next open tries again. Directories are reported as missing.
type remoteFS struct {
	baseURL string
	client  *http.Client
	group   singleflight.Group

	mu    sync.RWMutex
	files map[string][]byte
}

func newRemoteFS(baseURL string) *remoteFS {
	return &remoteFS{
		baseURL: strings.TrimSuffix(baseURL, "/"),
		client:  &http.Client{Timeout: 30 * time.Second},
		files:   make(map[string][]byte),
	}
}

func (r *remoteFS) Open(name string) (fs.File, error) {
	if !fs.ValidPath(name) {
		return nil, &fs.PathError{Op: "open", Path: name, Err: fs.ErrInvalid}
	}
	data, err := r.load(name)
	if err != nil {
		return nil, &fs.PathError{Op: "open", Path: name, Err: err}
	}
	return &memFile{
		Reader: bytes.NewReader(data),
		info:   memFileInfo{name: path.Base(name), size: int64(len(data))},
	}, nil
}

func (r *remoteFS) cached(name string) ([]byte, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	data, ok := r.files[name]
	return data, ok
}

func (r *remoteFS) load(name string) ([]byte, error) {
	if data, ok := r.cached(name); ok {
		return data, nil
	}
	v, err, _ := r.group.Do(name, func() (any, error) {
		// Covers a caller that missed the cache right before a download finished.
		if data, ok := r.cached(name); ok {
			return data, nil
		}
		data, err := r.download(name)
		if err != nil {
			if !errors.Is(err, fs.ErrNotExist) {
				log.Errorf("loading app file failed: %s", err)
			}
			return nil, err
		}
		r.mu.Lock()
		r.files[name] = data
		r.mu.Unlock()
		return data, nil
	})
	if err != nil {
		return nil, err
	}
	return v.([]byte), nil
}

// download returns fs.ErrNotExist for a missing file. Other errors are
// formatted with %v instead of wrapped so they can't match fs.ErrNotExist or
// fs.ErrPermission (e.g. a connect EACCES), which the file server would answer
// with a 404 or 403 instead of a 500.
func (r *remoteFS) download(name string) ([]byte, error) {
	u := r.baseURL + "/" + (&url.URL{Path: name}).EscapedPath()
	resp, err := r.client.Get(u)
	if err != nil {
		return nil, fmt.Errorf("downloading %s: %v", u, err)
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		data, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("downloading %s: %v", u, err)
		}
		return data, nil
	// The bucket allows anonymous GetObject but not ListBucket, so S3 answers
	// a missing key with 403 instead of 404.
	case http.StatusForbidden, http.StatusNotFound:
		return nil, fs.ErrNotExist
	default:
		return nil, fmt.Errorf("downloading %s: unexpected status %s", u, resp.Status)
	}
}

// memFile is an open remoteFS file. http.FileServer needs it to support Seek.
type memFile struct {
	*bytes.Reader
	info memFileInfo
}

func (f *memFile) Stat() (fs.FileInfo, error) { return f.info, nil }
func (f *memFile) Close() error               { return nil }

type memFileInfo struct {
	name string
	size int64
}

func (i memFileInfo) Name() string       { return i.name }
func (i memFileInfo) Size() int64        { return i.size }
func (i memFileInfo) Mode() fs.FileMode  { return 0o444 }
func (i memFileInfo) ModTime() time.Time { return time.Time{} }
func (i memFileInfo) IsDir() bool        { return false }
func (i memFileInfo) Sys() any           { return nil }
