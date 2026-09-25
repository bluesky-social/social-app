package main

import (
	"fmt"
	"testing"

	comatprototypes "github.com/bluesky-social/indigo/api/atproto"
	appbsky "github.com/bluesky-social/indigo/api/bsky"
	lexutil "github.com/bluesky-social/indigo/lex/util"
)

// Tests for sharedContent (quote posts, link cards) and the parentItem
// ancestor chain.

// quoteOpts configures a quoted-post fixture.
type quoteOpts struct {
	handle, did, rkey, text string
	// postLabel is a labeler-applied label on the quoted record.
	postLabel string
	// selfLabel is a self-label in the quoted record value.
	selfLabel string
	// noUnauth marks the quoted author as !no-unauthenticated.
	noUnauth bool
}

func makeViewRecord(o quoteOpts) *appbsky.EmbedRecord_ViewRecord {
	post := &appbsky.FeedPost{Text: o.text, CreatedAt: "2024-01-01T00:00:00Z"}
	if o.selfLabel != "" {
		post.Labels = &appbsky.FeedPost_Labels{
			LabelDefs_SelfLabels: &comatprototypes.LabelDefs_SelfLabels{
				Values: []*comatprototypes.LabelDefs_SelfLabel{{Val: o.selfLabel}},
			},
		}
	}
	vr := &appbsky.EmbedRecord_ViewRecord{
		Uri: "at://" + o.did + "/app.bsky.feed.post/" + o.rkey,
		Cid: "bafy-quoted",
		Author: &appbsky.ActorDefs_ProfileViewBasic{
			Did:         o.did,
			Handle:      o.handle,
			DisplayName: strPtr("Quoted User"),
		},
		IndexedAt: "2024-01-01T00:00:00Z",
		Value:     &lexutil.LexiconTypeDecoder{Val: post},
	}
	if o.postLabel != "" {
		vr.Labels = append(vr.Labels, &comatprototypes.LabelDefs_Label{Val: o.postLabel, Src: "did:plc:labeler"})
	}
	if o.noUnauth {
		vr.Author.Labels = append(vr.Author.Labels, &comatprototypes.LabelDefs_Label{Val: "!no-unauthenticated", Src: o.did})
	}
	return vr
}

// withQuote adds a record (quote-post) embed with full record value.
func withQuote(o quoteOpts) func(*appbsky.FeedDefs_PostView) {
	return func(pv *appbsky.FeedDefs_PostView) {
		pv.Embed = &appbsky.FeedDefs_PostView_Embed{
			EmbedRecord_View: &appbsky.EmbedRecord_View{
				Record: &appbsky.EmbedRecord_View_Record{EmbedRecord_ViewRecord: makeViewRecord(o)},
			},
		}
	}
}

func externalView(uri string) *appbsky.EmbedExternal_View {
	return &appbsky.EmbedExternal_View{
		External: &appbsky.EmbedExternal_ViewExternal{
			Uri:         uri,
			Title:       "Article Title",
			Description: "Article description",
			Thumb:       strPtr("https://cdn.bsky.app/img/feed_thumbnail/plain/ext@jpeg"),
		},
	}
}

// withExternalThumb adds an external link embed with a thumb.
func withExternalThumb(uri string) func(*appbsky.FeedDefs_PostView) {
	return func(pv *appbsky.FeedDefs_PostView) {
		pv.Embed = &appbsky.FeedDefs_PostView_Embed{EmbedExternal_View: externalView(uri)}
	}
}

// withQuoteAndExternal adds a record-with-media embed carrying both a quoted
// post and an external link card.
func withQuoteAndExternal(o quoteOpts, uri string) func(*appbsky.FeedDefs_PostView) {
	return func(pv *appbsky.FeedDefs_PostView) {
		pv.Embed = &appbsky.FeedDefs_PostView_Embed{
			EmbedRecordWithMedia_View: &appbsky.EmbedRecordWithMedia_View{
				Record: &appbsky.EmbedRecord_View{
					Record: &appbsky.EmbedRecord_View_Record{EmbedRecord_ViewRecord: makeViewRecord(o)},
				},
				Media: &appbsky.EmbedRecordWithMedia_View_Media{EmbedExternal_View: externalView(uri)},
			},
		}
	}
}

// withAuthorNoUnauth marks the post author as !no-unauthenticated.
func withAuthorNoUnauth() func(*appbsky.FeedDefs_PostView) {
	return func(pv *appbsky.FeedDefs_PostView) {
		pv.Author.Labels = append(pv.Author.Labels, &comatprototypes.LabelDefs_Label{
			Val: "!no-unauthenticated", Src: pv.Author.Did,
		})
	}
}

