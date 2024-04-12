package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
	"github.com/bluesky-social/indigo/atproto/syntax"

	"github.com/labstack/echo/v4"
)

var ErrPostNotFound = errors.New("post not found")
var ErrPostNotPublic = errors.New("post is not publicly accessible")

func (srv *Server) getBlueskyPost(ctx context.Context, did syntax.DID, rkey syntax.RecordKey) (*appbsky.FeedDefs_PostView, error) {

	// requires two fetches: first fetch profile
	pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, did.String())
	if err != nil {
		log.Warnf("failed to fetch profile for: %s\t%v", did, err)
		// TODO: detect 404, specifically?
		return nil, ErrPostNotFound
	}
	for _, label := range pv.Labels {
		if label.Src == pv.Did && label.Val == "!no-unauthenticated" {
			return nil, ErrPostNotPublic
		}
	}

	// then fetch the post thread (with extra context)
	uri := fmt.Sprintf("at://%s/app.bsky.feed.post/%s", did, rkey)
	tpv, err := appbsky.FeedGetPostThread(ctx, srv.xrpcc, 1, 0, uri)
	if err != nil {
		log.Warnf("failed to fetch post: %s\t%v", uri, err)
		// TODO: detect 404, specifically?
		return nil, ErrPostNotFound
	}

	if tpv.Thread.FeedDefs_BlockedPost != nil {
		return nil, ErrPostNotPublic
	} else if tpv.Thread.FeedDefs_ThreadViewPost.Post == nil {
		return nil, ErrPostNotFound
	}
	return tpv.Thread.FeedDefs_ThreadViewPost.Post, nil
}

func (srv *Server) WebHome(c echo.Context) error {
	return c.Render(http.StatusOK, "home.html", nil)
}

type OEmbedResponse struct {
	Type         string `json:"type"`
	Version      string `json:"version"`
	AuthorName   string `json:"author_name,omitempty"`
	AuthorURL    string `json:"author_url,omitempty"`
	ProviderName string `json:"provider_url,omitempty"`
	CacheAge     int    `json:"cache_age,omitempty"`
	Width        int    `json:"width,omitempty"`
	Height       *int   `json:"height,omitempty"`
	HTML         string `json:"html,omitempty"`
}

func (srv *Server) parseBlueskyURL(ctx context.Context, raw string) (*syntax.ATURI, error) {

	if raw == "" {
		return nil, fmt.Errorf("empty url")
	}

	// first try simple AT-URI
	uri, err := syntax.ParseATURI(raw)
	if nil == err {
		return &uri, nil
	}

	// then try bsky.app post URL
	u, err := url.Parse(raw)
	if err != nil {
		return nil, err
	}
	if u.Hostname() != "bsky.app" {
		return nil, fmt.Errorf("only bsky.app URLs currently supported")
	}
	pathParts := strings.Split(u.Path, "/") // NOTE: pathParts[0] will be empty string
	if len(pathParts) != 5 || pathParts[1] != "profile" || pathParts[3] != "post" {
		return nil, fmt.Errorf("only bsky.app post URLs currently supported")
	}
	atid, err := syntax.ParseAtIdentifier(pathParts[2])
	if err != nil {
		return nil, err
	}
	rkey, err := syntax.ParseRecordKey(pathParts[4])
	if err != nil {
		return nil, err
	}
	var did syntax.DID
	if atid.IsHandle() {
		ident, err := srv.dir.Lookup(ctx, *atid)
		if err != nil {
			return nil, err
		}
		did = ident.DID
	} else {
		did, err = atid.AsDID()
		if err != nil {
			return nil, err
		}
	}

	// TODO: don't really need to re-parse here, if we had test coverage
	aturi, err := syntax.ParseATURI(fmt.Sprintf("at://%s/app.bsky.feed.post/%s", did, rkey))
	if err != nil {
		return nil, err
	} else {
		return &aturi, nil
	}
}

