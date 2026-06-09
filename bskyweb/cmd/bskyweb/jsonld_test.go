package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"testing"

	comatprototypes "github.com/bluesky-social/indigo/api/atproto"
	appbsky "github.com/bluesky-social/indigo/api/bsky"
	lexutil "github.com/bluesky-social/indigo/lex/util"
)

// Pointer helpers for optional appbsky fields.
func strPtr(s string) *string { return &s }
func intPtr(i int64) *int64   { return &i }

// newProfileViewDetailed returns a populated profile for tests.
func newProfileViewDetailed() *appbsky.ActorDefs_ProfileViewDetailed {
	return &appbsky.ActorDefs_ProfileViewDetailed{
		Did:            "did:plc:alice",
		Handle:         "alice.bsky.social",
		DisplayName:    strPtr("Alice"),
		Description:    strPtr("just a person"),
		Avatar:         strPtr("https://cdn.bsky.app/img/avatar/plain/a@jpeg"),
		FollowersCount: intPtr(100),
		FollowsCount:   intPtr(50),
		PostsCount:     intPtr(200),
		CreatedAt:      strPtr("2023-01-01T00:00:00Z"),
	}
}

// makePostView builds a minimal valid post view for tests.
func makePostView(handle, did, rkey, text string, opts ...func(*appbsky.FeedDefs_PostView)) *appbsky.FeedDefs_PostView {
	uri := "at://" + did + "/app.bsky.feed.post/" + rkey
	pv := &appbsky.FeedDefs_PostView{
		Uri:         uri,
		Cid:         "bafy-test",
		IndexedAt:   "2024-01-02T03:04:05Z",
		LikeCount:   intPtr(7),
		ReplyCount:  intPtr(3),
		RepostCount: intPtr(2),
		QuoteCount:  intPtr(1),
		Author: &appbsky.ActorDefs_ProfileViewBasic{
			Did:         did,
			Handle:      handle,
			DisplayName: strPtr("Test User"),
		},
		Record: &lexutil.LexiconTypeDecoder{
			Val: &appbsky.FeedPost{
				Text:      text,
				CreatedAt: "2024-01-02T03:04:05Z",
			},
		},
	}
	for _, opt := range opts {
		opt(pv)
	}
	return pv
}

// withImages adds a simple images embed.
func withImages(thumbs ...string) func(*appbsky.FeedDefs_PostView) {
	return func(pv *appbsky.FeedDefs_PostView) {
		var images []*appbsky.EmbedImages_ViewImage
		for _, t := range thumbs {
			images = append(images, &appbsky.EmbedImages_ViewImage{Thumb: t, Fullsize: t + "_full"})
		}
		pv.Embed = &appbsky.FeedDefs_PostView_Embed{
			EmbedImages_View: &appbsky.EmbedImages_View{Images: images},
		}
	}
}

// withVideo adds a video embed with a thumbnail.
func withVideo(thumb string) func(*appbsky.FeedDefs_PostView) {
	return func(pv *appbsky.FeedDefs_PostView) {
		pv.Embed = &appbsky.FeedDefs_PostView_Embed{
			EmbedVideo_View: &appbsky.EmbedVideo_View{Thumbnail: strPtr(thumb)},
		}
	}
}

// withExternalEmbed adds an external link embed.
func withExternalEmbed(uri, title string) func(*appbsky.FeedDefs_PostView) {
	return func(pv *appbsky.FeedDefs_PostView) {
		pv.Embed = &appbsky.FeedDefs_PostView_Embed{
			EmbedExternal_View: &appbsky.EmbedExternal_View{
				External: &appbsky.EmbedExternal_ViewExternal{Uri: uri, Title: title, Description: "desc"},
			},
		}
	}
}

// withQuotePost adds a record (quote-post) embed of the given target post.
func withQuotePost(qHandle, qDid, qRkey string) func(*appbsky.FeedDefs_PostView) {
	return func(pv *appbsky.FeedDefs_PostView) {
		pv.Embed = &appbsky.FeedDefs_PostView_Embed{
			EmbedRecord_View: &appbsky.EmbedRecord_View{
				Record: &appbsky.EmbedRecord_View_Record{
					EmbedRecord_ViewRecord: &appbsky.EmbedRecord_ViewRecord{
						Uri: "at://" + qDid + "/app.bsky.feed.post/" + qRkey,
						Cid: "bafy-quoted",
						Author: &appbsky.ActorDefs_ProfileViewBasic{
							Did:    qDid,
							Handle: qHandle,
						},
						IndexedAt: "2024-01-01T00:00:00Z",
					},
				},
			},
		}
	}
}

// withQuotePostBlocked adds a blocked-record embed (should NOT produce isBasedOn).
func withQuotePostBlocked() func(*appbsky.FeedDefs_PostView) {
	return func(pv *appbsky.FeedDefs_PostView) {
		pv.Embed = &appbsky.FeedDefs_PostView_Embed{
			EmbedRecord_View: &appbsky.EmbedRecord_View{
				Record: &appbsky.EmbedRecord_View_Record{
					EmbedRecord_ViewBlocked: &appbsky.EmbedRecord_ViewBlocked{
						Uri:     "at://did:plc:blocked/app.bsky.feed.post/x",
						Blocked: true,
					},
				},
			},
		}
	}
}

// withSelfLabel adds a self-label that should hide embeds.
func withSelfLabel(val string) func(*appbsky.FeedDefs_PostView) {
	return func(pv *appbsky.FeedDefs_PostView) {
		rec, _ := pv.Record.Val.(*appbsky.FeedPost)
		rec.Labels = &appbsky.FeedPost_Labels{
			LabelDefs_SelfLabels: &comatprototypes.LabelDefs_SelfLabels{
				Values: []*comatprototypes.LabelDefs_SelfLabel{{Val: val}},
			},
		}
	}
}

// withPostLabel adds a post-view label (as if applied by a labeler) with an
// optional negation flag.
func withPostLabel(val string, neg bool) func(*appbsky.FeedDefs_PostView) {
	return func(pv *appbsky.FeedDefs_PostView) {
		label := &comatprototypes.LabelDefs_Label{Val: val, Src: "did:plc:labeler"}
		if neg {
			n := true
			label.Neg = &n
		}
		pv.Labels = append(pv.Labels, label)
	}
}

// verifierSpec is a compact specifier for a verification entry in fixtures.
type verifierSpec struct {
	issuer, handle, displayName string
	isValid                     bool
}

// makeVerificationState builds a VerificationState from the supplied specs.
func makeVerificationState(specs ...verifierSpec) *appbsky.ActorDefs_VerificationState {
	state := &appbsky.ActorDefs_VerificationState{
		VerifiedStatus:        "valid",
		TrustedVerifierStatus: "none",
	}
	for _, s := range specs {
		v := &appbsky.ActorDefs_VerificationView{
			Issuer:    s.issuer,
			IsValid:   s.isValid,
			CreatedAt: "2024-01-01T00:00:00Z",
			Uri:       "at://" + s.issuer + "/app.bsky.graph.verification/" + s.issuer,
		}
		if s.handle != "" {
			h := s.handle
			v.IssuerHandle = &h
		}
		if s.displayName != "" {
			d := s.displayName
			v.IssuerDisplayName = &d
		}
		state.Verifications = append(state.Verifications, v)
	}
	return state
}