var bobQuote = quoteOpts{handle: "bob.example.com", did: "did:plc:bob", rkey: "xyz", text: "original thought"}

func mainEntity(t *testing.T, out string) map[string]any {
	t.Helper()
	return unmarshalLD(t, out)["mainEntity"].(map[string]any)
}

func TestSharedContent_QuotePost(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "quoting!", withQuote(bobQuote))
	out, _ := buildPostJSONLD(pv, nil, "u", "", hideEmbedLabels, hideReplyLabels)
	main := mainEntity(t, out)

	// isBasedOn is retained alongside sharedContent.
	wantURL := "https://bsky.app/profile/bob.example.com/post/xyz"
	if main["isBasedOn"] != wantURL {
		t.Errorf("isBasedOn = %v, want %v", main["isBasedOn"], wantURL)
	}
	sc, ok := main["sharedContent"].(map[string]any)
	if !ok {
		t.Fatalf("sharedContent should be a single object, got %T", main["sharedContent"])
	}
	if sc["@type"] != "DiscussionForumPosting" {
		t.Errorf("@type = %v", sc["@type"])
	}
	if sc["url"] != wantURL {
		t.Errorf("url = %v", sc["url"])
	}
	if sc["identifier"] != "at://did:plc:bob/app.bsky.feed.post/xyz" {
		t.Errorf("identifier = %v", sc["identifier"])
	}
	if sc["text"] != "original thought" {
		t.Errorf("text = %v", sc["text"])
	}
	if sc["datePublished"] != "2024-01-01T00:00:00Z" {
		t.Errorf("datePublished = %v", sc["datePublished"])
	}
	author, _ := sc["author"].(map[string]any)
	if author == nil || author["name"] != "Quoted User" || author["url"] != "https://bsky.app/profile/bob.example.com" {
		t.Errorf("author = %v", sc["author"])
	}
	// Lightweight node: no stats.
	if _, present := sc["interactionStatistic"]; present {
		t.Errorf("quoted post should not carry interactionStatistic")
	}
}

func TestSharedContent_QuoteHandleInvalid(t *testing.T) {
	q := bobQuote
	q.handle = "handle.invalid"
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "quoting!", withQuote(q))
	out, _ := buildPostJSONLD(pv, nil, "u", "", hideEmbedLabels, hideReplyLabels)
	sc := mainEntity(t, out)["sharedContent"].(map[string]any)
	if sc["url"] != "https://bsky.app/profile/did:plc:bob/post/xyz" {
		t.Errorf("url should fall back to DID form, got %v", sc["url"])
	}
}

func TestSharedContent_QuoteGated(t *testing.T) {
	cases := []struct {
		name string
		opts func() []func(*appbsky.FeedDefs_PostView)
	}{
		{"blocked", func() []func(*appbsky.FeedDefs_PostView) {
			return []func(*appbsky.FeedDefs_PostView){withQuotePostBlocked()}
		}},
		{"quoted post labeled (reply label)", func() []func(*appbsky.FeedDefs_PostView) {
			q := bobQuote
			q.postLabel = "spam"
			return []func(*appbsky.FeedDefs_PostView){withQuote(q)}
		}},
		{"quoted post self-labeled (embed label)", func() []func(*appbsky.FeedDefs_PostView) {
			q := bobQuote
			q.selfLabel = "porn"
			return []func(*appbsky.FeedDefs_PostView){withQuote(q)}
		}},
		{"quoted author no-unauthenticated", func() []func(*appbsky.FeedDefs_PostView) {
			q := bobQuote
			q.noUnauth = true
			return []func(*appbsky.FeedDefs_PostView){withQuote(q)}
		}},
		{"quoting post embeds hidden", func() []func(*appbsky.FeedDefs_PostView) {
			return []func(*appbsky.FeedDefs_PostView){withQuote(bobQuote), withSelfLabel("porn")}
		}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "quoting", tc.opts()...)
			out, _ := buildPostJSONLD(pv, nil, "u", "", hideEmbedLabels, hideReplyLabels)
			main := mainEntity(t, out)
			if sc, present := main["sharedContent"]; present {
				t.Errorf("sharedContent should be omitted, got %v", sc)
			}
			if ib, present := main["isBasedOn"]; present {
				t.Errorf("isBasedOn should be omitted, got %v", ib)
			}
		})
	}
}

