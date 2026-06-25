package main

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"io/fs"
	"strconv"

	"golang.org/x/image/draw"
	"golang.org/x/image/font"
	"golang.org/x/image/math/fixed"
)

// CompositeStrip overlays a circular avatar and centered handle text onto the
// per-theme gradient base. Returns PNG bytes. If avatar is nil, a white circle
// is drawn as the fallback (the Bluesky butterfly is rendered by the client
// dialog only; the pass uses an empty circle to keep the server stateless w.r.t.
// brand vector assets).
func CompositeStrip(base image.Image, avatar image.Image, handle string, fontFace font.Face) ([]byte, error) {
	bounds := base.Bounds()
	dst := image.NewRGBA(bounds)
	draw.Draw(dst, bounds, base, bounds.Min, draw.Src)

	cx := bounds.Dx() / 2
	cy := bounds.Dy() / 3
	radius := bounds.Dy() / 4

	mask := newCircleMask(image.Point{X: cx, Y: cy}, radius, bounds)
	if avatar != nil {
		fit := fitToSquare(avatar, radius*2)
		draw.DrawMask(dst, image.Rect(cx-radius, cy-radius, cx+radius, cy+radius),
			fit, image.Point{}, mask, image.Point{X: cx - radius, Y: cy - radius}, draw.Over)
	} else {
		white := &image.Uniform{C: image.White}
		draw.DrawMask(dst, image.Rect(cx-radius, cy-radius, cx+radius, cy+radius),
			white, image.Point{}, mask, image.Point{X: cx - radius, Y: cy - radius}, draw.Over)
	}

	label := "@" + handle
	drawer := &font.Drawer{
		Dst:  dst,
		Src:  &image.Uniform{C: image.White},
		Face: fontFace,
	}
	advance := drawer.MeasureString(label)
	drawer.Dot = fixed.Point26_6{
		X: fixed.I(cx) - advance/2,
		Y: fixed.I(cy + radius + fontFace.Metrics().Ascent.Ceil() + 4),
	}
	drawer.DrawString(label)

	var buf bytes.Buffer
	if err := png.Encode(&buf, dst); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func LoadGradientBase(staticFS fs.FS, theme string, scale int) (image.Image, error) {
	theme = CoerceTheme(theme)
	name := "passes/strip-" + theme + densitySuffix(scale) + ".png"
	f, err := staticFS.Open(name)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	img, _, err := image.Decode(f)
	return img, err
}

func densitySuffix(scale int) string {
	if scale <= 1 {
		return ""
	}
	return "@" + strconv.Itoa(scale) + "x"
}

func newCircleMask(center image.Point, radius int, area image.Rectangle) *image.Alpha {
	mask := image.NewAlpha(area)
	r2 := radius * radius
	for y := area.Min.Y; y < area.Max.Y; y++ {
		dy := y - center.Y
		for x := area.Min.X; x < area.Max.X; x++ {
			dx := x - center.X
			if dx*dx+dy*dy <= r2 {
				mask.SetAlpha(x, y, color.Alpha{255})
			}
		}
	}
	return mask
}

func fitToSquare(src image.Image, size int) image.Image {
	dst := image.NewRGBA(image.Rect(0, 0, size, size))
	draw.CatmullRom.Scale(dst, dst.Bounds(), src, src.Bounds(), draw.Over, nil)
	return dst
}
