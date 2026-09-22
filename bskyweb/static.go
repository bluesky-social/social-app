package bskyweb

import "embed"

//go:embed all:static
var StaticFS embed.FS

//go:embed embedr-static/*
var EmbedrStaticFS embed.FS