func TestSharedContent_ExternalLinkCard(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "read this",
		withExternalThumb("https://www.spiegel.de/article"))
	out, _ := buildPostJSONLD(pv, nil, "u", "", hideEmbedLabels, hideReplyLabels)
	main := mainEntity(t, out)
	sc, ok := main["sharedContent"].(map[string]any)
	if !ok {
		t.Fatalf("sharedContent missing")
	}
	want := map[string]string{
		"@type":       "WebPage",
		"url":         "https://www.spiegel.de/article",
		"name":        "Article Title",
		"description": "Article description",
		"image":       "https://cdn.bsky.app/img/feed_thumbnail/plain/ext@jpeg",
	}
	for k, v := range want {
		if sc[k] != v {
			t.Errorf("sharedContent.%s = %v, want %v", k, sc[k], v)
		}
	}
	// Link-preview image belongs in sharedContent, not the post's image[].
	if _, present := main["image"]; present {
		t.Errorf("link card thumb should not appear in post image[]")
	}
}

func TestSharedContent_QuoteAndLinkCard(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "both",
		withQuoteAndExternal(bobQuote, "https://example.com/a"))
	out, _ := buildPostJSONLD(pv, nil, "u", "", hideEmbedLabels, hideReplyLabels)
	main := mainEntity(t, out)
	arr, ok := main["sharedContent"].([]any)
	if !ok || len(arr) != 2 {
		t.Fatalf("sharedContent should be a 2-element array, got %v", main["sharedContent"])
	}
	if arr[0].(map[string]any)["@type"] != "DiscussionForumPosting" {
		t.Errorf("first entry should be the quoted post, got %v", arr[0])
	}
	if arr[1].(map[string]any)["@type"] != "WebPage" {
		t.Errorf("second entry should be the link card, got %v", arr[1])
	}
	if main["isBasedOn"] != "https://bsky.app/profile/bob.example.com/post/xyz" {
		t.Errorf("isBasedOn = %v", main["isBasedOn"])
	}
}

func TestSharedContent_QuoteGatedLinkCardKept(t *testing.T) {
	// A hidden quote drops out but the link card remains, as a single object.
	q := bobQuote
	q.postLabel = "spam"
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "both",
		withQuoteAndExternal(q, "https://example.com/a"))
	out, _ := buildPostJSONLD(pv, nil, "u", "", hideEmbedLabels, hideReplyLabels)
	sc, ok := mainEntity(t, out)["sharedContent"].(map[string]any)
	if !ok || sc["@type"] != "WebPage" {
		t.Errorf("expected single WebPage, got %v", sc)
	}
}

func TestSharedContent_OnComments(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "main")
	quoting := makePostView("bob.bsky.social", "did:plc:bob", "rep1", "see", withQuote(quoteOpts{
		handle: "carol.bsky.social", did: "did:plc:carol", rkey: "q1", text: "carol said",
	}))
	linking := makePostView("dan.bsky.social", "did:plc:dan", "rep2", "link", withExternalThumb("https://example.com/b"))
	out, _ := buildPostJSONLD(pv, threadWithReplies(buildReplies(quoting, linking)), "u", "", hideEmbedLabels, hideReplyLabels)
	comments := mainEntity(t, out)["comment"].([]any)
	if len(comments) != 2 {
		t.Fatalf("expected 2 comments, got %d", len(comments))
	}
	c0 := comments[0].(map[string]any)["sharedContent"].(map[string]any)
	if c0["@type"] != "DiscussionForumPosting" || c0["text"] != "carol said" {
		t.Errorf("comment 0 sharedContent = %v", c0)
	}
	c1 := comments[1].(map[string]any)["sharedContent"].(map[string]any)
	if c1["@type"] != "WebPage" || c1["url"] != "https://example.com/b" {
		t.Errorf("comment 1 sharedContent = %v", c1)
	}
}

func TestSharedContent_ProfileHasPart(t *testing.T) {
	recent := makePostView("alice.bsky.social", "did:plc:alice", "p1", "quoting", withQuote(bobQuote))
	out, err := buildProfileJSONLD(newProfileViewDetailed(), []*appbsky.FeedDefs_PostView{recent}, hideEmbedLabels, hideReplyLabels)
	if err != nil {
		t.Fatal(err)
	}
	part := unmarshalLD(t, out)["hasPart"].([]any)[0].(map[string]any)
	if sc, ok := part["sharedContent"].(map[string]any); !ok || sc["@type"] != "DiscussionForumPosting" {
		t.Errorf("hasPart sharedContent = %v", part["sharedContent"])
	}
}

