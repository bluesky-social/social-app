package main

import (
	"bytes"
	"encoding/json"
	"regexp"
	"strings"
	"testing"

	"github.com/bluesky-social/social-app/bskyweb"
	"github.com/flosch/pongo2/v6"
)

// renderTemplate executes a template using the live renderer and returns
// the output. base.html includes templates/scripts.html, which is generated
// by `yarn build-web`; skip the test if it's missing.
func renderTemplate(t *testing.T, name string, ctx pongo2.Context) string {
	t.Helper()
	if _, err := bskyweb.TemplateFS.ReadFile("templates/scripts.html"); err != nil {
		t.Skip("templates/scripts.html not present (run yarn build-web first)")
	}
	r := NewRenderer("templates/", &bskyweb.TemplateFS, false)
	tmpl, err := r.TemplateSet.FromCache(name)
	if err != nil {
		t.Fatalf("template load %q: %v", name, err)
	}
	var buf bytes.Buffer
	if err := tmpl.ExecuteWriter(ctx, &buf); err != nil {
		t.Fatalf("template execute %q: %v", name, err)
	}
	return buf.String()
}

var jsonLDRe = regexp.MustCompile(`(?s)<script type="application/ld\+json">(.*?)</script>`)

// extractJSONLD pulls out the body of the application/ld+json script tag.
func extractJSONLD(t *testing.T, html string) string {
	t.Helper()
	m := jsonLDRe.FindStringSubmatch(html)
	if m == nil {
		t.Fatalf("no application/ld+json script tag in rendered HTML:\n%s", html)
	}
	return strings.TrimSpace(m[1])
}

func TestRenderBase_NoindexMeta(t *testing.T) {
    html := renderTemplate(t, "base.html", pongo2.Context{"noindex": true, "nofollow": true})
    if !strings.Contains(html, `<meta name="robots" content="noindex, nofollow">`) {
        t.Errorf("expected combined noindex,nofollow meta; got:\n%s", html)
    }
}

func TestRenderPost_EmitsJSONLD(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "hello")
	ld, err := buildPostJSONLD(pv, nil, "https://bsky.app/profile/alice.bsky.social/post/abc123", "", hideEmbedLabels, hideReplyLabels)
	if err != nil {
		t.Fatal(err)
	}
	html := renderTemplate(t, "post.html", pongo2.Context{
		"postView":     pv,
		"requestURI":   "https://bsky.app/profile/alice.bsky.social/post/abc123",
		"canonicalURL": "https://bsky.app/profile/alice.bsky.social/post/abc123",
		"postJSONLD":   ld,
	})

	body := extractJSONLD(t, html)
	var parsed map[string]any
	if err := json.Unmarshal([]byte(body), &parsed); err != nil {
		t.Fatalf("rendered JSON-LD does not parse: %v\n%s", err, body)
	}
	if parsed["@type"] != "WebPage" {
		t.Errorf("expected WebPage envelope, got %v", parsed["@type"])
	}
	// Canonical link should be the handle-form URL.
	if !strings.Contains(html, `<link rel="canonical" href="https://bsky.app/profile/alice.bsky.social/post/abc123" />`) {
		t.Errorf("canonical link missing or wrong:\n%s", html)
	}
}

func TestRenderPost_OGImageMatchesJSONLD(t *testing.T) {
	thumb1 := "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:alice/abc@jpeg"
	thumb2 := "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:alice/def@jpeg"
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "look", withImages(thumb1, thumb2))
	ld, _ := buildPostJSONLD(pv, nil, "https://bsky.app/profile/alice.bsky.social/post/abc123", "", hideEmbedLabels, hideReplyLabels)
	html := renderTemplate(t, "post.html", pongo2.Context{
		"postView":     pv,
		"requestURI":   "https://bsky.app/profile/alice.bsky.social/post/abc123",
		"canonicalURL": "https://bsky.app/profile/alice.bsky.social/post/abc123",
		"postJSONLD":   ld,
		"postImages": []postImage{
			{Thumb: thumb1, Alt: `a "cool" cat`},
			{Thumb: thumb2},
		},
	})

	// og:image and JSON-LD image[] must be byte-identical.
	if !strings.Contains(html, `<meta property="og:image" content="`+thumb1+`">`) {
		t.Errorf("og:image[0] not found in rendered HTML")
	}
	// Alt text emits as og:image:alt / twitter:image:alt, HTML-escaped.
	if !strings.Contains(html, `<meta property="og:image:alt" content="a &quot;cool&quot; cat">`) {
		t.Errorf("og:image:alt not found or not escaped in rendered HTML:\n%s", html)
	}
	if !strings.Contains(html, `<meta property="twitter:image:alt" content="a &quot;cool&quot; cat">`) {
		t.Errorf("twitter:image:alt not found or not escaped in rendered HTML")
	}
	// Images without alt text must not emit an empty og:image:alt.
	if strings.Count(html, `og:image:alt`) != 1 {
		t.Errorf("expected exactly one og:image:alt (second image has no alt); got:\n%s", html)
	}
	body := extractJSONLD(t, html)
	var parsed map[string]any
	_ = json.Unmarshal([]byte(body), &parsed)
	main := parsed["mainEntity"].(map[string]any)
	imgs := main["image"].([]any)
	if imgs[0] != thumb1 || main["thumbnailUrl"] != thumb1 {
		t.Errorf("JSON-LD image strings drifted from og:image; image[0]=%v thumbnailUrl=%v",
			imgs[0], main["thumbnailUrl"])
	}
}

