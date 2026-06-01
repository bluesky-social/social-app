package main

import (
	"encoding/json"
	"fmt"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
	"github.com/bluesky-social/indigo/atproto/syntax"
)

// schema.org structured-data types emitted on post and profile pages.
// Building these as Go structs (rather than inline JSON in templates) gives
// us correct JSON escaping via encoding/json and a single place to test the
// schema. Optional fields use omitempty so empty values don't reach Google's
// validator as null/empty strings.

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
	ReviewedBy           []*verifier       `json:"reviewedBy,omitempty"`
}

// verifier is the schema.org Person shape emitted under Person.reviewedBy.
// Narrower than personOrOrg: just enough to identify the verifying entity.
type verifier struct {
	Type          string `json:"@type"`
	Name          string `json:"name,omitempty"`
	AlternateName string `json:"alternateName,omitempty"`
	Identifier    string `json:"identifier,omitempty"`
	URL           string `json:"url,omitempty"`
}

type sharedContent struct {
	Type string `json:"@type"`
	URL  string `json:"url"`
}

type discussionForumPosting struct {
	Context         string            `json:"@context,omitempty"`
	Type            string            `json:"@type"`
	URL             string            `json:"url,omitempty"`
	Identifier      string            `json:"identifier,omitempty"`
	Author          *personOrOrg      `json:"author,omitempty"`
	Text            string            `json:"text,omitempty"`
	Image           []string          `json:"image,omitempty"`
	ThumbnailURL    string            `json:"thumbnailUrl,omitempty"`
	DatePublished   string            `json:"datePublished,omitempty"`
	InteractionStat []interactionStat `json:"interactionStatistic,omitempty"`
	CommentCount    *int64            `json:"commentCount,omitempty"`
	Comment         []comment         `json:"comment,omitempty"`
	IsBasedOn       string            `json:"isBasedOn,omitempty"`
	SharedContent   *sharedContent    `json:"sharedContent,omitempty"`
}

// comment is the schema.org Comment shape used in
// DiscussionForumPosting.comment[]. The comment property does not accept
// DiscussionForumPosting, so replies map to Comment.
type comment struct {
	Type          string       `json:"@type"`
	URL           string       `json:"url,omitempty"`
	Identifier    string       `json:"identifier,omitempty"`
	Author        *personOrOrg `json:"author,omitempty"`
	Text          string       `json:"text,omitempty"`
	Image         []string     `json:"image,omitempty"`
	ThumbnailURL  string       `json:"thumbnailUrl,omitempty"`
	DatePublished string       `json:"datePublished,omitempty"`
}

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

// maxComments caps DiscussionForumPosting.comment[] to keep SSR HTML small.
const maxComments = 10

// maxRecentPosts caps ProfilePage.hasPart[].
const maxRecentPosts = 10

// maxReviewedBy caps Person.reviewedBy entries.
const maxReviewedBy = 10

// authorFeedFetchLimit oversamples getAuthorFeed because posts_no_replies
// still returns reposts; we drop those client-side. 3x is a safe margin.
const authorFeedFetchLimit = 3 * maxRecentPosts

// bskyPostURL returns the canonical handle-form post URL, or "" if handle
// or rkey is unusable.
func bskyPostURL(handle, rkey string) string {
	if handle == "" || handle == "handle.invalid" || rkey == "" {
		return ""
	}
	return fmt.Sprintf("https://bsky.app/profile/%s/post/%s", handle, rkey)
}

// bskyPostURLFromATURI is bskyPostURL for callers holding an at-uri.
func bskyPostURLFromATURI(handle, atURI string) string {
	parsed, err := syntax.ParseATURI(atURI)
	if err != nil {
		return ""
	}
	return bskyPostURL(handle, parsed.RecordKey().String())
}

// bskyProfileURL returns the canonical handle-form profile URL, or "" if
// the handle is unusable.
func bskyProfileURL(handle string) string {
	if handle == "" || handle == "handle.invalid" {
		return ""
	}
	return fmt.Sprintf("https://bsky.app/profile/%s", handle)
}

