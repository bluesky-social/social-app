package main

import (
	"encoding/xml"
	"fmt"
	"net/http"
	"strings"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
	"github.com/bluesky-social/indigo/atproto/syntax"

	"github.com/labstack/echo/v4"
)

// time.RFC822Z, but with four digit year. used for RSS pubData.
var FullYearRFC822Z = "02 Jan 2006 15:04 -0700"

// MediaContent represents a Media RSS content element.
type MediaContent struct {
	XMLName     xml.Name `xml:"media:content"`
	URL         string   `xml:"url,attr"`
	Type        string   `xml:"type,attr"`
	FileSize    int64    `xml:"fileSize,attr"`               // Use FileSize instead of Length
	Title       string   `xml:"media:title,omitempty"`       // Holds alt or caption text
	Description string   `xml:"media:description,omitempty"` // Optional longer description
}

type ItemGUID struct {
	XMLName xml.Name `xml:"guid"`
	Value   string   `xml:",chardata"`
	IsPerma bool     `xml:"isPermaLink,attr"`
}

// AtomLink represents an Atom link element, used for self referencing in RSS feeds.
type AtomLink struct {
	Rel  string `xml:"rel,attr"`
	Type string `xml:"type,attr"`
	Href string `xml:"href,attr"`
}

// We don't actually populate the title for "posts".
// Some background: https://book.micro.blog/rss-for-microblogs/
type Item struct {
	Title              string `xml:"title,omitempty"`
	Link               string `xml:"link,omitempty"`
	Description        string `xml:"description,omitempty"`
	PubDate            string `xml:"pubDate,omitempty"`
	GUID               ItemGUID
	MediaContentSingle *MediaContent `xml:"media:content,omitempty"`
	MediaGroup         *MediaGroup   `xml:"media:group,omitempty"`
}

// rss represents the root RSS element with a nested channel element and includes the Media RSS and Atom namespaces.
type rss struct {
	XMLName    xml.Name `xml:"rss"`
	Version    string   `xml:"version,attr"`
	XMLNSMedia string   `xml:"xmlns:media,attr"`
	XMLNSAtom  string   `xml:"xmlns:atom,attr"`
	Channel    channel  `xml:"channel"`
}

type channel struct {
	AtomLink    AtomLink `xml:"atom:link"`
	Title       string   `xml:"title"`
	Link        string   `xml:"link"`
	Description string   `xml:"description,omitempty"`
	Item        []Item   `xml:"item"`
}

// MediaGroup represents a group of MediaContent items using the Media RSS extension.
type MediaGroup struct {
	XMLName       xml.Name        `xml:"media:group"`
	MediaContents []*MediaContent `xml:"media:content,omitempty"`
}

// getPostMediaContents extracts media content (images and videos) from a post and builds Media RSS elements.
func getPostMediaContents(p *appbsky.FeedDefs_FeedViewPost, rec *appbsky.FeedPost) []*MediaContent {
	var contents []*MediaContent

	// Return early if there is no embed at all
	if p.Post.Embed == nil || rec.Embed == nil {
		return nil
	}

	extractImages := func(viewImages []*appbsky.EmbedImages_ViewImage, recImages []*appbsky.EmbedImages_Image) []*MediaContent {
		var imageContents []*MediaContent
		for i, viewImg := range viewImages {
			// Ensure there's a matching image in the record
			if i >= len(recImages) {
				break
			}
			recImg := recImages[i]
			imageContents = append(imageContents, &MediaContent{
				URL:      viewImg.Fullsize,
				Type:     recImg.Image.MimeType,
				FileSize: recImg.Image.Size,
				// Use media:title to supply alternate text or caption
				Title: viewImg.Alt,
			})
		}
		return imageContents
	}

	extractVideo := func(videoView *appbsky.EmbedVideo_View, videoEmbed *appbsky.EmbedVideo) *MediaContent {
		title := ""
		if videoEmbed.Alt != nil {
			title = *videoEmbed.Alt
		}
		return &MediaContent{
			URL:      videoView.Playlist,
			Type:     videoEmbed.Video.MimeType,
			FileSize: videoEmbed.Video.Size,
			Title:    title,
		}
	}

	// Process image embeds: add one media content for each image.
	if p.Post.Embed.EmbedImages_View != nil && rec.Embed.EmbedImages != nil &&
		len(p.Post.Embed.EmbedImages_View.Images) == len(rec.Embed.EmbedImages.Images) {
		contents = append(contents, extractImages(p.Post.Embed.EmbedImages_View.Images, rec.Embed.EmbedImages.Images)...)
	} else if p.Post.Embed.EmbedVideo_View != nil && rec.Embed.EmbedVideo != nil &&
		rec.Embed.EmbedVideo.Video != nil {
		contents = append(contents, extractVideo(p.Post.Embed.EmbedVideo_View, rec.Embed.EmbedVideo))
	} else if p.Post.Embed.EmbedRecordWithMedia_View != nil && rec.Embed.EmbedRecordWithMedia.Media != nil {
		// this is similar to the images or video case but there is a quote tweet
		// so process as if `EmbedImages_View` or `EmbedVideo_View`

		// Check if it's an image embed in the quote post
		if p.Post.Embed.EmbedRecordWithMedia_View.Media.EmbedImages_View != nil &&
			rec.Embed.EmbedRecordWithMedia.Media.EmbedImages != nil {
			contents = append(contents,
				extractImages(
					p.Post.Embed.EmbedRecordWithMedia_View.Media.EmbedImages_View.Images,
					rec.Embed.EmbedRecordWithMedia.Media.EmbedImages.Images,
				)...)
		} else if p.Post.Embed.EmbedRecordWithMedia_View.Media.EmbedVideo_View != nil &&
			rec.Embed.EmbedRecordWithMedia.Media.EmbedVideo != nil &&
			rec.Embed.EmbedRecordWithMedia.Media.EmbedVideo.Video != nil {
			contents = append(contents,
				extractVideo(
					p.Post.Embed.EmbedRecordWithMedia_View.Media.EmbedVideo_View,
					rec.Embed.EmbedRecordWithMedia.Media.EmbedVideo,
				))
		}
	}

	if len(contents) == 0 {
		return nil
	}
	return contents
}

