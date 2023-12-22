package main

import (
	"encoding/xml"
	"fmt"
	"net/http"
	"time"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
	"github.com/bluesky-social/indigo/atproto/syntax"

	"github.com/labstack/echo/v4"
)

type ItemGUID struct {
	XMLName xml.Name `xml:"guid"`
	Value   string   `xml:",chardata"`
	IsPerma bool     `xml:"isPermalink,attr"`
}

// We don't actually populate the title for "posts".
// Some background: https://book.micro.blog/rss-for-microblogs/
type Item struct {
	Title       string `xml:"title,omitempty"`
	Link        string `xml:"link,omitempty"`
	Description string `xml:"description,omitempty"`
	PubDate     string `xml:"pubDate,omitempty"`
	GUID        ItemGUID
}

type rss struct {
	Version     string `xml:"version,attr"`
	Description string `xml:"channel>description,omitempty"`
	Link        string `xml:"channel>link"`
	Title       string `xml:"channel>title"`

	Item []Item `xml:"channel>item"`
}

func (srv *Server) WebProfileRSS(c echo.Context) error {
	ctx := c.Request().Context()

	didParam := c.Param("did")
	did, err := syntax.ParseDID(didParam)
	if err != nil {
		return echo.NewHTTPError(400, fmt.Sprintf("not a valid DID: %s", didParam))
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

	af, err := appbsky.FeedGetAuthorFeed(ctx, srv.xrpcc, did.String(), "", "", 30)
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
		rec := p.Post.Record.Val.(*appbsky.FeedPost)
		// only top-level posts in RSS (no replies)
		if rec.Reply != nil {
			continue
		}
		pubDate := ""
		createdAt, err := syntax.ParseDatetimeLenient(rec.CreatedAt)
		if nil == err {
			pubDate = createdAt.Time().Format(time.RFC822Z)
		}
		posts = append(posts, Item{
			Link:        fmt.Sprintf("https://bsky.app/profile/%s/post/%s", pv.Handle, aturi.RecordKey().String()),
			Description: rec.Text,
			PubDate:     pubDate,
			GUID: ItemGUID{
				Value:   aturi.String(),
				IsPerma: false,
			},
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
		Link:        fmt.Sprintf("https://bsky.app/profile/%s", pv.Handle),
		Title:       title,
		Item:        posts,
	}
	return c.XML(http.StatusOK, feed)
}