// withVerifications sets pv.Author.Verification.
func withVerifications(state *appbsky.ActorDefs_VerificationState) func(*appbsky.FeedDefs_PostView) {
	return func(pv *appbsky.FeedDefs_PostView) {
		if pv.Author == nil {
			return
		}
		pv.Author.Verification = state
	}
}

// unmarshalLD parses the JSON-LD blob produced by buildPostJSONLD.
func unmarshalLD(t *testing.T, s string) map[string]any {
	t.Helper()
	var out map[string]any
	if err := json.Unmarshal([]byte(s), &out); err != nil {
		t.Fatalf("invalid JSON-LD: %v\n%s", err, s)
	}
	return out
}

func TestBuildPostJSONLD_Bare(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "hello")
	canonical := "https://bsky.app/profile/alice.bsky.social/post/abc123"
	out, err := buildPostJSONLD(pv, nil, canonical, hideEmbedLabels, hideReplyLabels)
	if err != nil {
		t.Fatal(err)
	}
	envelope := unmarshalLD(t, out)
	if envelope["@context"] != "https://schema.org" {
		t.Errorf("@context wrong: %v", envelope["@context"])
	}
	if envelope["@type"] != "WebPage" {
		t.Errorf("@type should be WebPage, got %v", envelope["@type"])
	}
	if envelope["url"] != canonical {
		t.Errorf("url should be canonical, got %v", envelope["url"])
	}
	main, ok := envelope["mainEntity"].(map[string]any)
	if !ok {
		t.Fatalf("mainEntity missing")
	}
	if main["@type"] != "DiscussionForumPosting" {
		t.Errorf("mainEntity @type wrong: %v", main["@type"])
	}
	// nested entity should NOT have @context (Google's preferred shape).
	if _, present := main["@context"]; present {
		t.Errorf("nested mainEntity should not have @context")
	}
	if main["url"] != canonical {
		t.Errorf("post url wrong: %v", main["url"])
	}
	if main["identifier"] != pv.Uri {
		t.Errorf("identifier should be at-uri: %v", main["identifier"])
	}
	if main["text"] != "hello" {
		t.Errorf("text wrong: %v", main["text"])
	}
	if main["datePublished"] != "2024-01-02T03:04:05Z" {
		t.Errorf("datePublished wrong: %v", main["datePublished"])
	}
	// commentCount should always be emitted, even at zero.
	cc, ok := main["commentCount"].(float64)
	if !ok || int64(cc) != 3 {
		t.Errorf("commentCount wrong: %v", main["commentCount"])
	}
	// Author identifier should be the author's DID so a handle change
	// doesn't break identity.
	bareAuthor, _ := main["author"].(map[string]any)
	if bareAuthor == nil {
		t.Fatalf("author missing")
	}
	if bareAuthor["identifier"] != "did:plc:alice" {
		t.Errorf("author identifier should be DID, got %v", bareAuthor["identifier"])
	}
	// no images on bare post
	if _, present := main["image"]; present {
		t.Errorf("bare post should not have image")
	}
	if _, present := main["thumbnailUrl"]; present {
		t.Errorf("bare post should not have thumbnailUrl")
	}
	if _, present := main["isBasedOn"]; present {
		t.Errorf("bare post should not have isBasedOn")
	}
	if _, present := main["sharedContent"]; present {
		t.Errorf("bare post should not have sharedContent")
	}
}

func TestBuildPostJSONLD_WithImages(t *testing.T) {
	thumb1 := "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:alice/abc@jpeg"
	thumb2 := "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:alice/def@jpeg"
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "look", withImages(thumb1, thumb2))
	out, err := buildPostJSONLD(pv, nil, "https://bsky.app/profile/alice.bsky.social/post/abc123", hideEmbedLabels, hideReplyLabels)
	if err != nil {
		t.Fatal(err)
	}
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	imgs, ok := main["image"].([]any)
	if !ok {
		t.Fatalf("image should be array, got %T", main["image"])
	}
	if len(imgs) != 2 {
		t.Errorf("expected 2 images, got %d", len(imgs))
	}
	if imgs[0] != thumb1 {
		t.Errorf("image[0] should equal first thumb, got %v", imgs[0])
	}
	if main["thumbnailUrl"] != thumb1 {
		t.Errorf("thumbnailUrl should equal image[0] (Google byte-equality requirement), got %v", main["thumbnailUrl"])
	}
}

func TestBuildPostJSONLD_WithVideo(t *testing.T) {
	thumb := "https://cdn.bsky.app/img/video_thumbnail/plain/did:plc:alice/v@jpeg"
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "watch", withVideo(thumb))
	out, _ := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	if main["thumbnailUrl"] != thumb {
		t.Errorf("video thumbnailUrl wrong: %v", main["thumbnailUrl"])
	}
	imgs := main["image"].([]any)
	if len(imgs) != 1 || imgs[0] != thumb {
		t.Errorf("image[0] should be video thumb, got %v", imgs)
	}
}

func TestBuildPostJSONLD_QuotePost(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "quoting!", withQuotePost("bob.example.com", "did:plc:bob", "xyz"))
	out, _ := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	if main["isBasedOn"] != "https://bsky.app/profile/bob.example.com/post/xyz" {
		t.Errorf("isBasedOn wrong: %v", main["isBasedOn"])
	}
}

func TestBuildPostJSONLD_QuoteBlocked(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "quoting blocked", withQuotePostBlocked())
	out, _ := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	if _, present := main["isBasedOn"]; present {
		t.Errorf("blocked quote should not produce isBasedOn")
	}
}

func TestBuildPostJSONLD_ExternalEmbed(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "check this out", withExternalEmbed("https://www.spiegel.de/article", "Title"))
	out, _ := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	sc, ok := main["sharedContent"].(map[string]any)
	if !ok {
		t.Fatalf("sharedContent missing")
	}
	if sc["@type"] != "WebPage" {
		t.Errorf("sharedContent type wrong: %v", sc["@type"])
	}
	if sc["url"] != "https://www.spiegel.de/article" {
		t.Errorf("sharedContent url wrong: %v", sc["url"])
	}
}

func TestBuildPostJSONLD_HiddenEmbed(t *testing.T) {
	thumb := "https://cdn.bsky.app/img/x@jpeg"
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "nsfw",
		withImages(thumb), withSelfLabel("porn"))
	out, _ := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	if _, present := main["image"]; present {
		t.Errorf("hidden-embed post should not emit image")
	}
	if _, present := main["thumbnailUrl"]; present {
		t.Errorf("hidden-embed post should not emit thumbnailUrl")
	}
}

func TestBuildPostJSONLD_TextEscaping(t *testing.T) {
	// Includes ", \, newline, </script>, and a unicode char.
	tricky := "hello \"world\" \\ <\\>\n</script> 🎉"
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", tricky)
	out, err := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels)
	if err != nil {
		t.Fatal(err)
	}
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	if main["text"] != tricky {
		t.Errorf("text round-trip failed: got %q want %q", main["text"], tricky)
	}
	// Literal </script> would break out of the script tag.
	if strings.Contains(out, "</script>") {
		t.Errorf("output contains literal </script>, would break HTML embedding")
	}
}

