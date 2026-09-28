package main

import (
	appbsky "github.com/bluesky-social/indigo/api/bsky"
)

// Helpers for inspecting profile / post labels.

// profileRequiresAuth reports whether the profile has self-applied the
// !no-unauthenticated label. SSR responses for these profiles omit post
// content beyond minimal identity.
func profileRequiresAuth(pv *appbsky.ActorDefs_ProfileViewDetailed) bool {
	if pv == nil {
		return false
	}
	for _, label := range pv.Labels {
		if label.Src == pv.Did && label.Val == "!no-unauthenticated" {
			return true
		}
	}
	return false
}

// postAuthorRequiresAuth reports whether the post author self-applied the
// !no-unauthenticated label, read from the author view embedded in a
// getPostThread response. The appview surfaces the account's profile-record
// self-labels on the post author (src == author DID), so this mirrors
// profileRequiresAuth without a separate ActorGetProfile call.
func postAuthorRequiresAuth(pv *appbsky.FeedDefs_PostView) bool {
	if pv == nil {
		return false
	}
	return authorRequiresAuth(pv.Author)
}

// authorRequiresAuth is postAuthorRequiresAuth for a bare author view, e.g.
// the author of a quoted record. Used to keep third-party content from
// !no-unauthenticated accounts out of another post's structured data.
func authorRequiresAuth(author *appbsky.ActorDefs_ProfileViewBasic) bool {
	if author == nil {
		return false
	}
	for _, label := range author.Labels {
		if label.Src == author.Did && label.Val == "!no-unauthenticated" {
			return true
		}
	}
	return false
}
