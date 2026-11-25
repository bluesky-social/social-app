package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"path"
	"strings"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/bluesky-social/social-app/bskyweb"
	"golang.org/x/sync/singleflight"
)

// remoteAppFS returns the template and static file systems for remote mode.
// The files that change with every web build come from the version's folder
// in the bucket, and everything else from the binary.
func remoteAppFS(client *s3.Client, bucket, version string) (templates fs.FS, static fs.FS) {
	remote := newRemoteFS(client, bucket, version)
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

// remoteFS is a read-only fs.FS over the files under prefix/ in bucket. Each file is
// downloaded at most once and then served from memory. Concurrent opens of
// the same file share one download. Failed downloads and missing files aren't
// kept, so the next open tries again. Directories are reported as missing.
type remoteFS struct {
	client *s3.Client
	bucket string
	prefix string
	group  singleflight.Group

	mu    sync.RWMutex
	files map[string][]byte
}

func newRemoteFS(client *s3.Client, bucket, prefix string) *remoteFS {
	return &remoteFS{
		client: client,
		bucket: bucket,
		prefix: prefix,
		files:  make(map[string][]byte),
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
	key := r.prefix + "/" + name
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	out, err := r.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(r.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		// S3 answers a missing key with 404 only to callers allowed to list
		// the bucket; otherwise it's a 403, an error here.
		var resp interface{ HTTPStatusCode() int }
		if errors.As(err, &resp) && resp.HTTPStatusCode() == http.StatusNotFound {
			return nil, fs.ErrNotExist
		}
		return nil, fmt.Errorf("downloading s3://%s/%s: %v", r.bucket, key, err)
	}
	defer out.Body.Close()

	data, err := io.ReadAll(out.Body)
	if err != nil {
		return nil, fmt.Errorf("downloading s3://%s/%s: %v", r.bucket, key, err)
	}
	return data, nil
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