func TestBuildPostJSONLD_Comments(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "main")
	*pv.ReplyCount = 14

	// 12 valid replies + 1 not-found + 1 blocked. Cap is maxComments=10.
	const validReplies = 12
	var replies []*appbsky.FeedDefs_ThreadViewPost_Replies_Elem
	for i := 0; i < validReplies; i++ {
		rkey := fmt.Sprintf("reply%02d", i)
		reply := makePostView(fmt.Sprintf("rep%02d.bsky.social", i),
			fmt.Sprintf("did:plc:rep%02d", i), rkey, "reply text")
		replies = append(replies, &appbsky.FeedDefs_ThreadViewPost_Replies_Elem{
			FeedDefs_ThreadViewPost: &appbsky.FeedDefs_ThreadViewPost{Post: reply},
		})
	}
	replies = append(replies, &appbsky.FeedDefs_ThreadViewPost_Replies_Elem{
		FeedDefs_NotFoundPost: &appbsky.FeedDefs_NotFoundPost{Uri: "at://x/y/z"},
	})
	replies = append(replies, &appbsky.FeedDefs_ThreadViewPost_Replies_Elem{
		FeedDefs_BlockedPost: &appbsky.FeedDefs_BlockedPost{Uri: "at://x/y/z"},
	})

	out, _ := buildPostJSONLD(pv, replies, "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)

	if cc := main["commentCount"].(float64); int64(cc) != 14 {
		t.Errorf("commentCount should reflect ReplyCount, got %v", cc)
	}
	comments, ok := main["comment"].([]any)
	if !ok {
		t.Fatalf("comment array missing")
	}
	if len(comments) != maxComments {
		t.Errorf("expected %d comments (capped from %d valid), got %d", maxComments, validReplies, len(comments))
	}
	// FIFO order: first valid reply, not the not-found at the end.
	first := comments[0].(map[string]any)
	if first["identifier"] != "at://did:plc:rep00/app.bsky.feed.post/reply00" {
		t.Errorf("first comment should be reply00, got %v", first["identifier"])
	}
	// Comment type, no nested comment[] / isBasedOn / sharedContent.
	for i, c := range comments {
		cm := c.(map[string]any)
		if cm["@type"] != "Comment" {
			t.Errorf("reply %d wrong type: got %v, want Comment", i, cm["@type"])
		}
		if _, present := cm["comment"]; present {
			t.Errorf("reply %d should not have nested comment[]", i)
		}
		if _, present := cm["isBasedOn"]; present {
			t.Errorf("reply %d should not have isBasedOn", i)
		}
		if _, present := cm["sharedContent"]; present {
			t.Errorf("reply %d should not have sharedContent", i)
		}
		if cm["url"] == nil || cm["identifier"] == nil {
			t.Errorf("reply %d missing url/identifier", i)
		}
	}
}

func TestBuildPostJSONLD_HandleInvalidAuthor(t *testing.T) {
	pv := makePostView("handle.invalid", "did:plc:alice", "abc123", "hello")
	fallback := "https://bsky.app/profile/did:plc:alice/post/abc123"
	out, _ := buildPostJSONLD(pv, nil, fallback, hideEmbedLabels, hideReplyLabels)
	envelope := unmarshalLD(t, out)
	main := envelope["mainEntity"].(map[string]any)
	// mainEntity.url falls back to the caller's canonical URL so envelope
	// and post URLs always agree.
	if main["url"] != fallback {
		t.Errorf("mainEntity.url should fall back to canonical URL, got %v", main["url"])
	}
	if envelope["url"] != fallback {
		t.Errorf("envelope.url should equal canonical URL, got %v", envelope["url"])
	}
	if main["url"] != envelope["url"] {
		t.Errorf("envelope.url and mainEntity.url disagree: %v vs %v",
			envelope["url"], main["url"])
	}
	// identifier (AT-URI) stays stable across handle changes.
	if main["identifier"] != pv.Uri {
		t.Errorf("identifier should still be the AT-URI, got %v", main["identifier"])
	}
	// Author URL omitted (no usable handle).
	author := main["author"].(map[string]any)
	if _, present := author["url"]; present {
		t.Errorf("handle.invalid author should not produce author.url")
	}
}

// envelope.url and mainEntity.url must always agree.
func TestBuildPostJSONLD_EnvelopeURLMatchesMainEntity(t *testing.T) {
	cases := []struct {
		name, handle, did, rkey, canonical string
	}{
		{
			name:      "handle form",
			handle:    "alice.bsky.social",
			did:       "did:plc:alice",
			rkey:      "abc",
			canonical: "https://bsky.app/profile/alice.bsky.social/post/abc",
		},
		{
			name:      "handle.invalid falls back to canonical",
			handle:    "handle.invalid",
			did:       "did:plc:alice",
			rkey:      "abc",
			canonical: "https://bsky.app/profile/did:plc:alice/post/abc",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			pv := makePostView(tc.handle, tc.did, tc.rkey, "hi")
			out, _ := buildPostJSONLD(pv, nil, tc.canonical, hideEmbedLabels, hideReplyLabels)
			env := unmarshalLD(t, out)
			main := env["mainEntity"].(map[string]any)
			if env["url"] != tc.canonical {
				t.Errorf("envelope.url = %v, want %v", env["url"], tc.canonical)
			}
			if main["url"] != tc.canonical {
				t.Errorf("mainEntity.url = %v, want %v", main["url"], tc.canonical)
			}
		})
	}
}

func TestBuildPostJSONLD_NilAuthor(t *testing.T) {
	// Defensive: don't panic if Author is nil.
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "hi")
	pv.Author = nil
	if _, err := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels); err == nil {
		t.Errorf("expected error for nil-author post, got nil")
	}
}

func TestBuildPostJSONLD_NilAuthorReply(t *testing.T) {
	// Reply with nil Author should be dropped, not emitted with empty @type.
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "main")
	*pv.ReplyCount = 2

	goodReply := makePostView("bob.bsky.social", "did:plc:bob", "rep1", "good")
	badReply := makePostView("eve.bsky.social", "did:plc:eve", "rep2", "bad")
	badReply.Author = nil

	replies := []*appbsky.FeedDefs_ThreadViewPost_Replies_Elem{
		{FeedDefs_ThreadViewPost: &appbsky.FeedDefs_ThreadViewPost{Post: goodReply}},
		{FeedDefs_ThreadViewPost: &appbsky.FeedDefs_ThreadViewPost{Post: badReply}},
	}
	out, err := buildPostJSONLD(pv, replies, "u", hideEmbedLabels, hideReplyLabels)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	comments, _ := main["comment"].([]any)
	if len(comments) != 1 {
		t.Errorf("expected 1 comment (nil-Author dropped), got %d", len(comments))
	}
}

