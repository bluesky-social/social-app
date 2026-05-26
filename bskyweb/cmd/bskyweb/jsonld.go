package main

import (
	"encoding/json"
	"fmt"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
	"github.com/bluesky-social/indigo/atproto/syntax"
)

// schema.org structured-data types emitted on post and profile pages.
//
// These mirror the shapes recommended by Google Search for
// DiscussionForumPosting (post pages) and ProfilePage (profile pages). The
// goal of building these in Go (rather than writing JSON inline in Pongo2
// templates) is to get correct JSON escaping for free via encoding/json, and
// to keep the schema in one place that is easy to unit-test.
//
// All fields use omitempty aggressively so optional fields don't emit empty
// strings or null values that would otherwise confuse Google's validator.

const schemaOrgContext = "https://schema.org"

type interactionStat struct {
	Type                 string `json:"@type"`
	InteractionType      string `json:"interactionType"`
	UserInteractionCount int64  `json:"userInteractionCount"`
}

type personOrOrg struct {
	Type                 string            `json:"@type"`
	Name                 string            `json:"name,omitempty"`
	AlternateName        string            `json:"alternateName,omitempty"`
	Identifier           string            `json:"identifier,omitempty"`
	URL                  string            `json:"url,omitempty"`
	Description          string            `json:"description,omitempty"`
	Image                string            `json:"image,omitempty"`
	InteractionStat      []interactionStat `json:"interactionStatistic,omitempty"`
	AgentInteractionStat []interactionStat `json:"agentInteractionStatistic,omitempty"`
}

type sharedContent struct {
	Type string `json:"@type"`
	URL  string `json:"url"`
}

type discussionForumPosting struct {
	Context         string                   `json:"@context,omitempty"`
	Type            string                   `json:"@type"`
	URL             string                   `json:"url,omitempty"`
	Identifier      string                   `json:"identifier,omitempty"`
	Author          *personOrOrg             `json:"author,omitempty"`
	Text            string                   `json:"text,omitempty"`
	Image           []string                 `json:"image,omitempty"`
	ThumbnailURL    string                   `json:"thumbnailUrl,omitempty"`
	DatePublished   string                   `json:"datePublished,omitempty"`
	InteractionStat []interactionStat        `json:"interactionStatistic,omitempty"`
	CommentCount    *int64                   `json:"commentCount,omitempty"`
	Comment         []discussionForumPosting `json:"comment,omitempty"`
	IsBasedOn       string                   `json:"isBasedOn,omitempty"`
	SharedContent   *sharedContent           `json:"sharedContent,omitempty"`
}

// Replies reuse discussionForumPosting via buildReplyNode, which produces a
// "shallow" form: it includes author, text, datePublished, url, identifier,
// and media (image, thumbnailUrl) but does NOT recurse into nested
// comment[], isBasedOn, or sharedContent. This bounds the size of the
// emitted JSON-LD on posts with deep reply trees.

type webPage struct {
	Context    string                 `json:"@context"`
	Type       string                 `json:"@type"`
	URL        string                 `json:"url,omitempty"`
	MainEntity discussionForumPosting `json:"mainEntity"`
}

type profilePage struct {
	Context     string                   `json:"@context"`
	Type        string                   `json:"@type"`
	DateCreated string                   `json:"dateCreated,omitempty"`
	MainEntity  *personOrOrg             `json:"mainEntity"`
	HasPart     []discussionForumPosting `json:"hasPart,omitempty"`
}

// maxComments is the maximum number of top-level replies emitted in
// DiscussionForumPosting.comment[]. Bounded to keep SSR HTML payload small.
const maxComments = 10

// maxRecentPosts is the maximum number of recent posts emitted on a profile
// page in ProfilePage.hasPart[].
const maxRecentPosts = 10

// authorFeedFetchLimit is how many entries to request from getAuthorFeed
// when populating ProfilePage.hasPart. We oversample because the
// posts_no_replies filter still returns reposts (which we drop client-side
// — only the author's own posts go in hasPart). A 3x oversample is a safe
// margin even for profiles that repost frequently.
const authorFeedFetchLimit = 3 * maxRecentPosts

// bskyPostURL returns the canonical handle-form URL for a post, given the
// post's author handle and record key. Returns "" if the handle is unusable
// (empty or handle.invalid) or rkey is empty.
func bskyPostURL(handle, rkey string) string {
	if handle == "" || handle == "handle.invalid" || rkey == "" {
		return ""
	}
	return fmt.Sprintf("https://bsky.app/profile/%s/post/%s", handle, rkey)
}

