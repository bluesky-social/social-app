import {DOMParser} from '@xmldom/xmldom'

import {Readability} from '@mozilla/readability'

// Can't use import because JSDomParser is not exported by readability
// This lets us get around that.
const JSDomParser = require('@mozilla/readability/JSDOMParser')

// This has been determined empirically. Anything less than that is typically
// bad and we should default to the HTML view.
// We would use Readability isProbablyReaderable() but unfortunately it doesn't
// run in ReactNative because of our DOM with limited functionality.
const MINIMUM_LENGTH_FOR_VALID_ARTICLE = 3000

const PARSER_PARAMS = {
  locator: {},
  errorHandler: {
    warning: () => {},
    error: () => {},
    fatalError: () => {},
  },
}

const isContentReaderable = (
  content: string | undefined,
  tolerance: number,
) => {
  if (content === undefined || tolerance <= 0) return false
  return content.length >= MINIMUM_LENGTH_FOR_VALID_ARTICLE / tolerance
}

// `tolerance` is a number between 0 and infinity, the higher, the more
// documents will be accepted as valid. Use 1 for default tolerance.
export const extractReadableDocFromHTML = (
  rawHtml: string,
  url: string,
  tolerance: number = 1,
): Document | null => {
  // We're using the robust xmldom parser first, to cleanup the HTML we
  // received, because JSDomParser only works with well-formed HTML.
  const extractedDom = new DOMParser(PARSER_PARAMS).parseFromString(
    rawHtml,
    'text/html',
  )

  // Removing script tags as they cause problems with JSDomParser
  var scripts = extractedDom.getElementsByTagName('script')
  // We go in reverse order because we remove node and this ensure we don't
  // affect order.
  for (let i = scripts.length - 1; i >= 0; i--) {
    const node = scripts.item(i)
    if (node && node.parentNode) node.parentNode.removeChild(node)
  }

  // Normalize the DOM
  extractedDom.normalize()
  const cleanHtml = extractedDom.toString()
  const document = new JSDomParser().parse(cleanHtml, url)
  const article = new Readability(document, {nbTopCandidates: 1}).parse()
  if (!isContentReaderable(article?.content, tolerance)) {
    console.log('Content too short for reader view: ', article?.content.length)
    return null
  }
  if (article) {
    const finalDocument = new DOMParser(PARSER_PARAMS).parseFromString(
      article.content,
      'text/html',
    )
    return finalDocument
  }
  return null
}

export const extractReadableDocFromUrl = async (
  url: string,
): Promise<Document | null> => {
  const response = await fetch(url)
  // TODO: Check that response contains html
  const rawHtml = await response.text()

  let ResultVal
  try {
    ResultVal = extractReadableDocFromHTML(rawHtml, url)
  } catch (err) {
    console.log('extractReadableDocFromUrl url: ', url, err)
    ResultVal = null
  }
  return ResultVal
}
