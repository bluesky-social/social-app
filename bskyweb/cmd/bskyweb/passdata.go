package main

import (
	"encoding/json"
	"strings"
	"time"
)

var themeBgRGB = map[string]string{
	"dawn":  "rgb(255, 109, 190)",
	"day":   "rgb(117, 175, 255)",
	"dusk":  "rgb(177, 90, 162)",
	"night": "rgb(0, 21, 51)",
}

func CoerceTheme(s string) string {
	switch strings.ToLower(s) {
	case "dawn", "day", "dusk", "night":
		return strings.ToLower(s)
	default:
		return "day"
	}
}

func ThemeBackgroundRGB(theme string) string {
	if v, ok := themeBgRGB[theme]; ok {
		return v
	}
	return themeBgRGB["day"]
}

type passField struct {
	Key       string `json:"key"`
	Label     string `json:"label"`
	Value     string `json:"value"`
	DateStyle string `json:"dateStyle,omitempty"`
}

// passFields is the iOS <= 26 storeCard/generic layout: header, primary,
// secondary, back.
type passFields struct {
	HeaderFields    []passField `json:"headerFields"`
	PrimaryFields   []passField `json:"primaryFields"`
	SecondaryFields []passField `json:"secondaryFields"`
	BackFields      []passField `json:"backFields"`
}

// posterFields is the iOS 27 layout used by Pass Designer. Adds auxiliary
// and footer field slots that the classic layout does not have.
type posterFields struct {
	HeaderFields    []passField `json:"headerFields"`
	PrimaryFields   []passField `json:"primaryFields"`
	SecondaryFields []passField `json:"secondaryFields"`
	AuxiliaryFields []passField `json:"auxiliaryFields"`
	FooterFields    []passField `json:"footerFields"`
	BackFields      []passField `json:"backFields"`
}

type barcode struct {
	Format          string `json:"format"`
	Message         string `json:"message"`
	MessageEncoding string `json:"messageEncoding"`
	AltText         string `json:"altText"`
}

type pkPass struct {
	FormatVersion           int          `json:"formatVersion"`
	PassTypeIdentifier      string       `json:"passTypeIdentifier"`
	SerialNumber            string       `json:"serialNumber"`
	TeamIdentifier          string       `json:"teamIdentifier"`
	OrganizationName        string       `json:"organizationName"`
	Description             string       `json:"description"`
	LogoText                string       `json:"logoText"`
	ForegroundColor         string       `json:"foregroundColor"`
	LabelColor              string       `json:"labelColor"`
	BackgroundColor         string       `json:"backgroundColor"`
	Generic                 passFields   `json:"generic"`
	PosterGeneric           posterFields `json:"posterGeneric"`
	SuppressHeaderDarkening bool         `json:"suppressHeaderDarkening"`
	UseAutomaticColors      bool         `json:"useAutomaticColors"`
	Barcodes                []barcode    `json:"barcodes"`
}

const passTypeIdentifier = "pass.xyz.blueskyweb.app"

// BuildPassJSON builds the pkpass JSON for both the iOS <= 26 fallback layout
// (`generic` block) and the iOS 27 layout (`posterGeneric` block). The two
// blocks describe the same fields in the layouts each iOS version expects:
// the user sees the poster layout on iOS 27+ and the legacy layout below that.
//
// pdsHost is the hostname extracted from the user's DID document
// serviceEndpoint (e.g. "suillus.us-west.host.bsky.network").
// createdAt is the user's profile record creation time, used as a rough
// stand-in for account creation.
func BuildPassJSON(did, handle, displayName, pdsHost, theme, teamID string, createdAt time.Time) ([]byte, error) {
	theme = CoerceTheme(theme)
	profileURL := "https://bsky.app/profile/" + handle
	atHandle := "@" + handle
	memberName := displayName
	if memberName == "" {
		memberName = atHandle
	}
	if pdsHost == "" {
		pdsHost = "bsky.social"
	}
	createdAtISO := ""
	if !createdAt.IsZero() {
		createdAtISO = createdAt.UTC().Format(time.RFC3339)
	}

	// avoid an unused variable when displayName is empty - we keep memberName
	// computed for a possible future design, but the current layout uses
	// handle directly.
	_ = memberName

	pdsField := passField{Key: "pds", Label: "PDS", Value: pdsHost}
	handleField := passField{Key: "handle", Label: "Handle", Value: handle}
	sinceField := passField{Key: "since", Label: "Member Since", Value: createdAtISO, DateStyle: "PKDateStyleShort"}
	backFields := []passField{
		{Key: "about", Label: "About", Value: "Scan the QR code to view this Bluesky profile."},
		{Key: "url", Label: "Profile URL", Value: profileURL},
	}

	p := pkPass{
		FormatVersion:      1,
		PassTypeIdentifier: passTypeIdentifier,
		SerialNumber:       did + "-" + theme + "-v1",
		TeamIdentifier:     teamID,
		OrganizationName:   "Bluesky",
		Description:        "Bluesky profile - " + atHandle,
		// logoText omitted - the logo image already carries the "Bluesky"
		// wordmark; setting both would render the brand name twice.
		LogoText:        "",
		ForegroundColor: "rgb(255, 255, 255)",
		LabelColor:      "rgb(255, 255, 255)",
		BackgroundColor: ThemeBackgroundRGB(theme),
		// iOS <= 26 fallback: handle as primary, since as secondary (stacked).
		Generic: passFields{
			HeaderFields:    []passField{pdsField},
			PrimaryFields:   []passField{handleField},
			SecondaryFields: []passField{sinceField},
			BackFields:      backFields,
		},
		// iOS 27+: handle and since side-by-side in primaryFields, matching
		// what Pass Designer exports.
		PosterGeneric: posterFields{
			HeaderFields:    []passField{pdsField},
			PrimaryFields:   []passField{handleField, sinceField},
			SecondaryFields: []passField{},
			AuxiliaryFields: []passField{},
			FooterFields:    []passField{},
			BackFields:      backFields,
		},
		SuppressHeaderDarkening: false,
		UseAutomaticColors:      false,
		Barcodes: []barcode{{
			Format:          "PKBarcodeFormatQR",
			Message:         profileURL,
			MessageEncoding: "iso-8859-1",
			AltText:         handle,
		}},
	}
	return json.MarshalIndent(p, "", "  ")
}
