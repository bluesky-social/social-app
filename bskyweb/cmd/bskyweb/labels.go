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