// Gallery posts must hit the same og:image / JSON-LD image[] byte-equality
// contract that legacy images posts do. Regression guard for the
// app.bsky.embed.gallery extraction path.
func TestRenderPost_OGImageMatchesJSONLD_Gallery(t *testing.T) {
	thumb1 := "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:alice/g1@jpeg"
	thumb2 := "https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:alice/g2@jpeg"
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "gallery", withGallery(thumb1, thumb2))
	postImages := extractPostMedia(pv, false)
	ld, _ := buildPostJSONLD(pv, nil, "https://bsky.app/profile/alice.bsky.social/post/abc123", "", hideEmbedLabels, hideReplyLabels)
	html := renderTemplate(t, "post.html", pongo2.Context{
		"postView":     pv,
		"requestURI":   "https://bsky.app/profile/alice.bsky.social/post/abc123",
		"canonicalURL": "https://bsky.app/profile/alice.bsky.social/post/abc123",
		"postJSONLD":   ld,
		"postImages":   postImages,
	})

	if !strings.Contains(html, `<meta property="og:image" content="`+thumb1+`">`) {
		t.Errorf("og:image[0] not found in rendered HTML for gallery post")
	}
	if !strings.Contains(html, `<meta property="og:image" content="`+thumb2+`">`) {
		t.Errorf("og:image[1] not found in rendered HTML for gallery post")
	}
	body := extractJSONLD(t, html)
	var parsed map[string]any
	_ = json.Unmarshal([]byte(body), &parsed)
	main := parsed["mainEntity"].(map[string]any)
	imgs := main["image"].([]any)
	if len(imgs) != 2 || imgs[0] != thumb1 || main["thumbnailUrl"] != thumb1 {
		t.Errorf("JSON-LD image strings drifted from og:image for gallery; image=%v thumbnailUrl=%v",
			imgs, main["thumbnailUrl"])
	}
}

func TestRenderPost_FallsBackToCanonicalizeFilter(t *testing.T) {
	// Without canonicalURL, the template falls back to requestURI|canonicalize_url.
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "hi")
	ld, _ := buildPostJSONLD(pv, nil, "u", "", hideEmbedLabels, hideReplyLabels)
	html := renderTemplate(t, "post.html", pongo2.Context{
		"postView":   pv,
		"requestURI": "https://bsky.app/profile/alice.bsky.social/post/abc123?utm=foo",
		"postJSONLD": ld,
	})
	if !strings.Contains(html, `<link rel="canonical" href="https://bsky.app/profile/alice.bsky.social/post/abc123" />`) {
		t.Errorf("expected canonicalize_url filter to strip query; got:\n%s", html)
	}
}

func TestRenderProfile_EmitsJSONLD(t *testing.T) {
	pv := newProfileViewDetailed()
	ld, err := buildProfileJSONLD(pv, nil, hideEmbedLabels, hideReplyLabels)
	if err != nil {
		t.Fatal(err)
	}
	html := renderTemplate(t, "profile.html", pongo2.Context{
		"profileView":   pv,
		"requestURI":    "https://bsky.app/profile/alice.bsky.social",
		"canonicalURL":  "https://bsky.app/profile/alice.bsky.social",
		"profileJSONLD": ld,
	})

	body := extractJSONLD(t, html)
	var parsed map[string]any
	if err := json.Unmarshal([]byte(body), &parsed); err != nil {
		t.Fatalf("rendered JSON-LD does not parse: %v\n%s", err, body)
	}
	if parsed["@type"] != "ProfilePage" {
		t.Errorf("expected ProfilePage, got %v", parsed["@type"])
	}
}

// Regression: auth-required profiles must still emit ProfilePage JSON-LD
// (without hasPart). Previously regressed when WebProfile short-circuited
// before buildProfileJSONLD.
func TestRenderProfile_AuthRequiredEmitsJSONLD(t *testing.T) {
	pv := newProfileViewDetailed()
	ld, err := buildProfileJSONLD(pv, nil, hideEmbedLabels, hideReplyLabels)
	if err != nil {
		t.Fatal(err)
	}
	html := renderTemplate(t, "profile.html", pongo2.Context{
		"profileView":   pv,
		"requestURI":    "https://bsky.app/profile/alice.bsky.social",
		"requiresAuth":  true,
		"profileJSONLD": ld,
	})

	body := extractJSONLD(t, html)
	var parsed map[string]any
	if err := json.Unmarshal([]byte(body), &parsed); err != nil {
		t.Fatalf("rendered JSON-LD does not parse: %v\n%s", err, body)
	}
	if parsed["@type"] != "ProfilePage" {
		t.Errorf("expected ProfilePage, got %v", parsed["@type"])
	}
	if _, present := parsed["hasPart"]; present {
		t.Errorf("auth-required profile should not have hasPart")
	}
}

