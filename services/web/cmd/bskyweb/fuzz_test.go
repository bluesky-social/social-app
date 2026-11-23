package main

import (
	"testing"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
)

// FuzzExpandPostText: facet offsets come from arbitrary records, so expansion
// must not panic, drop the text, or grow without bound.
func FuzzExpandPostText(f *testing.F) {
	f.Add("http://a...http://a...", int64(0), int64(11), int64(0), int64(8), "http://a")
	f.Add("look at example.com/abcdefghi... ok", int64(8), int64(32), int64(-1), int64(-1), "https://example.com/abcdefghijklmnop")
	f.Add("", int64(0), int64(0), int64(-5), int64(-5), "")
	f.Add("abc", int64(3), int64(1), int64(0), int64(1<<40), "...")

	f.Fuzz(func(t *testing.T,
		text string,
		s0, e0, s1, e1 int64,
		uri string,
	) {
		post := &appbsky.FeedPost{
			Text: text,
			Facets: []*appbsky.RichtextFacet{
				{
					Index: &appbsky.RichtextFacet_ByteSlice{ByteStart: s0, ByteEnd: e0},
					Features: []*appbsky.RichtextFacet_Features_Elem{{
						RichtextFacet_Link: &appbsky.RichtextFacet_Link{
							LexiconTypeID: "app.bsky.richtext.facet#link",
							Uri:           uri,
						},
					}},
				},
				{
					Index: &appbsky.RichtextFacet_ByteSlice{ByteStart: s1, ByteEnd: e1},
					Features: []*appbsky.RichtextFacet_Features_Elem{{
						RichtextFacet_Link: &appbsky.RichtextFacet_Link{
							LexiconTypeID: "app.bsky.richtext.facet#link",
							Uri:           uri,
						},
					}},
				},
			},
		}

		got := ExpandPostText(post)

		// Expansion only ever replaces a short slice with a uri, so the result
		// cannot be longer than the text plus both uris.
		if max := len(text) + 2*len(uri) + 64; len(got) > max {
			t.Fatalf("output grew to %d bytes (text %d, uri %d)", len(got), len(text), len(uri))
		}
		// It must never silently drop a non-empty text when nothing expanded.
		if text != "" && got == "" {
			t.Fatalf("output empty for text %q", text)
		}
	})
}
