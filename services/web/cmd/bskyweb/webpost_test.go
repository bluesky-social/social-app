package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
	"github.com/bluesky-social/indigo/xrpc"
	"github.com/bluesky-social/social-app/bskyweb"
	"github.com/labstack/echo/v4"
)

/*
A facet pair whose anchor is longer than its uri ("http://a..." vs "http://a")
used to make ExpandPostText slice with a negative low bound, which panicked the
handler and dropped the connection. Drive the real handler so a panic fails here.
*/

func hostileFacetPost() map[string]any {
	return map[string]any{
		"$type":     "app.bsky.feed.post",
		"text":      "http://a...http://a...",
		"createdAt": "2026-10-01T00:00:00.000Z",
		"facets": []map[string]any{
			{
				"index":    map[string]any{"byteStart": 0, "byteEnd": 11},
				"features": []map[string]any{{"$type": "app.bsky.richtext.facet#link", "uri": "http://a"}},
			},
			{
				"index":    map[string]any{"byteStart": 0, "byteEnd": 8},
				"features": []map[string]any{{"$type": "app.bsky.richtext.facet#link", "uri": "http://a"}},
			},
		},
	}
}

func postViewJSON(uri, did, handle string, record map[string]any, replyCount int) map[string]any {
	return map[string]any{
		"uri":       uri,
		"cid":       "bafyreiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		"author":    map[string]any{"did": did, "handle": handle},
		"record":    record,
		"indexedAt": "2026-10-01T00:00:00.000Z",
		"likeCount": 0, "replyCount": replyCount, "repostCount": 0, "quoteCount": 0,
	}
}

// appviewWithThread serves getPostThread with `thread` and fails everything else.
func appviewWithThread(t *testing.T, thread map[string]any) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/xrpc/app.bsky.feed.getPostThread" {
			t.Errorf("unexpected appview call %s", r.URL.String())
			http.Error(w, "unexpected", http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(map[string]any{"thread": thread}); err != nil {
			t.Errorf("encode: %v", err)
		}
	}))
}

// renderWebPost runs the real WebPost handler against a fake appview and
// returns the recorded response, failing the test on a panic.
func renderWebPost(t *testing.T, thread map[string]any) *httptest.ResponseRecorder {
	t.Helper()
	if _, err := bskyweb.TemplateFS.ReadFile("templates/scripts.html"); err != nil {
		t.Skip("templates/scripts.html not present (run yarn build-web first)")
	}
	appview := appviewWithThread(t, thread)
	defer appview.Close()

	e := echo.New()
	e.HideBanner = true
	e.Renderer = NewRenderer("templates/", &bskyweb.TemplateFS, false)
	srv := &Server{
		echo:  e,
		xrpcc: &xrpc.Client{Client: appview.Client(), Host: appview.URL},
		cfg:   &Config{},
	}
	e.GET("/profile/:handleOrDID/post/:rkey", srv.WebPost)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/profile/victim.test/post/victimpost", nil)
	defer func() {
		if panicked := recover(); panicked != nil {
			t.Fatalf("WebPost panicked on an appview record: %v", panicked)
		}
	}()
	e.ServeHTTP(rec, req)
	return rec
}

func TestWebPostRendersHostileFacetReply(t *testing.T) {
	victim := postViewJSON(
		"at://did:plc:victim/app.bsky.feed.post/victimpost",
		"did:plc:victim", "victim.test",
		map[string]any{"$type": "app.bsky.feed.post", "text": "hello world", "createdAt": "2026-10-01T00:00:00.000Z"},
		1,
	)
	attacker := postViewJSON(
		"at://did:plc:attacker/app.bsky.feed.post/evilpost",
		"did:plc:attacker", "attacker.test",
		hostileFacetPost(), 0,
	)
	rec := renderWebPost(t, map[string]any{
		"$type":   "app.bsky.feed.defs#threadViewPost",
		"post":    victim,
		"replies": []any{map[string]any{"$type": "app.bsky.feed.defs#threadViewPost", "post": attacker}},
	})

	if rec.Code != http.StatusOK {
		t.Fatalf("status %d, want 200", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, "hello world") {
		t.Fatalf("rendered page lost the post text:\n%s", body)
	}
	if !strings.Contains(body, `application/ld+json`) {
		t.Fatalf("rendered page lost its JSON-LD")
	}
	// the reply must still be represented, just without a poisoned expansion
	if !strings.Contains(body, `"@type":"Comment"`) {
		t.Fatalf("rendered JSON-LD lost the reply")
	}
}

func TestWebPostRendersSelfHostileFacets(t *testing.T) {
	attacker := postViewJSON(
		"at://did:plc:attacker/app.bsky.feed.post/evilpost",
		"did:plc:attacker", "attacker.test",
		hostileFacetPost(), 0,
	)
	rec := renderWebPost(t, map[string]any{
		"$type": "app.bsky.feed.defs#threadViewPost",
		"post":  attacker,
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d, want 200", rec.Code)
	}
}

// A post quoted by the page's post is expanded through the same helper, so the
// quoted record must not be able to take the page down either.
func TestWebPostRendersHostileQuotedRecord(t *testing.T) {
	quoted := postViewJSON(
		"at://did:plc:attacker/app.bsky.feed.post/evilpost",
		"did:plc:attacker", "attacker.test",
		hostileFacetPost(), 0,
	)
	page := postViewJSON(
		"at://did:plc:victim/app.bsky.feed.post/victimpost",
		"did:plc:victim", "victim.test",
		map[string]any{"$type": "app.bsky.feed.post", "text": "look at this", "createdAt": "2026-10-01T00:00:00.000Z"},
		0,
	)
	page["embed"] = map[string]any{
		"$type": "app.bsky.embed.record#view",
		"record": map[string]any{
			"$type":     "app.bsky.embed.record#viewRecord",
			"uri":       quoted["uri"],
			"cid":       quoted["cid"],
			"author":    quoted["author"],
			"value":     hostileFacetPost(),
			"labels":    []any{},
			"indexedAt": "2026-10-01T00:00:00.000Z",
		},
	}
	rec := renderWebPost(t, map[string]any{
		"$type": "app.bsky.feed.defs#threadViewPost",
		"post":  page,
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d, want 200", rec.Code)
	}
	if body := rec.Body.String(); !strings.Contains(body, "look at this") {
		t.Fatalf("rendered page lost the quoting post's text")
	}
}

var _ = appbsky.FeedPost{} // keep the indigo api import meaningful if helpers change
