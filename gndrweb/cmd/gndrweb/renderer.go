package main

import (
	"bytes"
	"embed"
	"errors"
	"fmt"
	"io"
	"path/filepath"

	"github.com/flosch/pongo2/v6"
	"github.com/labstack/echo/v4"
)

type RendererLoader struct {
	prefix string
	fs     *embed.FS
}

func NewRendererLoader(prefix string, fs *embed.FS) pongo2.TemplateLoader {
	return &RendererLoader{
		prefix: prefix,
		fs:     fs,
	}
}
func (l *RendererLoader) Abs(_, name string) string {
	// TODO: remove this workaround
	// Figure out why this method is being called
	// twice on template names resulting in a failure to resolve
	// the template name.
	if filepath.HasPrefix(name, l.prefix) {
		return name
	}
	return filepath.Join(l.prefix, name)
}

func (l *RendererLoader) Get(path string) (io.Reader, error) {
	b, err := l.fs.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("reading template %q failed: %w", path, err)
	}
	return bytes.NewReader(b), nil
}

type Renderer struct {
	TemplateSet *pongo2.TemplateSet
	Debug       bool
}

func NewRenderer(prefix string, fs *embed.FS, debug bool) *Renderer {
	return &Renderer{
		TemplateSet: pongo2.NewSet(prefix, NewRendererLoader(prefix, fs)),
		Debug:       debug,
	}
}

func (r Renderer) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	var ctx pongo2.Context

	if data != nil {
		var ok bool
		ctx, ok = data.(pongo2.Context)
		if !ok {
			return errors.New("no pongo2.Context data was passed")
		}
	}

	var t *pongo2.Template
	var err error

	if r.Debug {
		t, err = pongo2.FromFile(name)
	} else {
		t, err = r.TemplateSet.FromFile(name)
	}

	if err != nil {
		return err
	}

	return t.ExecuteWriter(ctx, w)
}
