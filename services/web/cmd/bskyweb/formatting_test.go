package main

import (
	"encoding/json"
	"io"
	"os"
	"strings"
	"testing"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
)

func loadPost(t *testing.T, p string) appbsky.FeedPost {

	f, err := os.Open(p)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = f.Close() }()

	postBytes, err := io.ReadAll(f)
	if err != nil {
		t.Fatal(err)
	}
	var post appbsky.FeedPost
	if err := json.Unmarshal(postBytes, &post); err != nil {
		t.Fatal(err)
	}
	return post
}

func TestExpandPostText(t *testing.T) {
	post := loadPost(t, "testdata/atproto_embed_post.json")

	text := ExpandPostText(&post)
	if !strings.Contains(text, "https://github.com/snarfed/bridgy-fed") {
		t.Fail()
	}
}

// facetTestPost builds a post with facets as they arrive from a record.
func facetTestPost(text string, facets ...*appbsky.RichtextFacet) *appbsky.FeedPost {
	return &appbsky.FeedPost{Text: text, Facets: facets}
}

func linkFacetAt(start, end int64, uri string) *appbsky.RichtextFacet {
	return &appbsky.RichtextFacet{
		Index: &appbsky.RichtextFacet_ByteSlice{ByteStart: start, ByteEnd: end},
		Features: []*appbsky.RichtextFacet_Features_Elem{{
			RichtextFacet_Link: &appbsky.RichtextFacet_Link{
				LexiconTypeID: "app.bsky.richtext.facet#link",
				Uri:           uri,
			},
		}},
	}
}

// A facet may point at a uri shorter than the text it replaces ("http://a..."
// vs "http://a"), which drives the running offset negative.
func TestExpandPostTextNegativeOffset(t *testing.T) {
	post := facetTestPost(
		"http://a...http://a...",
		linkFacetAt(0, 11, "http://a"),
		linkFacetAt(0, 8, "http://a"),
	)
	if got := ExpandPostText(post); got == "" {
		t.Fatal("expansion dropped the whole text")
	}
}

// Out-of-range, negative and missing offsets are ignored.
func TestExpandPostTextHostileFacets(t *testing.T) {
	cases := map[string]*appbsky.FeedPost{
		"negative start": facetTestPost("http://a...", linkFacetAt(-1, 8, "http://a")),
		"negative end":   facetTestPost("http://a...", linkFacetAt(0, -1, "http://a")),
		"end past text":  facetTestPost("http://a...", linkFacetAt(0, 4000, "http://a")),
		"empty text":     facetTestPost("", linkFacetAt(0, 0, "http://a")),
		"nil index": {
			Text: "http://a...",
			Facets: []*appbsky.RichtextFacet{{
				Features: []*appbsky.RichtextFacet_Features_Elem{{
					RichtextFacet_Link: &appbsky.RichtextFacet_Link{
						LexiconTypeID: "app.bsky.richtext.facet#link",
						Uri:           "http://a",
					},
				}},
			}},
		},
		"nil feature": {
			Text:   "http://a...",
			Facets: []*appbsky.RichtextFacet{{Index: &appbsky.RichtextFacet_ByteSlice{ByteStart: 0, ByteEnd: 8}, Features: []*appbsky.RichtextFacet_Features_Elem{nil}}},
		},
		"many collapsing facets": facetTestPost(
			"http://a...http://a...http://a...http://a...",
			linkFacetAt(0, 11, "http://a"),
			linkFacetAt(0, 11, "http://a"),
			linkFacetAt(0, 11, "http://a"),
			linkFacetAt(0, 11, "http://a"),
		),
	}
	for name, post := range cases {
		t.Run(name, func(t *testing.T) {
			if got := ExpandPostText(post); got == "" && post.Text != "" {
				t.Fatalf("expansion dropped the whole text")
			}
		})
	}
}

// The legit path: the client shortens long urls and points the facet at the uri.
func TestExpandPostTextShortenedLink(t *testing.T) {
	post := facetTestPost(
		"look at example.com/abcdefghi... it is great",
		linkFacetAt(8, 32, "https://example.com/abcdefghijklmnop"),
	)
	got := ExpandPostText(post)
	want := "look at https://example.com/abcdefghijklmnop it is great"
	if got != want {
		t.Fatalf("got %q, want %q", got, want)
	}
}