func TestBuildPostJSONLD_CommentMedia(t *testing.T) {
	// Comments with media embeds should expose image[] and thumbnailUrl.
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "main")
	*pv.ReplyCount = 1
	thumb := "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:bob/x@jpg"
	reply := makePostView("bob.bsky.social", "did:plc:bob", "rep1", "with image",
		withImages(thumb))
	replies := []*appbsky.FeedDefs_ThreadViewPost_Replies_Elem{
		{FeedDefs_ThreadViewPost: &appbsky.FeedDefs_ThreadViewPost{Post: reply}},
	}
	out, _ := buildPostJSONLD(pv, replies, "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	c := main["comment"].([]any)[0].(map[string]any)
	imgs, ok := c["image"].([]any)
	if !ok || len(imgs) != 1 || imgs[0] != thumb {
		t.Errorf("comment image[] wrong: %v", c["image"])
	}
	if c["thumbnailUrl"] != thumb {
		t.Errorf("comment thumbnailUrl wrong: %v", c["thumbnailUrl"])
	}
}

func TestBuildProfileJSONLD_Basic(t *testing.T) {
	pv := &appbsky.ActorDefs_ProfileViewDetailed{
		Did:            "did:plc:alice",
		Handle:         "alice.bsky.social",
		DisplayName:    strPtr("Alice"),
		Description:    strPtr("just a person"),
		Avatar:         strPtr("https://cdn.bsky.app/img/avatar/plain/a@jpeg"),
		FollowersCount: intPtr(100),
		FollowsCount:   intPtr(50),
		PostsCount:     intPtr(200),
		CreatedAt:      strPtr("2023-01-01T00:00:00Z"),
	}
	out, err := buildProfileJSONLD(pv, nil, hideEmbedLabels, hideReplyLabels)
	if err != nil {
		t.Fatal(err)
	}
	page := unmarshalLD(t, out)
	if page["@context"] != "https://schema.org" {
		t.Errorf("@context wrong")
	}
	if page["@type"] != "ProfilePage" {
		t.Errorf("@type wrong: %v", page["@type"])
	}
	main := page["mainEntity"].(map[string]any)
	if main["@type"] != "Person" {
		t.Errorf("mainEntity @type wrong: %v", main["@type"])
	}
	if main["name"] != "Alice" {
		t.Errorf("name wrong: %v", main["name"])
	}
	if main["alternateName"] != "@alice.bsky.social" {
		t.Errorf("alternateName wrong: %v", main["alternateName"])
	}
	if main["identifier"] != "did:plc:alice" {
		t.Errorf("identifier wrong: %v", main["identifier"])
	}
	if _, present := page["hasPart"]; present {
		t.Errorf("empty recentPosts should not produce hasPart")
	}
}

func TestBuildProfileJSONLD_HasPart(t *testing.T) {
	pv := &appbsky.ActorDefs_ProfileViewDetailed{
		Did: "did:plc:alice", Handle: "alice.bsky.social",
		DisplayName: strPtr("Alice"),
		CreatedAt:   strPtr("2023-01-01T00:00:00Z"),
	}
	var posts []*appbsky.FeedDefs_PostView
	for i := 0; i < 12; i++ {
		posts = append(posts, makePostView("alice.bsky.social", "did:plc:alice",
			"r"+string(rune('0'+i)), "post"))
	}
	out, _ := buildProfileJSONLD(pv, posts, hideEmbedLabels, hideReplyLabels)
	page := unmarshalLD(t, out)
	hp, ok := page["hasPart"].([]any)
	if !ok {
		t.Fatalf("hasPart missing")
	}
	if len(hp) != maxRecentPosts {
		t.Errorf("hasPart should be capped at %d, got %d", maxRecentPosts, len(hp))
	}
	first := hp[0].(map[string]any)
	if first["@type"] != "DiscussionForumPosting" {
		t.Errorf("hasPart entries should be DiscussionForumPosting, got %v", first["@type"])
	}
	if _, present := first["@context"]; present {
		t.Errorf("nested hasPart entries should not have @context")
	}
}

func TestBuildProfileJSONLD_HasPartLabelFiltered(t *testing.T) {
	// Recent posts carrying hideReplyLabels or hideEmbedLabels are dropped
	// from hasPart entirely. Negation is honored on post-view labels.
	pv := &appbsky.ActorDefs_ProfileViewDetailed{
		Did: "did:plc:alice", Handle: "alice.bsky.social",
		DisplayName: strPtr("Alice"),
		CreatedAt:   strPtr("2023-01-01T00:00:00Z"),
	}
	good := makePostView("alice.bsky.social", "did:plc:alice", "good", "ok")
	hidden := makePostView("alice.bsky.social", "did:plc:alice", "hide", "hidden",
		withPostLabel("!hide", false))
	spam := makePostView("alice.bsky.social", "did:plc:alice", "spam", "spam",
		withSelfLabel("spam"))
	embedHide := makePostView("alice.bsky.social", "did:plc:alice", "harm", "embed-only",
		withPostLabel("self-harm", false))
	negated := makePostView("alice.bsky.social", "did:plc:alice", "neg", "negated",
		withPostLabel("!hide", true))

	out, _ := buildProfileJSONLD(pv, []*appbsky.FeedDefs_PostView{
		good, hidden, spam, embedHide, negated,
	}, hideEmbedLabels, hideReplyLabels)
	page := unmarshalLD(t, out)
	hp, _ := page["hasPart"].([]any)

	got := make(map[string]bool, len(hp))
	for _, e := range hp {
		got[e.(map[string]any)["identifier"].(string)] = true
	}
	if !got[good.Uri] {
		t.Errorf("expected unlabeled post in hasPart")
	}
	if !got[negated.Uri] {
		t.Errorf("negated hide label should not gate; expected post in hasPart")
	}
	if got[hidden.Uri] {
		t.Errorf("post with !hide label should be dropped from hasPart")
	}
	if got[spam.Uri] {
		t.Errorf("self-labeled spam post should be dropped from hasPart")
	}
	if got[embedHide.Uri] {
		t.Errorf("post with hideEmbedLabels label should be dropped from hasPart")
	}
}

func TestBskyPostURL(t *testing.T) {
	tests := []struct {
		name, handle, rkey, want string
	}{
		{"valid", "alice.bsky.social", "abc", "https://bsky.app/profile/alice.bsky.social/post/abc"},
		{"empty handle", "", "abc", ""},
		{"handle.invalid", "handle.invalid", "abc", ""},
		{"empty rkey", "alice.bsky.social", "", ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := bskyPostURL(tt.handle, tt.rkey); got != tt.want {
				t.Errorf("got %q, want %q", got, tt.want)
			}
		})
	}
}

func TestBskyPostURLFromATURI(t *testing.T) {
	tests := []struct {
		name, handle, atURI, want string
	}{
		{"valid", "alice.bsky.social", "at://did:plc:alice/app.bsky.feed.post/abc", "https://bsky.app/profile/alice.bsky.social/post/abc"},
		{"empty handle", "", "at://did:plc:alice/app.bsky.feed.post/abc", ""},
		{"handle.invalid", "handle.invalid", "at://did:plc:alice/app.bsky.feed.post/abc", ""},
		{"bad uri", "alice.bsky.social", "not-an-aturi", ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := bskyPostURLFromATURI(tt.handle, tt.atURI); got != tt.want {
				t.Errorf("got %q, want %q", got, tt.want)
			}
		})
	}
}