func TestComments_DropNoUnauthenticatedAuthor(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "main")
	good := makePostView("bob.bsky.social", "did:plc:bob", "good", "visible")
	private := makePostView("eve.bsky.social", "did:plc:eve", "priv", "private text", withAuthorNoUnauth())
	out, _ := buildPostJSONLD(pv, threadWithReplies(buildReplies(good, private)), "u", "", hideEmbedLabels, hideReplyLabels)
	ids := commentIdentifiers(t, out)
	if len(ids) != 1 || ids[0] != good.Uri {
		t.Errorf("expected only the public reply, got %v", ids)
	}
}

// buildChain returns a thread view for leaf whose parent chain is ancestors,
// ordered nearest-first. A nil entry is rendered as a blocked parent.
func buildChain(leaf *appbsky.FeedDefs_PostView, ancestors ...*appbsky.FeedDefs_PostView) *appbsky.FeedDefs_ThreadViewPost {
	var parent *appbsky.FeedDefs_ThreadViewPost_Parent
	for i := len(ancestors) - 1; i >= 0; i-- {
		if ancestors[i] == nil {
			parent = &appbsky.FeedDefs_ThreadViewPost_Parent{
				FeedDefs_BlockedPost: &appbsky.FeedDefs_BlockedPost{Uri: "at://did:plc:x/app.bsky.feed.post/blocked", Blocked: true},
			}
			continue
		}
		parent = &appbsky.FeedDefs_ThreadViewPost_Parent{
			FeedDefs_ThreadViewPost: &appbsky.FeedDefs_ThreadViewPost{Post: ancestors[i], Parent: parent},
		}
	}
	return &appbsky.FeedDefs_ThreadViewPost{Post: leaf, Parent: parent}
}

// makeThread returns a leaf reply plus n ancestors (nearest-first). The last
// ancestor is the thread root; the rest are replies to it.
func makeThread(n int) (*appbsky.FeedDefs_PostView, []*appbsky.FeedDefs_PostView) {
	ancestors := make([]*appbsky.FeedDefs_PostView, n)
	for i := 0; i < n; i++ {
		rkey := fmt.Sprintf("anc%02d", i)
		if i == n-1 {
			ancestors[i] = makePostView("root.bsky.social", "did:plc:root", "rootrkey", "root post")
		} else {
			ancestors[i] = makePostView(fmt.Sprintf("a%02d.bsky.social", i), fmt.Sprintf("did:plc:a%02d", i), rkey,
				fmt.Sprintf("ancestor %d", i), withReplyRoot("did:plc:root", "rootrkey"))
		}
	}
	leaf := makePostView("alice.bsky.social", "did:plc:alice", "leaf", "leaf reply", withReplyRoot("did:plc:root", "rootrkey"))
	return leaf, ancestors
}

// chainIdentifiers walks mainEntity.parentItem and returns each identifier
// and @type, nearest-first.
func chainIdentifiers(t *testing.T, out string) (ids, types []string) {
	t.Helper()
	node, _ := mainEntity(t, out)["parentItem"].(map[string]any)
	for node != nil {
		ids = append(ids, fmt.Sprint(node["identifier"]))
		types = append(types, fmt.Sprint(node["@type"]))
		node, _ = node["parentItem"].(map[string]any)
	}
	return ids, types
}

func TestParentItem_None(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "top-level")
	out, _ := buildPostJSONLD(pv, buildChain(pv), "u", "", hideEmbedLabels, hideReplyLabels)
	if p, present := mainEntity(t, out)["parentItem"]; present {
		t.Errorf("non-reply should not have parentItem, got %v", p)
	}
}

func TestParentItem_Chain(t *testing.T) {
	leaf, ancestors := makeThread(3)
	out, _ := buildPostJSONLD(leaf, buildChain(leaf, ancestors...), "u", "https://bsky.app/profile/root.bsky.social/post/rootrkey", hideEmbedLabels, hideReplyLabels)
	ids, types := chainIdentifiers(t, out)
	wantIDs := []string{ancestors[0].Uri, ancestors[1].Uri, ancestors[2].Uri}
	if fmt.Sprint(ids) != fmt.Sprint(wantIDs) {
		t.Errorf("chain ids = %v, want %v", ids, wantIDs)
	}
	wantTypes := []string{"Comment", "Comment", "DiscussionForumPosting"}
	if fmt.Sprint(types) != fmt.Sprint(wantTypes) {
		t.Errorf("chain types = %v, want %v", types, wantTypes)
	}
	main := mainEntity(t, out)
	// isPartOf is retained alongside parentItem.
	if main["isPartOf"] != "https://bsky.app/profile/root.bsky.social/post/rootrkey" {
		t.Errorf("isPartOf = %v", main["isPartOf"])
	}
	// Ancestors are lightweight: text/author/date but no stats or comments.
	p := main["parentItem"].(map[string]any)
	if p["text"] != "ancestor 0" || p["author"] == nil || p["datePublished"] == nil || p["url"] == nil {
		t.Errorf("parentItem missing core fields: %v", p)
	}
	for _, k := range []string{"interactionStatistic", "comment", "commentCount"} {
		if _, present := p[k]; present {
			t.Errorf("parentItem should not carry %s", k)
		}
	}
}

