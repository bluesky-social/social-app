package bskyweb

import "embed"

//go:embed static/*
var StaticFS embed.FS

//go:embed embedr-static/*
var EmbedrStaticFS embed.FS