func TestBskyProfileURL(t *testing.T) {
	if bskyProfileURL("alice.bsky.social") != "https://bsky.app/profile/alice.bsky.social" {
		t.Errorf("valid handle wrong")
	}
	if bskyProfileURL("handle.invalid") != "" {
		t.Errorf("handle.invalid should produce empty")
	}
	if bskyProfileURL("") != "" {
		t.Errorf("empty handle should produce empty")
	}
}

// buildReplies wraps a slice of post views into ThreadViewPost reply elements.
func buildReplies(posts ...*appbsky.FeedDefs_PostView) []*appbsky.FeedDefs_ThreadViewPost_Replies_Elem {
	out := make([]*appbsky.FeedDefs_ThreadViewPost_Replies_Elem, 0, len(posts))
	for _, p := range posts {
		out = append(out, &appbsky.FeedDefs_ThreadViewPost_Replies_Elem{
			FeedDefs_ThreadViewPost: &appbsky.FeedDefs_ThreadViewPost{Post: p},
		})
	}
	return out
}

// commentIdentifiers extracts the identifier of each entry in mainEntity.comment.
func commentIdentifiers(t *testing.T, out string) []string {
	t.Helper()
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	raw, _ := main["comment"].([]any)
	ids := make([]string, 0, len(raw))
	for _, c := range raw {
		cm := c.(map[string]any)
		if id, ok := cm["identifier"].(string); ok {
			ids = append(ids, id)
		}
	}
	return ids
}

func TestBuildPostJSONLD_HiddenReplyDropped_PostViewLabel(t *testing.T) {
	// A reply carrying a hideReplyLabels post-view label is dropped from comment[].
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "main")
	good := makePostView("bob.bsky.social", "did:plc:bob", "rep1", "good reply")
	bad := makePostView("eve.bsky.social", "did:plc:eve", "rep2", "spam reply",
		withPostLabel("!hide", false))
	out, _ := buildPostJSONLD(pv, buildReplies(good, bad), "u", hideEmbedLabels, hideReplyLabels)
	ids := commentIdentifiers(t, out)
	if len(ids) != 1 || ids[0] != good.Uri {
		t.Errorf("expected only the unlabeled reply to remain, got %v", ids)
	}
}

func TestBuildPostJSONLD_HiddenReplyDropped_SelfLabel(t *testing.T) {
	// A reply self-labeling itself with a hideReplyLabels value is dropped.
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "main")
	good := makePostView("bob.bsky.social", "did:plc:bob", "rep1", "good reply")
	bad := makePostView("eve.bsky.social", "did:plc:eve", "rep2", "spam reply",
		withSelfLabel("spam"))
	out, _ := buildPostJSONLD(pv, buildReplies(good, bad), "u", hideEmbedLabels, hideReplyLabels)
	ids := commentIdentifiers(t, out)
	if len(ids) != 1 || ids[0] != good.Uri {
		t.Errorf("expected self-labeled reply dropped, got %v", ids)
	}
}

func TestBuildPostJSONLD_HiddenReplyDropped_EmbedLabel(t *testing.T) {
	// A reply with a hideEmbedLabels label (e.g., porn) is also dropped.
	// hideEmbedLabels is consulted in addition to hideReplyLabels for replies.
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "main")
	good := makePostView("bob.bsky.social", "did:plc:bob", "rep1", "good reply")
	// "self-harm" is in hideEmbedLabels but not hideReplyLabels — verifies the
	// union behavior.
	bad := makePostView("eve.bsky.social", "did:plc:eve", "rep2", "concerning reply",
		withPostLabel("self-harm", false))
	out, _ := buildPostJSONLD(pv, buildReplies(good, bad), "u", hideEmbedLabels, hideReplyLabels)
	ids := commentIdentifiers(t, out)
	if len(ids) != 1 || ids[0] != good.Uri {
		t.Errorf("expected embed-labeled reply dropped, got %v", ids)
	}
}

func TestBuildPostJSONLD_NegatedHideLabelKept(t *testing.T) {
	// A negated post-view label should not gate the reply.
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "main")
	reply := makePostView("bob.bsky.social", "did:plc:bob", "rep1", "fine reply",
		withPostLabel("!hide", true))
	out, _ := buildPostJSONLD(pv, buildReplies(reply), "u", hideEmbedLabels, hideReplyLabels)
	ids := commentIdentifiers(t, out)
	if len(ids) != 1 || ids[0] != reply.Uri {
		t.Errorf("expected negated-label reply to be kept, got %v", ids)
	}
}

func TestBuildPostJSONLD_ReplyAuthorHasIdentifier(t *testing.T) {
	// Reply author should also carry a DID identifier.
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "main")
	reply := makePostView("bob.bsky.social", "did:plc:bob", "rep1", "hi")
	out, _ := buildPostJSONLD(pv, buildReplies(reply), "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	c := main["comment"].([]any)[0].(map[string]any)
	auth, ok := c["author"].(map[string]any)
	if !ok {
		t.Fatalf("comment author missing")
	}
	if auth["identifier"] != "did:plc:bob" {
		t.Errorf("reply author identifier should be DID, got %v", auth["identifier"])
	}
}

func TestBuildReviewedBy_NilAndEmpty(t *testing.T) {
	if got := buildReviewedBy(nil); got != nil {
		t.Errorf("nil state should yield nil, got %v", got)
	}
	empty := &appbsky.ActorDefs_VerificationState{}
	if got := buildReviewedBy(empty); got != nil {
		t.Errorf("empty Verifications should yield nil, got %v", got)
	}
	allInvalid := makeVerificationState(
		verifierSpec{issuer: "did:plc:v1", handle: "v1.example.com", displayName: "V One", isValid: false},
		verifierSpec{issuer: "did:plc:v2", handle: "v2.example.com", displayName: "V Two", isValid: false},
	)
	if got := buildReviewedBy(allInvalid); got != nil {
		t.Errorf("all-invalid state should yield nil, got %v", got)
	}
}

func TestBuildReviewedBy_FiltersInvalid(t *testing.T) {
	state := makeVerificationState(
		verifierSpec{issuer: "did:plc:v1", handle: "v1.example.com", displayName: "V One", isValid: true},
		verifierSpec{issuer: "did:plc:v2", handle: "v2.example.com", displayName: "V Two", isValid: false},
		verifierSpec{issuer: "did:plc:v3", handle: "v3.example.com", displayName: "V Three", isValid: true},
		verifierSpec{issuer: "", handle: "noid.example.com", displayName: "No Issuer", isValid: true},
	)
	got := buildReviewedBy(state)
	if len(got) != 2 {
		t.Fatalf("expected 2 valid verifiers, got %d: %v", len(got), got)
	}
	if got[0].Identifier != "did:plc:v1" {
		t.Errorf("FIFO order broken; first identifier = %q", got[0].Identifier)
	}
	if got[1].Identifier != "did:plc:v3" {
		t.Errorf("expected v3 at index 1, got %q", got[1].Identifier)
	}
}