// og:url and <link rel="canonical"> must emit the same URL.
func TestRenderPost_OGUrlMatchesCanonical(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "hi")
	ld, _ := buildPostJSONLD(pv, nil, "u", "", hideEmbedLabels, hideReplyLabels)
	canonical := "https://bsky.app/profile/alice.bsky.social/post/abc123"
	html := renderTemplate(t, "post.html", pongo2.Context{
		"postView":     pv,
		"requestURI":   "https://bsky.app/profile/did:plc:alice/post/abc123",
		"canonicalURL": canonical,
		"postJSONLD":   ld,
	})
	if !strings.Contains(html, `<meta property="og:url" content="`+canonical+`">`) {
		t.Errorf("og:url should equal canonical URL when set; got:\n%s", html)
	}
	if !strings.Contains(html, `<link rel="canonical" href="`+canonical+`" />`) {
		t.Errorf("canonical link missing or wrong:\n%s", html)
	}
	// DID-form request URI must not leak into og:url.
	if strings.Contains(html, `<meta property="og:url" content="https://bsky.app/profile/did:plc:alice/post/abc123">`) {
		t.Errorf("og:url should not echo DID-form request URI when canonical is set")
	}
}

// og:video must emit even when there is no thumbnail. Previously the
// {% if videoUrl %} block was nested inside the image block (then keyed on
// imgThumbUrls, now postImages), so a video without a thumbnail dropped
// og:video entirely.
func TestRenderPost_VideoWithoutThumbnailEmitsOGVideo(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "watch")
	ld, _ := buildPostJSONLD(pv, nil, "u", "", hideEmbedLabels, hideReplyLabels)
	videoURL := "https://video.bsky.app/v.m3u8"
	html := renderTemplate(t, "post.html", pongo2.Context{
		"postView":     pv,
		"requestURI":   "https://bsky.app/profile/alice.bsky.social/post/abc123",
		"canonicalURL": "https://bsky.app/profile/alice.bsky.social/post/abc123",
		"postJSONLD":   ld,
		"videoUrl":     videoURL,
		"videoType":    "application/x-mpegURL",
	})
	if !strings.Contains(html, `<meta property="og:video" content="`+videoURL+`">`) {
		t.Errorf("og:video should emit even without postImages; got:\n%s", html)
	}
	if !strings.Contains(html, `<meta property="og:video:type" content="application/x-mpegURL">`) {
		t.Errorf("og:video:type should emit even without postImages; got:\n%s", html)
	}
}

// Auth-required posts must emit noindex,nofollow so the stub page (no body
// text, no comments) is not indexed.
func TestRenderPost_AuthRequiredNoindex(t *testing.T) {
	html := renderTemplate(t, "post.html", pongo2.Context{
		"requiresAuth":  true,
		"profileHandle": "alice.bsky.social",
		"requestURI":    "https://bsky.app/profile/alice.bsky.social/post/abc123",
		"canonicalURL":  "https://bsky.app/profile/alice.bsky.social/post/abc123",
		"noindex":       true,
		"nofollow":      true,
	})
	if !strings.Contains(html, `<meta name="robots" content="noindex, nofollow">`) {
		t.Errorf("auth-required post should emit noindex,nofollow; got:\n%s", html)
	}
}

// Auth-required profiles must emit noindex,nofollow.
func TestRenderProfile_AuthRequiredNoindex(t *testing.T) {
	pv := newProfileViewDetailed()
	html := renderTemplate(t, "profile.html", pongo2.Context{
		"profileView":  pv,
		"requestURI":   "https://bsky.app/profile/alice.bsky.social",
		"requiresAuth": true,
		"noindex":      true,
		"nofollow":     true,
	})
	if !strings.Contains(html, `<meta name="robots" content="noindex, nofollow">`) {
		t.Errorf("auth-required profile should emit noindex,nofollow; got:\n%s", html)
	}
}

// Public posts must NOT emit a robots meta tag. Guards against an accidental
// flip of the noindex flag for indexable pages.
func TestRenderPost_PublicNoNoindex(t *testing.T) {
	pv := makePostView("alice.bsky.social", "did:plc:alice", "abc123", "hello")
	ld, _ := buildPostJSONLD(pv, nil, "https://bsky.app/profile/alice.bsky.social/post/abc123", "", hideEmbedLabels, hideReplyLabels)
	html := renderTemplate(t, "post.html", pongo2.Context{
		"postView":     pv,
		"requestURI":   "https://bsky.app/profile/alice.bsky.social/post/abc123",
		"canonicalURL": "https://bsky.app/profile/alice.bsky.social/post/abc123",
		"postJSONLD":   ld,
	})
	if strings.Contains(html, `<meta name="robots"`) {
		t.Errorf("public post should not emit robots meta; got:\n%s", html)
	}
}
