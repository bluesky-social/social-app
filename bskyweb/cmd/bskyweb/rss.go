package main

import (
	"fmt"
	"net/http"

	appbsky "github.com/bluesky-social/indigo/api/bsky"
	"github.com/bluesky-social/indigo/atproto/syntax"

	"github.com/labstack/echo/v4"
)

type Item struct {
	Title       string `xml:"title"`
	Link        string `xml:"link"`
	Description string `xml:"description"`
	PubDate     string `xml:"pubDate"`
	GUID        string `xml:"guid"`
}

type rss struct {
	Version     string `xml:"version,attr"`
	Description string `xml:"channel>description"`
	Link        string `xml:"channel>link"`
	Title       string `xml:"channel>title"`

	Item []Item `xml:"channel>item"`
}

func (srv *Server) WebProfileRSS(c echo.Context) error {
	ctx := c.Request().Context()

	handleParam := c.Param("handle")
	handle, err := syntax.ParseHandle(handleParam)
	if err != nil {
		return echo.NewHTTPError(400, fmt.Sprintf("not a valid handle: %s", handleParam))
	}
	handle = handle.Normalize()

	// check that public view is Ok
	pv, err := appbsky.ActorGetProfile(ctx, srv.xrpcc, handle.String())
	if err != nil {
		return echo.NewHTTPError(404, fmt.Sprintf("account not found: %s", handle))
	}
	for _, label := range pv.Labels {
		if label.Src == pv.Did && label.Val == "!no-unauthenticated" {
			return echo.NewHTTPError(403, fmt.Sprintf("account does not allow public views: %s", handle))
		}
	}

	af, err := appbsky.FeedGetAuthorFeed(ctx, srv.xrpcc, handle.String(), "", "", 30)
	if err != nil {
		log.Warn("failed to fetch author feed", "handle", handle, "err", err)
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
		posts = append(posts, Item{
			Title:       "@" + handle.String() + " post",
			Link:        fmt.Sprintf("https://bsky.app/profile/%s/post/%s", handle, aturi.RecordKey().String()),
			Description: rec.Text,
			PubDate:     rec.CreatedAt,
			GUID:        aturi.String(),
		})
	}

	title := "@" + handle.String()
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
		Link:        fmt.Sprintf("https://bsky.app/profile/%s", handle.String()),
		Title:       title,
		Item:        posts,
	}
	return c.XML(http.StatusOK, feed)
}
