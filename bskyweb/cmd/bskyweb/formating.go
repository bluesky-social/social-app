package main

import (
	"fmt"
	"slices"
	"strings"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
)

// Function to expand shortened links in rich text back to full urls, replacing shortened urls in social card meta tags and the noscript output.
//
// This essentially reverses the effect of the typescript function `shortenLinks()` in `src/lib/strings/rich-text-manip.ts`
func ExpandPostText(post *appbsky.FeedPost) string {
	postText := post.Text
	var charsAdded int = 0
	// iterate over facets, check if they're link facets, and if found, grab the uri
	for _, facet := range post.Facets {
		linkUri := ""
		if slices.ContainsFunc(facet.Features, func(feat *appbsky.RichtextFacet_Features_Elem) bool {
			if feat.RichtextFacet_Link == nil || feat.RichtextFacet_Link.LexiconTypeID != "app.bsky.richtext.facet#link" {
				return false
			}

			// bail out if bounds checks fail
			if facet.Index.ByteStart > facet.Index.ByteEnd ||
				int(facet.Index.ByteStart)+charsAdded > len(postText) ||
				int(facet.Index.ByteEnd)+charsAdded > len(postText) {
				return false
			}
			linkText := postText[int(facet.Index.ByteStart)+charsAdded : int(facet.Index.ByteEnd)+charsAdded]
			linkUri = feat.RichtextFacet_Link.Uri

			// only expand uris that have been shortened (as opposed to those with non-uri anchor text)
			if strings.HasSuffix(linkText, "...") && strings.Contains(linkUri, linkText[0:len(linkText)-3]) {
				return true
			}
			return false
		}) {
			// replace the shortened uri with the full length one from the facet using utf8 byte offsets
			// NOTE: we already did bounds check above
			postText = postText[0:int(facet.Index.ByteStart)+charsAdded] + linkUri + postText[int(facet.Index.ByteEnd)+charsAdded:]
			charsAdded += len(linkUri) - int(facet.Index.ByteEnd-facet.Index.ByteStart)
		}
	}
	// if the post has an embeded link and its url doesn't already appear in postText, append it to
	// the end to avoid social cards with missing links
	if post.Embed != nil && post.Embed.EmbedExternal != nil && post.Embed.EmbedExternal.External != nil {
		externalURI := post.Embed.EmbedExternal.External.Uri
		if !strings.Contains(postText, externalURI) {
			postText = fmt.Sprintf("%s\n%s", postText, externalURI)
		}
	}
	// TODO: could embed the actual post text?
	if post.Embed != nil && (post.Embed.EmbedRecord != nil || post.Embed.EmbedRecordWithMedia != nil) {
		postText = fmt.Sprintf("%s\n\n[contains quote post or other embedded content]", postText)
	}
	return postText
}
