import {extractYoutubeMeta} from './extractYoutubeMeta'
export const extractHtmlMeta = (html: string): Record<string, string> => {
  const htmlTitleRegex = /<title>([^<]+)<\/title>/i

  let res: Record<string, string> = {}

  const match = htmlTitleRegex.exec(html)

  if (match) {
    res.title = match[1].trim()
  }

  let metaMatch
  let propMatch
  const metaRe = /<meta[\s]([^>]+)>/gis
  while ((metaMatch = metaRe.exec(html))) {
    let propName
    let propValue
    const propRe = /(name|property|content)="([^"]+)"/gis
    while ((propMatch = propRe.exec(metaMatch[1]))) {
      if (propMatch[1] === 'content') {
        propValue = propMatch[2]
      } else {
        propName = propMatch[2]
      }
    }
    if (!propName || !propValue) {
      continue
    }
    switch (propName?.trim()) {
      case 'title':
      case 'og:title':
      case 'twitter:title':
        res.title = propValue?.trim()
        break
      case 'description':
      case 'og:description':
      case 'twitter:description':
        res.description = propValue?.trim()
        break
      case 'og:image':
      case 'twitter:image':
        res.image = propValue?.trim()
        break
    }
  }

  if (res.title === 'YouTube') {
    // Workaround for Youtube not having a title in the meta tags
    res = extractYoutubeMeta(html)
  }

  return res
}