// bskyPostURLFromATURI is a convenience wrapper for callers that hold an
// at-uri rather than a record key directly. Returns "" if the URI cannot be
// parsed.
func bskyPostURLFromATURI(handle, atURI string) string {
	parsed, err := syntax.ParseATURI(atURI)
	if err != nil {
		return ""
	}
	return bskyPostURL(handle, parsed.RecordKey().String())
}

// bskyProfileURL returns the canonical handle-form URL for a profile.
// Returns "" if the handle is unusable.
func bskyProfileURL(handle string) string {
	if handle == "" || handle == "handle.invalid" {
		return ""
	}
	return fmt.Sprintf("https://bsky.app/profile/%s", handle)
}

// extractPostMedia returns the image thumbnail URLs for the post (if any).
// All URLs are reused verbatim from the appview response — the same strings
// that go into og:image meta tags — so Google sees byte-identical media
// references. Callers derive thumbnailUrl from urls[0].
func extractPostMedia(pv *appbsky.FeedDefs_PostView, embedHidden bool) []string {
	if pv == nil || pv.Embed == nil || embedHidden {
		return nil
	}

	if pv.Embed.EmbedImages_View != nil {
		return imageThumbs(pv.Embed.EmbedImages_View.Images)
	}
	if pv.Embed.EmbedVideo_View != nil && pv.Embed.EmbedVideo_View.Thumbnail != nil {
		return []string{*pv.Embed.EmbedVideo_View.Thumbnail}
	}
	if pv.Embed.EmbedRecordWithMedia_View != nil && pv.Embed.EmbedRecordWithMedia_View.Media != nil {
		media := pv.Embed.EmbedRecordWithMedia_View.Media
		if media.EmbedImages_View != nil {
			return imageThumbs(media.EmbedImages_View.Images)
		}
		if media.EmbedVideo_View != nil && media.EmbedVideo_View.Thumbnail != nil {
			return []string{*media.EmbedVideo_View.Thumbnail}
		}
	}
	return nil
}

// imageThumbs returns the thumb URLs for a slice of image embed views, or
// nil if the slice is empty.
func imageThumbs(images []*appbsky.EmbedImages_ViewImage) []string {
	if len(images) == 0 {
		return nil
	}
	urls := make([]string, 0, len(images))
	for _, img := range images {
		urls = append(urls, img.Thumb)
	}
	return urls
}

// extractQuotedPostURL returns the canonical handle-form URL of a quoted
// post, if the embed is a viewable record (not blocked / detached / not
// found / non-post record like a feed generator or list).
func extractQuotedPostURL(pv *appbsky.FeedDefs_PostView) string {
	if pv == nil || pv.Embed == nil {
		return ""
	}
	var rec *appbsky.EmbedRecord_View
	if pv.Embed.EmbedRecord_View != nil {
		rec = pv.Embed.EmbedRecord_View
	} else if pv.Embed.EmbedRecordWithMedia_View != nil {
		rec = pv.Embed.EmbedRecordWithMedia_View.Record
	}
	if rec == nil || rec.Record == nil {
		return ""
	}
	vr := rec.Record.EmbedRecord_ViewRecord
	if vr == nil || vr.Author == nil {
		// Skip _ViewBlocked, _ViewNotFound, _ViewDetached, and non-post records.
		return ""
	}
	return bskyPostURLFromATURI(vr.Author.Handle, vr.Uri)
}

// extractSharedContentURL returns the URL of an external link embedded in
// the post (or in the media slot of a record-with-media embed).
func extractSharedContentURL(pv *appbsky.FeedDefs_PostView) string {
	if pv == nil || pv.Embed == nil {
		return ""
	}
	if pv.Embed.EmbedExternal_View != nil && pv.Embed.EmbedExternal_View.External != nil {
		return pv.Embed.EmbedExternal_View.External.Uri
	}
	if pv.Embed.EmbedRecordWithMedia_View != nil &&
		pv.Embed.EmbedRecordWithMedia_View.Media != nil &&
		pv.Embed.EmbedRecordWithMedia_View.Media.EmbedExternal_View != nil &&
		pv.Embed.EmbedRecordWithMedia_View.Media.EmbedExternal_View.External != nil {
		return pv.Embed.EmbedRecordWithMedia_View.Media.EmbedExternal_View.External.Uri
	}
	return ""
}