func TestBuildReviewedBy_NameFallbacks(t *testing.T) {
	cases := []struct {
		name                                              string
		spec                                              verifierSpec
		wantName, wantAlternateName, wantURL, wantIdentif string
	}{
		{
			name:              "DisplayName + handle",
			spec:              verifierSpec{issuer: "did:plc:v1", handle: "alice.example.com", displayName: "Alice Verifier", isValid: true},
			wantName:          "Alice Verifier",
			wantAlternateName: "@alice.example.com",
			wantURL:           "https://bsky.app/profile/alice.example.com",
			wantIdentif:       "did:plc:v1",
		},
		{
			name:              "handle only",
			spec:              verifierSpec{issuer: "did:plc:v2", handle: "bob.example.com", isValid: true},
			wantName:          "@bob.example.com",
			wantAlternateName: "",
			wantURL:           "https://bsky.app/profile/bob.example.com",
			wantIdentif:       "did:plc:v2",
		},
		{
			name:              "DisplayName only (no handle)",
			spec:              verifierSpec{issuer: "did:plc:v3", displayName: "Carol Verifier", isValid: true},
			wantName:          "Carol Verifier",
			wantAlternateName: "",
			wantURL:           "https://bsky.app/profile/did:plc:v3",
			wantIdentif:       "did:plc:v3",
		},
		{
			name:              "DisplayName + handle.invalid",
			spec:              verifierSpec{issuer: "did:plc:v4", handle: "handle.invalid", displayName: "Dave Verifier", isValid: true},
			wantName:          "Dave Verifier",
			wantAlternateName: "",
			wantURL:           "https://bsky.app/profile/did:plc:v4",
			wantIdentif:       "did:plc:v4",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := buildReviewedBy(makeVerificationState(tc.spec))
			if len(got) != 1 {
				t.Fatalf("expected 1 entry, got %d", len(got))
			}
			v := got[0]
			if v.Type != "Person" {
				t.Errorf("@type = %q, want Person", v.Type)
			}
			if v.Name != tc.wantName {
				t.Errorf("name = %q, want %q", v.Name, tc.wantName)
			}
			if v.AlternateName != tc.wantAlternateName {
				t.Errorf("alternateName = %q, want %q", v.AlternateName, tc.wantAlternateName)
			}
			if v.URL != tc.wantURL {
				t.Errorf("url = %q, want %q", v.URL, tc.wantURL)
			}
			if v.Identifier != tc.wantIdentif {
				t.Errorf("identifier = %q, want %q", v.Identifier, tc.wantIdentif)
			}
		})
	}
}

func TestBuildReviewedBy_Cap(t *testing.T) {
	specs := make([]verifierSpec, 0, 12)
	for i := 0; i < 12; i++ {
		specs = append(specs, verifierSpec{
			issuer:      fmt.Sprintf("did:plc:v%02d", i),
			handle:      fmt.Sprintf("v%02d.example.com", i),
			displayName: fmt.Sprintf("V%02d", i),
			isValid:     true,
		})
	}
	got := buildReviewedBy(makeVerificationState(specs...))
	if len(got) != maxReviewedBy {
		t.Errorf("expected cap at %d, got %d", maxReviewedBy, len(got))
	}
	if got[0].Identifier != "did:plc:v00" {
		t.Errorf("first kept entry should be v00, got %q", got[0].Identifier)
	}
}

func TestBuildPostJSONLD_AuthorReviewedBy(t *testing.T) {
	state := makeVerificationState(verifierSpec{
		issuer:      "did:plc:verifier1",
		handle:      "verifier.example.com",
		displayName: "Trusted Verifier",
		isValid:     true,
	})
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "hi",
		withVerifications(state))
	out, err := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels)
	if err != nil {
		t.Fatal(err)
	}
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	auth := main["author"].(map[string]any)
	rb, ok := auth["reviewedBy"].([]any)
	if !ok {
		t.Fatalf("post author should have reviewedBy, got %v", auth["reviewedBy"])
	}
	if len(rb) != 1 {
		t.Fatalf("expected 1 verifier, got %d", len(rb))
	}
	v := rb[0].(map[string]any)
	if v["@type"] != "Person" {
		t.Errorf("verifier @type = %v, want Person", v["@type"])
	}
	if v["name"] != "Trusted Verifier" {
		t.Errorf("verifier name = %v", v["name"])
	}
	if v["identifier"] != "did:plc:verifier1" {
		t.Errorf("verifier identifier = %v", v["identifier"])
	}
	if v["url"] != "https://bsky.app/profile/verifier.example.com" {
		t.Errorf("verifier url = %v", v["url"])
	}
}

func TestBuildPostJSONLD_ReplyAuthorNoReviewedBy(t *testing.T) {
	// Replies do not surface verifications even when the reply author
	// carries Verification.
	state := makeVerificationState(verifierSpec{
		issuer:      "did:plc:verifier1",
		handle:      "verifier.example.com",
		displayName: "Trusted Verifier",
		isValid:     true,
	})
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "main")
	reply := makePostView("bob.bsky.social", "did:plc:bob", "rep1", "hi",
		withVerifications(state))
	out, _ := buildPostJSONLD(pv, buildReplies(reply), "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	c := main["comment"].([]any)[0].(map[string]any)
	auth := c["author"].(map[string]any)
	if _, present := auth["reviewedBy"]; present {
		t.Errorf("reply author must not carry reviewedBy, got %v", auth["reviewedBy"])
	}
}

func TestBuildProfileJSONLD_MainEntityReviewedBy(t *testing.T) {
	pv := newProfileViewDetailed()
	pv.Verification = makeVerificationState(verifierSpec{
		issuer:      "did:plc:verifier1",
		handle:      "verifier.example.com",
		displayName: "Trusted Verifier",
		isValid:     true,
	})
	out, err := buildProfileJSONLD(pv, nil, hideEmbedLabels, hideReplyLabels)
	if err != nil {
		t.Fatal(err)
	}
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	rb, ok := main["reviewedBy"].([]any)
	if !ok {
		t.Fatalf("profile mainEntity should have reviewedBy, got %v", main["reviewedBy"])
	}
	v := rb[0].(map[string]any)
	if v["identifier"] != "did:plc:verifier1" {
		t.Errorf("verifier identifier = %v", v["identifier"])
	}
	if v["url"] != "https://bsky.app/profile/verifier.example.com" {
		t.Errorf("verifier url = %v", v["url"])
	}
}

func TestBuildProfileJSONLD_HasPartAuthorReviewedBy(t *testing.T) {
	// Recent posts inherit verifications via their post-view Author.
	pv := newProfileViewDetailed()
	state := makeVerificationState(verifierSpec{
		issuer:      "did:plc:verifier1",
		handle:      "verifier.example.com",
		displayName: "Trusted Verifier",
		isValid:     true,
	})
	post := makePostView("alice.bsky.social", "did:plc:alice", "rp1", "hi",
		withVerifications(state))
	out, _ := buildProfileJSONLD(pv, []*appbsky.FeedDefs_PostView{post}, hideEmbedLabels, hideReplyLabels)
	page := unmarshalLD(t, out)
	hp := page["hasPart"].([]any)
	if len(hp) != 1 {
		t.Fatalf("expected 1 hasPart entry, got %d", len(hp))
	}
	auth := hp[0].(map[string]any)["author"].(map[string]any)
	rb, ok := auth["reviewedBy"].([]any)
	if !ok || len(rb) != 1 {
		t.Fatalf("hasPart author should carry reviewedBy, got %v", auth["reviewedBy"])
	}
	if rb[0].(map[string]any)["identifier"] != "did:plc:verifier1" {
		t.Errorf("verifier identifier wrong: %v", rb[0])
	}
}

