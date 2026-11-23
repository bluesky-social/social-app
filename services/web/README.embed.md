
## oEmbed

<https://oembed.com/>

* URL scheme: `https://bsky.app/profile/*/post/*`
* API endpoint: `https://embed.bsky.app/oembed`

Request params:

- `url` (required): support both AT-URI and bsky.app URL
- `maxwidth` (optional): [220..550], 325 is default
- `maxheight` (not supported!)
- `format` (optional): only `json` supported

Response format:

- `type` (required): "rich"
- `version` (required): "1.0"
- `author_name` (optional): display name
- `author_url` (optional): profile URL
- `provider_name` (optional): "Bluesky Social"
- `provider_url` (optional): "https://bsky.app"
- `cache_age` (optional, integer seconds): 86400 (24 hours) (?)
- `width` (required): ?
- `height` (required): ?

Not used:

- title (optional): A text title, describing the resource.
- thumbnail_url (optional): A URL to a thumbnail image representing the resource. The thumbnail must respect any maxwidth and maxheight parameters. If this parameter is present, thumbnail_width and thumbnail_height must also be present.
- thumbnail_width (optional): The width of the optional thumbnail. If this parameter is present, thumbnail_url and thumbnail_height must also be present.
- thumbnail_height (optional): The height of the optional thumbnail. If this parameter is present, thumbnail_url and thumbnail_width must also be present.

Only `json` is supported; `xml` is a 501.

```
<link rel="alternate" type="application/json+oembed" href="https://embed.bsky.app/oembed?format=json&url=https://bsky.app/profile/bnewbold.net/post/abc123" />
```


## iframe URL

`https://embed.bsky.app/embed/<did>/app.bsky.feed.post/<rkey>`
`https://embed.bsky.app/static/embed.js`

```
<blockquote class="bluesky-post" data-lang="en" data-align="center">
  <p lang="en" dir="ltr">{{ post-text }}</p>
  &mdash; US Department of the Interior (@Interior) <a href="https://twitter.com/Interior/status/463440424141459456?ref_src=twsrc%5Etfw">May 5, 2014</a>
</blockquote>
```