func (srv *Server) postEmbedHTML(post *appbsky.FeedDefs_PostView) string {
	aturi, err := syntax.ParseATURI(post.Uri)
	if err != nil {
		log.Error("bad AT-URI in reponse", "aturi", aturi)
	}
	// TODO: could add language, maybe other fiels here?
	// XXX: should actually use html/template for this render
	return fmt.Sprintf(
		"<iframe src=\"%s\" class=\"bluesky-post-embed\" data-aturi=\"%s\" data-record-cid=\"%s\"></iframe><script src=\"%s\" async=\"async\"></script>",
		fmt.Sprintf("https://embed.bsky.app/embed/%s/app.bsky.feed.post/%s", post.Author.Did, aturi.RecordKey()),
		post.Uri,
		post.Cid,
		"https://embed.bsky.app/iframe-resize.js",
	)
}

func (srv *Server) WebOEmbed(c echo.Context) error {
	formatParam := c.QueryParam("format")
	if formatParam != "" && formatParam != "json" {
		return c.String(http.StatusNotImplemented, "Unsupported oEmbed format: "+formatParam)
	}

	width := 550
	maxWidthParam := c.QueryParam("maxwidth")
	if maxWidthParam != "" {
		maxWidthInt, err := strconv.Atoi(maxWidthParam)
		if err != nil || maxWidthInt < 220 || maxWidthInt > 550 {
			return c.String(http.StatusBadRequest, "Invalid maxwidth (expected integer between 220 and 550)")
		}
		width = maxWidthInt
	}
	// NOTE: maxheight ignored

	aturi, err := srv.parseBlueskyURL(c.Request().Context(), c.QueryParam("url"))
	if err != nil {
		return c.String(http.StatusBadRequest, fmt.Sprintf("Expected 'url' to be bsky.app URL or AT-URI: %v", err))
	}
	if aturi.Collection() != syntax.NSID("app.bsky.feed.post") {
		return c.String(http.StatusNotImplemented, "Only posts (app.bsky.feed.post records) can be embedded currently")
	}
	did, err := aturi.Authority().AsDID()
	if err != nil {
		return err
	}

	post, err := srv.getBlueskyPost(c.Request().Context(), did, aturi.RecordKey())
	if err == ErrPostNotFound {
		return c.String(http.StatusNotFound, fmt.Sprintf("%v", err))
	} else if err == ErrPostNotPublic {
		return c.String(http.StatusForbidden, fmt.Sprintf("%v", err))
	} else if err != nil {
		return c.String(http.StatusInternalServerError, fmt.Sprintf("%v", err))
	}

	data := OEmbedResponse{
		Type:         "rich",
		Version:      "1.0",
		AuthorName:   "@" + post.Author.Handle,
		AuthorURL:    fmt.Sprintf("https://bsky.app/profile/%s", post.Author.Handle),
		ProviderName: "Bluesky Social",
		CacheAge:     86400,
		Width:        width,
		Height:       nil,
		HTML:         srv.postEmbedHTML(post),
	}
	if post.Author.DisplayName != nil {
		data.AuthorName = fmt.Sprintf("%s (@%s)", *post.Author.DisplayName, post.Author.Handle)
	}
	return c.JSON(http.StatusOK, data)
}

func (srv *Server) WebPostEmbed(c echo.Context) error {
	ctx := c.Request().Context()

	// sanity check arguments. don't 4xx, just let app handle if not expected format
	rkeyParam := c.QueryParam("rkey")
	rkey, err := syntax.ParseRecordKey(rkeyParam)
	if err != nil {
		return c.String(http.StatusBadRequest, fmt.Sprintf("Invalid RecordKey: %v", err))
	}
	didParam := c.QueryParam("did")
	did, err := syntax.ParseDID(didParam)
	if err != nil {
		return c.String(http.StatusBadRequest, fmt.Sprintf("Invalid DID: %v", err))
	}

	postView, err := srv.getBlueskyPost(ctx, did, rkey)
	if err == ErrPostNotFound {
		return c.String(http.StatusNotFound, fmt.Sprintf("%v", err))
	} else if err == ErrPostNotPublic {
		return c.String(http.StatusForbidden, fmt.Sprintf("%v", err))
	} else if err != nil {
		return c.String(http.StatusInternalServerError, fmt.Sprintf("%v", err))
	}

	data := map[string]interface{}{
		"post": postView,
	}
	return c.Render(http.StatusOK, "postEmbed.html", data)
}