// videoEmbedOpts configures withVideoFull. Zero values mean "not set".
type videoEmbedOpts struct {
	thumbnail   string
	playlist    string
	alt         string
	width       int64
	height      int64
	hasAspect   bool
	recordMedia bool // nest under EmbedRecordWithMedia_View.Media
}

// withVideoFull installs a fully-specified video embed for VideoObject tests.
func withVideoFull(o videoEmbedOpts) func(*appbsky.FeedDefs_PostView) {
	return func(pv *appbsky.FeedDefs_PostView) {
		v := &appbsky.EmbedVideo_View{Playlist: o.playlist}
		if o.thumbnail != "" {
			v.Thumbnail = strPtr(o.thumbnail)
		}
		if o.alt != "" {
			v.Alt = strPtr(o.alt)
		}
		if o.hasAspect {
			v.AspectRatio = &appbsky.EmbedDefs_AspectRatio{Width: o.width, Height: o.height}
		}
		if o.recordMedia {
			pv.Embed = &appbsky.FeedDefs_PostView_Embed{
				EmbedRecordWithMedia_View: &appbsky.EmbedRecordWithMedia_View{
					Record: &appbsky.EmbedRecord_View{
						Record: &appbsky.EmbedRecord_View_Record{
							EmbedRecord_ViewRecord: &appbsky.EmbedRecord_ViewRecord{
								Uri: "at://did:plc:quoted/app.bsky.feed.post/q",
								Cid: "bafy-quoted",
								Author: &appbsky.ActorDefs_ProfileViewBasic{
									Did:    "did:plc:quoted",
									Handle: "quoted.bsky.social",
								},
								IndexedAt: "2024-01-01T00:00:00Z",
							},
						},
					},
					Media: &appbsky.EmbedRecordWithMedia_View_Media{
						EmbedVideo_View: v,
					},
				},
			}
		} else {
			pv.Embed = &appbsky.FeedDefs_PostView_Embed{
				EmbedVideo_View: v,
			}
		}
	}
}

func TestBuildPostJSONLD_WithVideoObject(t *testing.T) {
	thumb := "https://cdn.bsky.app/img/video_thumbnail/plain/did:plc:alice/v@jpeg"
	playlist := "https://video.bsky.app/v/did:plc:alice/v/playlist.m3u8"
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "watch this",
		withVideoFull(videoEmbedOpts{
			thumbnail: thumb, playlist: playlist, alt: "A trip to the park",
			hasAspect: true, width: 16, height: 9,
		}))
	canonical := "https://bsky.app/profile/alice.bsky.social/post/abc123"
	out, err := buildPostJSONLD(pv, nil, canonical, hideEmbedLabels, hideReplyLabels)
	if err != nil {
		t.Fatal(err)
	}
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	video, ok := main["video"].(map[string]any)
	if !ok {
		t.Fatalf("video missing from mainEntity")
	}
	if video["@type"] != "VideoObject" {
		t.Errorf("@type = %v, want VideoObject", video["@type"])
	}
	if video["name"] != "A trip to the park" {
		t.Errorf("name = %v, want alt text", video["name"])
	}
	if video["description"] != "watch this" {
		t.Errorf("description = %v, want post text", video["description"])
	}
	if video["thumbnailUrl"] != thumb {
		t.Errorf("thumbnailUrl = %v, want %v", video["thumbnailUrl"], thumb)
	}
	if video["uploadDate"] != pv.IndexedAt {
		t.Errorf("uploadDate = %v, want %v", video["uploadDate"], pv.IndexedAt)
	}
	if video["contentUrl"] != playlist {
		t.Errorf("contentUrl = %v, want %v", video["contentUrl"], playlist)
	}
	if video["embedUrl"] != canonical {
		t.Errorf("embedUrl = %v, want %v", video["embedUrl"], canonical)
	}
	if w, _ := video["width"].(float64); int64(w) != 16 {
		t.Errorf("width = %v, want 16", video["width"])
	}
	if h, _ := video["height"].(float64); int64(h) != 9 {
		t.Errorf("height = %v, want 9", video["height"])
	}
	// post thumbnailUrl should equal the video thumb (byte-equal og:image).
	if main["thumbnailUrl"] != thumb {
		t.Errorf("post thumbnailUrl = %v, want %v", main["thumbnailUrl"], thumb)
	}
}

func TestBuildPostJSONLD_VideoNameFallback(t *testing.T) {
	// No alt text -> "Video by @<handle>".
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "no alt here",
		withVideoFull(videoEmbedOpts{
			playlist: "https://video.bsky.app/p.m3u8",
		}))
	out, _ := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	video, ok := main["video"].(map[string]any)
	if !ok {
		t.Fatalf("video missing")
	}
	if video["name"] != "Video by @alice.bsky.social" {
		t.Errorf("name fallback = %v", video["name"])
	}
}

func TestBuildPostJSONLD_VideoNameFallbackHandleInvalid(t *testing.T) {
	// handle.invalid + no alt -> generic fallback.
	pv := makePostView("handle.invalid", "did:plc:alice", "abc123", "x",
		withVideoFull(videoEmbedOpts{
			playlist: "https://video.bsky.app/p.m3u8",
		}))
	out, _ := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	video := main["video"].(map[string]any)
	if video["name"] != "Video on Bluesky" {
		t.Errorf("name fallback = %v, want generic", video["name"])
	}
}

func TestBuildPostJSONLD_VideoDescriptionFallback(t *testing.T) {
	// Empty post text -> description falls back to name so Google's video
	// rich-result requirement (description present) is satisfied.
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "",
		withVideoFull(videoEmbedOpts{
			playlist: "https://video.bsky.app/p.m3u8", alt: "scenic clip",
		}))
	out, _ := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	video := main["video"].(map[string]any)
	if video["description"] != "scenic clip" {
		t.Errorf("description fallback = %v, want name", video["description"])
	}
}

func TestBuildPostJSONLD_VideoNoAspectRatio(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "x",
		withVideoFull(videoEmbedOpts{
			playlist: "https://video.bsky.app/p.m3u8", alt: "alt",
		}))
	out, _ := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	video := main["video"].(map[string]any)
	if _, present := video["width"]; present {
		t.Errorf("width should be omitted when AspectRatio missing")
	}
	if _, present := video["height"]; present {
		t.Errorf("height should be omitted when AspectRatio missing")
	}
}