// buildAuthor constructs a Person object. Organization classification for
// custom-domain or organization-style accounts is a future enhancement; for
// now, every author is emitted as Person.
func buildAuthor(author *appbsky.ActorDefs_ProfileViewBasic) *personOrOrg {
	if author == nil {
		return nil
	}
	p := &personOrOrg{
		Type: "Person",
	}
	if author.DisplayName != nil && *author.DisplayName != "" {
		p.Name = *author.DisplayName
		if author.Handle != "" {
			p.AlternateName = "@" + author.Handle
		}
	} else if author.Handle != "" {
		p.Name = "@" + author.Handle
	}
	if url := bskyProfileURL(author.Handle); url != "" {
		p.URL = url
	}
	return p
}

// postEmbedHidden checks self-labels and post-view labels for any label that
// causes embeds to be omitted. Mirrors logic in WebPost handler so the
// JSON-LD shape stays consistent with og:image emission.
func postEmbedHidden(pv *appbsky.FeedDefs_PostView, hideLabels map[string]bool) bool {
	if pv == nil {
		return false
	}
	for _, label := range pv.Labels {
		isNeg := label.Neg != nil && *label.Neg
		if hideLabels[label.Val] && !isNeg {
			return true
		}
	}
	if pv.Record != nil {
		if rec, ok := pv.Record.Val.(*appbsky.FeedPost); ok {
			if rec.Labels != nil && rec.Labels.LabelDefs_SelfLabels != nil {
				for _, label := range rec.Labels.LabelDefs_SelfLabels.Values {
					if hideLabels[label.Val] {
						return true
					}
				}
			}
		}
	}
	return false
}

// postRecordText returns the expanded post text (with shortened links
// expanded back to full URLs) or "" if the record is missing or malformed.
func postRecordText(pv *appbsky.FeedDefs_PostView) string {
	if pv == nil || pv.Record == nil {
		return ""
	}
	rec, ok := pv.Record.Val.(*appbsky.FeedPost)
	if !ok {
		return ""
	}
	return ExpandPostText(rec)
}

// buildPostStats returns the standard like/comment/share interaction stat
// triple. CommentAction count uses ReplyCount to match what Google expects
// in InteractionCounter; commentCount is emitted separately on
// DiscussionForumPosting.
func buildPostStats(pv *appbsky.FeedDefs_PostView) []interactionStat {
	if pv == nil {
		return nil
	}
	deref := func(p *int64) int64 {
		if p == nil {
			return 0
		}
		return *p
	}
	return []interactionStat{
		{Type: "InteractionCounter", InteractionType: "https://schema.org/LikeAction", UserInteractionCount: deref(pv.LikeCount)},
		{Type: "InteractionCounter", InteractionType: "https://schema.org/CommentAction", UserInteractionCount: deref(pv.ReplyCount)},
		{Type: "InteractionCounter", InteractionType: "https://schema.org/ShareAction", UserInteractionCount: deref(pv.RepostCount) + deref(pv.QuoteCount)},
	}
}

// buildPostNode constructs a DiscussionForumPosting (in nested form, no
// @context, no envelope). Used both for top-level posts and for entries in
// hasPart / comment arrays. Returns the zero value if pv or pv.Author is nil
// — callers should treat that as "skip this entry".
func buildPostNode(pv *appbsky.FeedDefs_PostView, replies []*appbsky.FeedDefs_ThreadViewPost_Replies_Elem, hideLabels map[string]bool) discussionForumPosting {
	if pv == nil || pv.Author == nil {
		return discussionForumPosting{}
	}
	embedHidden := postEmbedHidden(pv, hideLabels)
	images := extractPostMedia(pv, embedHidden)
	var thumb string
	if len(images) > 0 {
		thumb = images[0]
	}

	node := discussionForumPosting{
		Type:            "DiscussionForumPosting",
		URL:             bskyPostURLFromATURI(pv.Author.Handle, pv.Uri),
		Identifier:      pv.Uri,
		Author:          buildAuthor(pv.Author),
		Text:            postRecordText(pv),
		Image:           images,
		ThumbnailURL:    thumb,
		DatePublished:   pv.IndexedAt,
		InteractionStat: buildPostStats(pv),
	}

	if pv.ReplyCount != nil {
		node.CommentCount = pv.ReplyCount
	} else {
		zero := int64(0)
		node.CommentCount = &zero
	}

	if !embedHidden {
		if quoted := extractQuotedPostURL(pv); quoted != "" {
			node.IsBasedOn = quoted
		}
		if shared := extractSharedContentURL(pv); shared != "" {
			node.SharedContent = &sharedContent{Type: "WebPage", URL: shared}
		}
	}

	for _, r := range replies {
		if r == nil || r.FeedDefs_ThreadViewPost == nil || r.FeedDefs_ThreadViewPost.Post == nil {
			continue
		}
		if len(node.Comment) >= maxComments {
			break
		}
		reply := buildReplyNode(r.FeedDefs_ThreadViewPost.Post, hideLabels)
		if reply.Type == "" {
			// nil-Author guard tripped; skip rather than emit a malformed entry.
			continue
		}
		node.Comment = append(node.Comment, reply)
	}

	return node
}

