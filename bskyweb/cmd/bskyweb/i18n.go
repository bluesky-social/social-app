package main

import (
	"github.com/labstack/echo/v4"
	"golang.org/x/text/language"
)

// this constant determines the supported languages. the first in the array is used as a fallback.
//
// NOTE: intentionally using 2-char codes here instead of the named constants
// https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
var langMatcher = language.NewMatcher([]language.Tag{
	language.MustParse("en"), // English: default/fallback
	language.MustParse("ja"), // Japanese
	language.MustParse("pt"), // Portuguese
	language.MustParse("de"), // German
	language.MustParse("hi"), // Hindi
})

// cookie value should have same syntax as an Accept-Language HTTP header
var langCookieName = "lang"

// returns an ISO 639 2-char language code to use for this request.
//
// tries a cookie first, then Accept-Language HTTP header, then a default
func determineLangCode(c echo.Context) string {

	cookieVal := ""
	cookie, err := c.Cookie(langCookieName)
	if err != nil {
		c.Logger().Warn(err)
	} else {
		cookieVal = cookie.Value
	}

	hdr := c.Request().Header.Get("Accept-Language")
	langTag, _ := language.MatchStrings(langMatcher, cookieVal, hdr)
	base, _ := langTag.Base()
	return base.String()
}
