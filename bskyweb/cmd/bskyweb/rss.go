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

// Enclosure represents an RSS enclosure element for media (e.g. an image)
type Enclosure struct {
	XMLName xml.Name `xml:"enclosure"`
	URL     string   `xml:"url,attr"`
	Type    string   `xml:"type,attr"`
	Length  int64    `xml:"length,attr"`
}

type ItemGUID struct {
	XMLName xml.Name `xml:"guid"`
	Value   string   `xml:",chardata"`
	IsPerma bool     `xml:"isPermaLink,attr"`
}

// We don't actually populate the title for "posts".
// Some background: https://book.micro.blog/rss-for-microblogs/
type Item struct {
	Title       string `xml:"title,omitempty"`
	Link        string `xml:"link,omitempty"`
	Description string `xml:"description,omitempty"`
	PubDate     string `xml:"pubDate,omitempty"`
	GUID        ItemGUID
	Enclosure   *Enclosure `xml:"enclosure,omitempty"`
}

type rss struct {
	Version     string `xml:"version,attr"`
	Description string `xml:"channel>description,omitempty"`
	Link        string `xml:"channel>link"`
	Title       string `xml:"channel>title"`

	Item []Item `xml:"channel>item"`
}

// getPostEnclosure extracts enclosure information (images or videos) from a post
func getPostEnclosure(p *appbsky.FeedDefs_FeedViewPost, rec *appbsky.FeedPost) *Enclosure {
	// Both p.Post.Embed and rec.Embed must be present
	if p.Post.Embed == nil || rec.Embed == nil {
		return nil
	}

	// Handle image embeds
	if p.Post.Embed.EmbedImages_View != nil && len(p.Post.Embed.EmbedImages_View.Images) > 0 {
		// Make sure the matching rec.Embed structure exists
		if rec.Embed.EmbedImages != nil && len(rec.Embed.EmbedImages.Images) > 0 {
			return &Enclosure{
				URL:    p.Post.Embed.EmbedImages_View.Images[0].Fullsize,
				Type:   rec.Embed.EmbedImages.Images[0].Image.MimeType,
				Length: rec.Embed.EmbedImages.Images[0].Image.Size,
			}
		}
	} else if p.Post.Embed.EmbedVideo_View != nil {
		if rec.Embed.EmbedVideo != nil && rec.Embed.EmbedVideo.Video != nil {
			return &Enclosure{
				URL:    p.Post.Embed.EmbedVideo_View.Playlist,
				Type:   rec.Embed.EmbedVideo.Video.MimeType,
				Length: rec.Embed.EmbedVideo.Video.Size,
			}
		}
	}

	// No supported embed found
	return nil
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

		posts = append(posts, Item{
			Link:        fmt.Sprintf("https://%s/profile/%s/post/%s", req.Host, pv.Handle, aturi.RecordKey().String()),
			Description: ExpandPostText(rec),
			PubDate:     pubDate,
			GUID: ItemGUID{
				Value:   aturi.String(),
				IsPerma: false,
			},
			Enclosure: getPostEnclosure(p, rec),
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
		Version:     "2.0",
		Description: desc,
		Link:        fmt.Sprintf("https://%s/profile/%s", req.Host, pv.Handle),
		Title:       title,
		Item:        posts,
	}
	return c.XML(http.StatusOK, feed)
}