// buildReplyNode builds a "shallow" DiscussionForumPosting for a reply
// comment: includes media but skips nested comment[], isBasedOn, and
// sharedContent (per project decision to bound payload size). Returns the
// zero value if pv or pv.Author is nil — callers should treat that as
// "skip this entry".
func buildReplyNode(pv *appbsky.FeedDefs_PostView, hideLabels map[string]bool) discussionForumPosting {
	if pv == nil || pv.Author == nil {
		return discussionForumPosting{}
	}
	embedHidden := postEmbedHidden(pv, hideLabels)
	images := extractPostMedia(pv, embedHidden)
	var thumb string
	if len(images) > 0 {
		thumb = images[0]
	}

	node := discussionForumPosting{
		Type:          "DiscussionForumPosting",
		URL:           bskyPostURLFromATURI(pv.Author.Handle, pv.Uri),
		Identifier:    pv.Uri,
		Author:        buildAuthor(pv.Author),
		Text:          postRecordText(pv),
		Image:         images,
		ThumbnailURL:  thumb,
		DatePublished: pv.IndexedAt,
	}
	return node
}

// buildPostJSONLD marshals the top-level WebPage envelope for a post page.
// This is what gets injected into <script type="application/ld+json">.
func buildPostJSONLD(pv *appbsky.FeedDefs_PostView, replies []*appbsky.FeedDefs_ThreadViewPost_Replies_Elem, canonicalURL string, hideLabels map[string]bool) (string, error) {
	if pv == nil || pv.Author == nil {
		return "", fmt.Errorf("nil post view or author")
	}
	node := buildPostNode(pv, replies, hideLabels)

	// Top-level entity: wrap in WebPage envelope per Google's recommendation.
	envelope := webPage{
		Context:    schemaOrgContext,
		Type:       "WebPage",
		URL:        canonicalURL,
		MainEntity: node,
	}
	b, err := json.Marshal(envelope)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// buildProfileJSONLD marshals the ProfilePage object (including hasPart
// recent posts) for a profile page.
func buildProfileJSONLD(pv *appbsky.ActorDefs_ProfileViewDetailed, recentPosts []*appbsky.FeedDefs_PostView, hideLabels map[string]bool) (string, error) {
	if pv == nil {
		return "", fmt.Errorf("nil profile view")
	}

	person := &personOrOrg{
		Type:       "Person",
		Identifier: pv.Did,
	}
	if pv.DisplayName != nil && *pv.DisplayName != "" {
		person.Name = *pv.DisplayName
		person.AlternateName = "@" + pv.Handle
	} else {
		person.Name = "@" + pv.Handle
	}
	if pv.Description != nil {
		person.Description = *pv.Description
	}
	if pv.Avatar != nil {
		person.Image = *pv.Avatar
	}

	deref := func(p *int64) int64 {
		if p == nil {
			return 0
		}
		return *p
	}
	person.InteractionStat = []interactionStat{
		{Type: "InteractionCounter", InteractionType: "https://schema.org/FollowAction", UserInteractionCount: deref(pv.FollowersCount)},
	}
	person.AgentInteractionStat = []interactionStat{
		{Type: "InteractionCounter", InteractionType: "https://schema.org/FollowAction", UserInteractionCount: deref(pv.FollowsCount)},
		{Type: "InteractionCounter", InteractionType: "https://schema.org/WriteAction", UserInteractionCount: deref(pv.PostsCount)},
	}

	page := profilePage{
		Context:    schemaOrgContext,
		Type:       "ProfilePage",
		MainEntity: person,
	}
	if pv.CreatedAt != nil {
		page.DateCreated = *pv.CreatedAt
	}

	for _, rp := range recentPosts {
		if rp == nil {
			continue
		}
		if len(page.HasPart) >= maxRecentPosts {
			break
		}
		// Recent posts go in nested form (no replies, no envelope).
		node := buildPostNode(rp, nil, hideLabels)
		if node.Type == "" {
			// nil-Author guard tripped; skip.
			continue
		}
		page.HasPart = append(page.HasPart, node)
	}

	b, err := json.Marshal(page)
	if err != nil {
		return "", err
	}
	return string(b), nil
}