func TestBuildPostJSONLD_VideoMissingPlaylist(t *testing.T) {
	// No playlist -> VideoObject suppressed; image[]/thumbnailUrl still set
	// from the video thumb (existing behavior).
	thumb := "https://cdn.bsky.app/img/video_thumbnail/plain/did:plc:alice/v@jpeg"
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "x",
		withVideo(thumb))
	out, _ := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	if _, present := main["video"]; present {
		t.Errorf("video without playlist should not produce VideoObject")
	}
	if main["thumbnailUrl"] != thumb {
		t.Errorf("thumbnailUrl should still be set from video thumb, got %v", main["thumbnailUrl"])
	}
}

func TestBuildPostJSONLD_VideoHiddenEmbed(t *testing.T) {
	// Self-labeled hide drops the video, parallel to the image-hide test.
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "nsfw",
		withVideoFull(videoEmbedOpts{
			thumbnail: "https://cdn.bsky.app/img/x@jpeg",
			playlist:  "https://video.bsky.app/p.m3u8",
			alt:       "should be dropped",
		}),
		withSelfLabel("porn"))
	out, _ := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	if _, present := main["video"]; present {
		t.Errorf("hidden-embed post should not emit video")
	}
}

func TestBuildPostJSONLD_VideoInRecordWithMedia(t *testing.T) {
	thumb := "https://cdn.bsky.app/img/video_thumbnail/plain/did:plc:alice/v@jpeg"
	playlist := "https://video.bsky.app/p.m3u8"
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "quote+video",
		withVideoFull(videoEmbedOpts{
			thumbnail: thumb, playlist: playlist, alt: "alt", recordMedia: true,
			hasAspect: true, width: 4, height: 3,
		}))
	out, _ := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	video, ok := main["video"].(map[string]any)
	if !ok {
		t.Fatalf("video missing on record-with-media post")
	}
	if video["contentUrl"] != playlist {
		t.Errorf("contentUrl = %v, want %v", video["contentUrl"], playlist)
	}
	if video["thumbnailUrl"] != thumb {
		t.Errorf("thumbnailUrl = %v, want %v", video["thumbnailUrl"], thumb)
	}
	// quote-post still surfaces via isBasedOn alongside the video.
	if main["isBasedOn"] != "https://bsky.app/profile/quoted.bsky.social/post/q" {
		t.Errorf("isBasedOn = %v", main["isBasedOn"])
	}
}

func TestBuildPostJSONLD_VideoOnReply(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "main")
	*pv.ReplyCount = 1
	thumb := "https://cdn.bsky.app/img/video_thumbnail/plain/did:plc:bob/v@jpeg"
	playlist := "https://video.bsky.app/bob.m3u8"
	reply := makePostView("bob.bsky.social", "did:plc:bob", "rep1", "watch",
		withVideoFull(videoEmbedOpts{
			thumbnail: thumb, playlist: playlist, alt: "bob's clip",
		}))
	out, _ := buildPostJSONLD(pv, buildReplies(reply), "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	c := main["comment"].([]any)[0].(map[string]any)
	video, ok := c["video"].(map[string]any)
	if !ok {
		t.Fatalf("reply video missing")
	}
	if video["@type"] != "VideoObject" {
		t.Errorf("reply video @type = %v", video["@type"])
	}
	if video["name"] != "bob's clip" {
		t.Errorf("reply video name = %v", video["name"])
	}
	if video["contentUrl"] != playlist {
		t.Errorf("reply video contentUrl = %v", video["contentUrl"])
	}
	if video["embedUrl"] != "https://bsky.app/profile/bob.bsky.social/post/rep1" {
		t.Errorf("reply video embedUrl = %v", video["embedUrl"])
	}
}

func TestBuildPostJSONLD_NoVideoNoField(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "no embed")
	out, _ := buildPostJSONLD(pv, nil, "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	if _, present := main["video"]; present {
		t.Errorf("post without video should not include video field")
	}
}

func TestBuildProfileJSONLD_HasPartVideo(t *testing.T) {
	pv := newProfileViewDetailed()
	playlist := "https://video.bsky.app/p.m3u8"
	post := makePostView("alice.bsky.social", "did:plc:alice", "rp1", "see",
		withVideoFull(videoEmbedOpts{
			playlist: playlist, alt: "alt",
		}))
	out, _ := buildProfileJSONLD(pv, []*appbsky.FeedDefs_PostView{post}, hideEmbedLabels, hideReplyLabels)
	page := unmarshalLD(t, out)
	hp := page["hasPart"].([]any)
	if len(hp) != 1 {
		t.Fatalf("expected 1 hasPart entry, got %d", len(hp))
	}
	video, ok := hp[0].(map[string]any)["video"].(map[string]any)
	if !ok {
		t.Fatalf("hasPart entry should carry video, got %v", hp[0])
	}
	if video["contentUrl"] != playlist {
		t.Errorf("hasPart video contentUrl = %v", video["contentUrl"])
	}
	if video["embedUrl"] != "https://bsky.app/profile/alice.bsky.social/post/rp1" {
		t.Errorf("hasPart video embedUrl = %v", video["embedUrl"])
	}
}

// handle.invalid authors must still produce a non-empty embedUrl on the
// VideoObject. The handle-form URL is unusable, so we fall back to the
// DID-form URL derived from the AT-URI authority. Without this fallback,
// omitempty drops embedUrl and Google's video indexer loses the canonical
// page reference.
func TestBuildPostJSONLD_VideoHandleInvalidEmbedURL(t *testing.T) {
	playlist := "https://video.bsky.app/p.m3u8"
	pv := makePostView("handle.invalid", "did:plc:alice", "abc123", "watch",
		withVideoFull(videoEmbedOpts{
			playlist: playlist, alt: "scenic clip",
		}))
	canonical := "https://bsky.app/profile/did:plc:alice/post/abc123"
	out, _ := buildPostJSONLD(pv, nil, canonical, hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	video, ok := main["video"].(map[string]any)
	if !ok {
		t.Fatalf("video missing on handle.invalid post")
	}
	if video["embedUrl"] != canonical {
		t.Errorf("embedUrl = %v, want %v", video["embedUrl"], canonical)
	}
	if video["contentUrl"] != playlist {
		t.Errorf("contentUrl = %v, want %v", video["contentUrl"], playlist)
	}
}

// Same fallback applies to videos on replies whose author is handle.invalid.
func TestBuildPostJSONLD_VideoHandleInvalidEmbedURL_Reply(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "main")
	*pv.ReplyCount = 1
	playlist := "https://video.bsky.app/bob.m3u8"
	reply := makePostView("handle.invalid", "did:plc:bob", "rep1", "watch",
		withVideoFull(videoEmbedOpts{
			playlist: playlist, alt: "bob's clip",
		}))
	out, _ := buildPostJSONLD(pv, buildReplies(reply), "u", hideEmbedLabels, hideReplyLabels)
	main := unmarshalLD(t, out)["mainEntity"].(map[string]any)
	c := main["comment"].([]any)[0].(map[string]any)
	video, ok := c["video"].(map[string]any)
	if !ok {
		t.Fatalf("reply video missing")
	}
	want := "https://bsky.app/profile/did:plc:bob/post/rep1"
	if video["embedUrl"] != want {
		t.Errorf("reply video embedUrl = %v, want %v", video["embedUrl"], want)
	}
}
