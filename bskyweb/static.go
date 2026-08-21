package bskyweb

import "embed"

// `all:` disables the default exclusion of files/dirs beginning with `_` or `.`,
// which is needed because Metro emits chunks like `__common-...js` and
// `__expo-metro-runtime-...js`.
//go:embed all:static
var StaticFS embed.FS

//go:embed embedr-static/*
var EmbedrStaticFS embed.FS