func TestParentItem_Capped(t *testing.T) {
	leaf, ancestors := makeThread(15)
	out, _ := buildPostJSONLD(leaf, buildChain(leaf, ancestors...), "u", "", hideEmbedLabels, hideReplyLabels)
	ids, types := chainIdentifiers(t, out)
	if len(ids) != maxAncestors {
		t.Fatalf("chain length = %d, want %d", len(ids), maxAncestors)
	}
	if ids[0] != ancestors[0].Uri {
		t.Errorf("chain should start at the nearest parent, got %v", ids[0])
	}
	// Truncated before the root, so no node is typed as the root.
	for i, typ := range types {
		if typ != "Comment" {
			t.Errorf("node %d type = %v, want Comment", i, typ)
		}
	}
}

func TestParentItem_StopsAtUnshowable(t *testing.T) {
	cases := []struct {
		name   string
		mutate func(ancestors []*appbsky.FeedDefs_PostView) []*appbsky.FeedDefs_PostView
	}{
		{"blocked", func(a []*appbsky.FeedDefs_PostView) []*appbsky.FeedDefs_PostView {
			a[1] = nil
			return a
		}},
		{"reply label", func(a []*appbsky.FeedDefs_PostView) []*appbsky.FeedDefs_PostView {
			withPostLabel("spam", false)(a[1])
			return a
		}},
		{"embed self-label", func(a []*appbsky.FeedDefs_PostView) []*appbsky.FeedDefs_PostView {
			withSelfLabel("porn")(a[1])
			return a
		}},
		{"no-unauthenticated author", func(a []*appbsky.FeedDefs_PostView) []*appbsky.FeedDefs_PostView {
			withAuthorNoUnauth()(a[1])
			return a
		}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			leaf, ancestors := makeThread(4)
			ancestors = tc.mutate(ancestors)
			out, _ := buildPostJSONLD(leaf, buildChain(leaf, ancestors...), "u", "", hideEmbedLabels, hideReplyLabels)
			ids, _ := chainIdentifiers(t, out)
			if len(ids) != 1 || ids[0] != ancestors[0].Uri {
				t.Errorf("chain should stop before ancestor 1, got %v", ids)
			}
		})
	}
}

func TestParentItem_NegatedLabelDoesNotStop(t *testing.T) {
	leaf, ancestors := makeThread(2)
	withPostLabel("spam", true)(ancestors[0])
	out, _ := buildPostJSONLD(leaf, buildChain(leaf, ancestors...), "u", "", hideEmbedLabels, hideReplyLabels)
	if ids, _ := chainIdentifiers(t, out); len(ids) != 2 {
		t.Errorf("negated label should not stop the chain, got %v", ids)
	}
}

func TestParentItem_FirstParentUnshowable(t *testing.T) {
	leaf, ancestors := makeThread(3)
	ancestors[0] = nil
	out, _ := buildPostJSONLD(leaf, buildChain(leaf, ancestors...), "u", "", hideEmbedLabels, hideReplyLabels)
	if p, present := mainEntity(t, out)["parentItem"]; present {
		t.Errorf("parentItem should be omitted when the direct parent is unshowable, got %v", p)
	}
}

func TestParentItem_AncestorSharedContent(t *testing.T) {
	leaf, ancestors := makeThread(1)
	withExternalThumb("https://example.com/root-link")(ancestors[0])
	out, _ := buildPostJSONLD(leaf, buildChain(leaf, ancestors...), "u", "", hideEmbedLabels, hideReplyLabels)
	p := mainEntity(t, out)["parentItem"].(map[string]any)
	sc, ok := p["sharedContent"].(map[string]any)
	if !ok || sc["url"] != "https://example.com/root-link" {
		t.Errorf("ancestor sharedContent = %v", p["sharedContent"])
	}
}