func (srv *Server) WebProfileRSS(c echo.Context) error {
	ctx := c.Request().Context()
	req := c.Request()

	identParam := c.Param("ident")

	// if not a DID, try parsing as a handle and doing a redirect
	if !strings.HasPrefix(identParam, "did:") {
		handle, err := syntax.ParseHandle(identParam)
		if err != nil {
			return echo.NewHTTPError(400, fmt.Sprintf("not a valid handle: %s", identParam))
		}

		// check that public view is Ok, and resolve DID
		pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, handle.String())
		if err != nil {
			return echo.NewHTTPError(404, fmt.Sprintf("account not found: %s", handle))
		}
		for _, label := range pv.Labels {
			if label.Src == pv.Did && label.Val == "!no-unauthenticated" {
				return echo.NewHTTPError(403, fmt.Sprintf("account does not allow public views: %s", handle))
			}
		}
		return c.Redirect(http.StatusFound, fmt.Sprintf("/profile/%s/rss", pv.Did))
	}

	did, err := syntax.ParseDID(identParam)
	if err != nil {
		return echo.NewHTTPError(400, fmt.Sprintf("not a valid DID: %s", identParam))
	}

	// check that public view is Ok
	pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, did.String())
	if err != nil {
		return echo.NewHTTPError(404, fmt.Sprintf("account not found: %s", did))
	}
	for _, label := range pv.Labels {
		if label.Src == pv.Did && label.Val == "!no-unauthenticated" {
			return echo.NewHTTPError(403, fmt.Sprintf("account does not allow public views: %s", did))
		}
	}

	af, err := appbsky.FeedGetAuthorFeed(ctx, srv.xrpcc, did.String(), "", "posts_no_replies", false, 30)
	if err != nil {
		log.Warn("failed to fetch author feed", "did", did, "err", err)
		return err
	}

	posts := []Item{}
	for _, p := range af.Feed {
		// only include author's own posts in RSS
		if p.Post.Author.Did != pv.Did {
			continue
		}
		aturi, err := syntax.ParseATURI(p.Post.Uri)
		if err != nil {
			return err
		}
		rec, ok := p.Post.Record.Val.(*appbsky.FeedPost)
		if !ok {
			continue
		}
		// only top-level posts in RSS (no replies)
		if rec.Reply != nil {
			continue
		}
		pubDate := ""
		createdAt, err := syntax.ParseDatetimeLenient(rec.CreatedAt)
		if nil == err {
			pubDate = createdAt.Time().Format(FullYearRFC822Z)
		}

		mediaContents := getPostMediaContents(p, rec)
		var mediaGroup *MediaGroup = nil
		var mediaContentSingle *MediaContent = nil
		if len(mediaContents) > 1 {
			mediaGroup = &MediaGroup{
				MediaContents: mediaContents,
			}
		} else if len(mediaContents) == 1 {
			mediaContentSingle = mediaContents[0]
		}

		posts = append(posts, Item{
			Link:        fmt.Sprintf("https://%s/profile/%s/post/%s", req.Host, pv.Handle, aturi.RecordKey().String()),
			Description: ExpandPostText(rec),
			PubDate:     pubDate,
			GUID: ItemGUID{
				Value:   aturi.String(),
				IsPerma: false,
			},
			MediaContentSingle: mediaContentSingle,
			MediaGroup:         mediaGroup,
		})
	}

	title := "@" + pv.Handle
	if pv.DisplayName != nil {
		title = title + " - " + *pv.DisplayName
	}
	desc := ""
	if pv.Description != nil {
		desc = *pv.Description
	}
	feed := &rss{
		Version:    "2.0",
		XMLNSMedia: "http://search.yahoo.com/mrss/",
		XMLNSAtom:  "http://www.w3.org/2005/Atom",
		Channel: channel{
			AtomLink: AtomLink{
				Rel:  "self",
				Type: "application/rss+xml",
				Href: fmt.Sprintf("https://%s%s", req.Host, req.RequestURI),
			},
			Title:       title,
			Link:        fmt.Sprintf("https://%s/profile/%s", req.Host, pv.Handle),
			Description: desc,
			Item:        posts,
		},
	}
	return c.XML(http.StatusOK, feed)
}
