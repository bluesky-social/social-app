package main

import (
	"testing"

	comatprototypes "github.com/bluesky-social/indigo/api/atproto"
	appbsky "github.com/bluesky-social/indigo/api/bsky"
)

func TestProfileRequiresAuth(t *testing.T) {
	negTrue := true

	tests := []struct {
		name string
		pv   *appbsky.ActorDefs_ProfileViewDetailed
		want bool
	}{
		{
			name: "nil profile",
			pv:   nil,
			want: false,
		},
		{
			name: "no labels",
			pv:   &appbsky.ActorDefs_ProfileViewDetailed{Did: "did:plc:alice"},
			want: false,
		},
		{
			name: "self-applied !no-unauthenticated",
			pv: &appbsky.ActorDefs_ProfileViewDetailed{
				Did: "did:plc:alice",
				Labels: []*comatprototypes.LabelDefs_Label{
					{Src: "did:plc:alice", Val: "!no-unauthenticated"},
				},
			},
			want: true,
		},
		{
			name: "label from a different src does not gate",
			pv: &appbsky.ActorDefs_ProfileViewDetailed{
				Did: "did:plc:alice",
				Labels: []*comatprototypes.LabelDefs_Label{
					{Src: "did:plc:labeler", Val: "!no-unauthenticated"},
				},
			},
			want: false,
		},
		{
			name: "different label value does not gate",
			pv: &appbsky.ActorDefs_ProfileViewDetailed{
				Did: "did:plc:alice",
				Labels: []*comatprototypes.LabelDefs_Label{
					{Src: "did:plc:alice", Val: "spam"},
				},
			},
			want: false,
		},
		{
			// Negation isn't honored — matches prior inline behavior in
			// WebPost / WebProfile / WebProfileRSS.
			name: "negated label still triggers (matches prior behavior)",
			pv: &appbsky.ActorDefs_ProfileViewDetailed{
				Did: "did:plc:alice",
				Labels: []*comatprototypes.LabelDefs_Label{
					{Src: "did:plc:alice", Val: "!no-unauthenticated", Neg: &negTrue},
				},
			},
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := profileRequiresAuth(tt.pv); got != tt.want {
				t.Errorf("got %v, want %v", got, tt.want)
			}
		})
	}
}

func TestPostAuthorRequiresAuth(t *testing.T) {
	negTrue := true

	authorPV := func(labels []*comatprototypes.LabelDefs_Label) *appbsky.FeedDefs_PostView {
		return &appbsky.FeedDefs_PostView{
			Author: &appbsky.ActorDefs_ProfileViewBasic{
				Did:    "did:plc:alice",
				Handle: "alice.bsky.social",
				Labels: labels,
			},
		}
	}

	tests := []struct {
		name string
		pv   *appbsky.FeedDefs_PostView
		want bool
	}{
		{
			name: "nil post view",
			pv:   nil,
			want: false,
		},
		{
			name: "nil author",
			pv:   &appbsky.FeedDefs_PostView{},
			want: false,
		},
		{
			name: "no labels",
			pv:   authorPV(nil),
			want: false,
		},
		{
			name: "self-applied !no-unauthenticated",
			pv: authorPV([]*comatprototypes.LabelDefs_Label{
				{Src: "did:plc:alice", Val: "!no-unauthenticated"},
			}),
			want: true,
		},
		{
			name: "label from a different src does not gate",
			pv: authorPV([]*comatprototypes.LabelDefs_Label{
				{Src: "did:plc:labeler", Val: "!no-unauthenticated"},
			}),
			want: false,
		},
		{
			name: "different label value does not gate",
			pv: authorPV([]*comatprototypes.LabelDefs_Label{
				{Src: "did:plc:alice", Val: "spam"},
			}),
			want: false,
		},
		{
			// Negation isn't honored - matches profileRequiresAuth behavior.
			name: "negated label still triggers (matches profile behavior)",
			pv: authorPV([]*comatprototypes.LabelDefs_Label{
				{Src: "did:plc:alice", Val: "!no-unauthenticated", Neg: &negTrue},
			}),
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := postAuthorRequiresAuth(tt.pv); got != tt.want {
				t.Errorf("got %v, want %v", got, tt.want)
			}
		})
	}
}
