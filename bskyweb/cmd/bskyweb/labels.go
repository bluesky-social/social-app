package main

import (
	appbsky "github.com/bluesky-social/indigo/api/bsky"
)

// Helpers for inspecting profile / post labels.

// profileRequiresAuth reports whether the profile has self-applied the
// `!no-unauthenticated` label, indicating the user only wants their content
// shown to signed-in viewers. SSR responses for these profiles must omit
// post text, descriptions, and other content beyond minimal identity.
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
