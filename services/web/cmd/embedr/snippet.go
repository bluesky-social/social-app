package main

import (
	"bytes"
	"fmt"
	"html/template"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
	"github.com/bluesky-social/indigo/atproto/syntax"
)

func (srv *Server) postEmbedHTML(postView *appbsky.FeedDefs_PostView) (string, error) {
	// ensure that there isn't an injection from the URI
	aturi, err := syntax.ParseATURI(postView.Uri)
	if err != nil {
		log.Error("bad AT-URI in reponse", "aturi", aturi, "err", err)
		return "", err
	}

	post, ok := postView.Record.Val.(*appbsky.FeedPost)
	if !ok {
		log.Error("bad post record value", "err", err)
		return "", err
	}

	const tpl = `<blockquote class="bluesky-embed" data-bluesky-uri="{{ .PostURI }}" data-bluesky-cid="{{ .PostCID }}"><p{{ if .PostLang }} lang="{{ .PostLang }}"{{ end }}>{{ .PostText }}</p>&mdash; <a href="{{ .ProfileURL }}">{{ .PostAuthor }}</a> <a href="{{ .PostURL }}">{{ .PostIndexedAt }}</a></blockquote><script async src="{{ .WidgetURL }}" charset="utf-8"></script>`

	t, err := template.New("snippet").Parse(tpl)
	if err != nil {
		log.Error("template parse error", "err", err)
		return "", err
	}

	sortAt := postView.IndexedAt
	createdAt, err := syntax.ParseDatetime(post.CreatedAt)
	if nil == err && createdAt.String() < sortAt {
		sortAt = createdAt.String()
	}

	var lang string
	if len(post.Langs) > 0 {
		lang = post.Langs[0]
	}
	var authorName string
	if postView.Author.DisplayName != nil {
		authorName = fmt.Sprintf("%s (@%s)", *postView.Author.DisplayName, postView.Author.Handle)
	} else {
		authorName = fmt.Sprintf("@%s", postView.Author.Handle)
	}
	data := struct {
		PostURI       template.URL
		PostCID       string
		PostLang      string
		PostText      string
		PostAuthor    string
		PostIndexedAt string
		ProfileURL    template.URL
		PostURL       template.URL
		WidgetURL     template.URL
	}{
		PostURI:       template.URL(postView.Uri),
		PostCID:       postView.Cid,
		PostLang:      lang,
		PostText:      post.Text,
		PostAuthor:    authorName,
		PostIndexedAt: sortAt,
		ProfileURL:    template.URL(fmt.Sprintf("https://bsky.app/profile/%s?ref_src=embed", aturi.Authority())),
		PostURL:       template.URL(fmt.Sprintf("https://bsky.app/profile/%s/post/%s?ref_src=embed", aturi.Authority(), aturi.RecordKey())),
		WidgetURL:     template.URL("https://embed.bsky.app/static/embed.js"),
	}

	var buf bytes.Buffer
	err = t.Execute(&buf, data)
	if err != nil {
		log.Error("template parse error", "err", err)
		return "", err
	}
	return buf.String(), nil
}