// extractPostMedia returns thumbnail URLs for the post's image or video
// embed, byte-identical to what we put in og:image. Callers derive
// thumbnailUrl from urls[0].
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

// imageThumbs returns the thumb URLs, or nil if empty.
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

// extractQuotedPostURL returns the canonical URL of a quoted post, or ""
// if the embed is blocked / not-found / detached / a non-post record.
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
		return ""
	}
	return bskyPostURLFromATURI(vr.Author.Handle, vr.Uri)
}

// extractSharedContentURL returns the URL of an external link embed (also
// from the media slot of a record-with-media embed).
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

// buildAuthor constructs a Person. Organization classification for
// custom-domain accounts is a future enhancement.
func buildAuthor(author *appbsky.ActorDefs_ProfileViewBasic) *personOrOrg {
	if author == nil {
		return nil
	}
	p := &personOrOrg{
		Type: "Person",
	}
	if author.Did != "" {
		p.Identifier = author.Did
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

// buildReviewedBy maps a profile's verifications to Person entries for
// Person.reviewedBy. Skips !IsValid and missing Issuer; caps at
// maxReviewedBy. URL falls back to DID-form when the verifier's handle is
// missing or "handle.invalid".
func buildReviewedBy(state *appbsky.ActorDefs_VerificationState) []*verifier {
	if state == nil || len(state.Verifications) == 0 {
		return nil
	}
	var out []*verifier
	for _, v := range state.Verifications {
		if v == nil || !v.IsValid || v.Issuer == "" {
			continue
		}
		if len(out) >= maxReviewedBy {
			break
		}
		entry := &verifier{
			Type:       "Person",
			Identifier: v.Issuer,
		}
		var handle string
		if v.IssuerHandle != nil {
			handle = *v.IssuerHandle
		}
		if v.IssuerDisplayName != nil && *v.IssuerDisplayName != "" {
			entry.Name = *v.IssuerDisplayName
			if handle != "" && handle != "handle.invalid" {
				entry.AlternateName = "@" + handle
			}
		} else if handle != "" && handle != "handle.invalid" {
			entry.Name = "@" + handle
		}
		if url := bskyProfileURL(handle); url != "" {
			entry.URL = url
		} else {
			entry.URL = "https://bsky.app/profile/" + v.Issuer
		}
		out = append(out, entry)
	}
	return out
}

// postHasHideLabel reports whether the post-view or self-labels include
// any non-negated label in labelSet. Self-labels have no negation.
func postHasHideLabel(pv *appbsky.FeedDefs_PostView, labelSet map[string]bool) bool {
	if pv == nil {
		return false
	}
	for _, label := range pv.Labels {
		isNeg := label.Neg != nil && *label.Neg
		if labelSet[label.Val] && !isNeg {
			return true
		}
	}
	if pv.Record != nil {
		if rec, ok := pv.Record.Val.(*appbsky.FeedPost); ok {
			if rec.Labels != nil && rec.Labels.LabelDefs_SelfLabels != nil {
				for _, label := range rec.Labels.LabelDefs_SelfLabels.Values {
					if labelSet[label.Val] {
						return true
					}
				}
			}
		}
	}
	return false
}

// postEmbedHidden reports whether any post-view label or self-label asks
// embeds to be omitted. WebPost uses this so og:image and JSON-LD media
// suppression stay in sync.
func postEmbedHidden(pv *appbsky.FeedDefs_PostView, hideLabels map[string]bool) bool {
	return postHasHideLabel(pv, hideLabels)
}

// postRecordText returns the post's expanded text, or "" if the record is
// missing or malformed.
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

// buildPostStats returns the like / comment / share interaction triple.
// commentCount is emitted separately on DiscussionForumPosting.
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

// buildPostNode constructs a DiscussionForumPosting in nested form (no
// envelope, no @context). Used for top-level posts and for entries in
// hasPart / comment arrays. Returns the zero value if pv or pv.Author is
// nil; callers should treat that as "skip". Replies whose own labels match
// hideLabels or hideReplyLabels are dropped from comment[].
func buildPostNode(pv *appbsky.FeedDefs_PostView, replies []*appbsky.FeedDefs_ThreadViewPost_Replies_Elem, hideLabels, hideReplyLabels map[string]bool) discussionForumPosting {
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

	// Surface verifications on the post author only; replies do not.
	if node.Author != nil {
		if rb := buildReviewedBy(pv.Author.Verification); len(rb) > 0 {
			node.Author.ReviewedBy = rb
		}
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
		replyPV := r.FeedDefs_ThreadViewPost.Post
		// Drop labeled replies entirely so abusive/spam text isn't surfaced
		// into the parent post's structured data.
		if postHasHideLabel(replyPV, hideReplyLabels) || postHasHideLabel(replyPV, hideLabels) {
			continue
		}
		reply := buildReplyNode(replyPV, hideLabels)
		if reply.Type == "" {
			continue
		}
		node.Comment = append(node.Comment, reply)
	}

	return node
}

// buildReplyNode builds a schema.org Comment for a reply. Returns the
// zero value if pv or pv.Author is nil.
func buildReplyNode(pv *appbsky.FeedDefs_PostView, hideLabels map[string]bool) comment {
	if pv == nil || pv.Author == nil {
		return comment{}
	}
	embedHidden := postEmbedHidden(pv, hideLabels)
	images := extractPostMedia(pv, embedHidden)
	var thumb string
	if len(images) > 0 {
		thumb = images[0]
	}
	return comment{
		Type:          "Comment",
		URL:           bskyPostURLFromATURI(pv.Author.Handle, pv.Uri),
		Identifier:    pv.Uri,
		Author:        buildAuthor(pv.Author),
		Text:          postRecordText(pv),
		Image:         images,
		ThumbnailURL:  thumb,
		DatePublished: pv.IndexedAt,
	}
}

// buildPostJSONLD marshals the WebPage envelope wrapping a
// DiscussionForumPosting. canonicalURL is used for both envelope.url and
// (as a fallback) mainEntity.url so they always agree.
func buildPostJSONLD(pv *appbsky.FeedDefs_PostView, replies []*appbsky.FeedDefs_ThreadViewPost_Replies_Elem, canonicalURL string, hideLabels, hideReplyLabels map[string]bool) (string, error) {
	if pv == nil || pv.Author == nil {
		return "", fmt.Errorf("nil post view or author")
	}
	node := buildPostNode(pv, replies, hideLabels, hideReplyLabels)

	// mainEntity.url is empty when the author handle is unusable; fall back
	// to canonicalURL so it agrees with envelope.url.
	if node.URL == "" {
		node.URL = canonicalURL
	}

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

// buildProfileJSONLD marshals a ProfilePage (with hasPart recent posts).
// Recent posts whose own labels match hideLabels or hideReplyLabels are
// dropped from hasPart, mirroring the gating applied to comment[].
func buildProfileJSONLD(pv *appbsky.ActorDefs_ProfileViewDetailed, recentPosts []*appbsky.FeedDefs_PostView, hideLabels, hideReplyLabels map[string]bool) (string, error) {
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
	if rb := buildReviewedBy(pv.Verification); len(rb) > 0 {
		person.ReviewedBy = rb
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
		// Drop labeled posts entirely so flagged content isn't surfaced
		// into the profile's structured data.
		if postHasHideLabel(rp, hideReplyLabels) || postHasHideLabel(rp, hideLabels) {
			continue
		}
		// Recent posts go in nested form. No replies are passed, so the
		// reply-label set is irrelevant; pass nil.
		node := buildPostNode(rp, nil, hideLabels, nil)
		if node.Type == "" {
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
