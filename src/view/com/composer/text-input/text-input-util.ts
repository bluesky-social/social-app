export function addLinkCardIfNecessary({
  uri,
  newText,
  cursorLocation,
  mayBePaste,
  onNewLink,
  prevAddedLinks,
  byteEnd,
}: {
  uri: string
  newText: string
  cursorLocation: number
  mayBePaste: boolean
  onNewLink: (uri: string) => void
  prevAddedLinks: Set<string>
  byteEnd: number
}) {
  const utf16Index = utf8IndexToUtf16Index(newText, byteEnd)
  // Because we always trim the whitespace at the end of the text
  newText = newText + ' '

  let toAdd = 2

  const backOne = newText.charAt(cursorLocation - 1)
  const backTwo = newText.charAt(cursorLocation - 2)

  if (backOne === ' ' && !/[.!?]/.test(backTwo)) {
    toAdd = 1
  }

  console.log({
    utf8Index: byteEnd,
    utf16Index: utf16Index,
  })

  if (!mayBePaste && utf16Index + toAdd !== cursorLocation) {
    return
  }

  // Checking previouslyAddedLinks keeps a card from getting added over and over i.e.
  // Link card added -> Remove link card -> Press back space -> Press space -> Link card added -> and so on

  // We use the isValidUrl regex below because we don't want to add embeds only if the url is valid, i.e.
  // http://facebook is a valid url, but that doesn't mean we want to embed it. We should only embed if
  // the url is a valid url _and_ domain. new URL() won't work for this check.
  const shouldCheck = !prevAddedLinks.has(uri) && isValidUrlAndDomain(uri)

  if (shouldCheck) {
    onNewLink(uri)
    prevAddedLinks.add(uri)
  }
}

// https://stackoverflow.com/questions/8667070/javascript-regular-expression-to-validate-url
// question credit Muhammad Imran Tariq https://stackoverflow.com/users/420613/muhammad-imran-tariq
// answer credit Christian David https://stackoverflow.com/users/967956/christian-david
function isValidUrlAndDomain(value: string) {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
    value,
  )
}

// https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
// question credit https://stackoverflow.com/users/169992/lance
// answer credit bobince https://stackoverflow.com/users/18936/bobince
function escapeRegex(literal: string) {
  return literal.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
}

export function findIndexInText(term: string, text: string) {
  // This should find patterns like:
  // HELLO SENTENCE http://google.com/ HELLO
  // HELLO SENTENCE http://google.com HELLO
  // http://google.com/ HELLO.
  // http://google.com/.
  const pattern = new RegExp(`\\b(${escapeRegex(term)})(?![/\\w])`, 'i')
  const match = pattern.exec(text)
  return match ? match.index : -1
}

function utf8IndexToUtf16Index(inStr: string, utf8Index: number) {
  let utf16Index = 0
  let bytesCounted = 0

  for (let i = 0; i < inStr.length; i++) {
    // Check the current Unicode code point size in UTF-8
    const codePoint = inStr.codePointAt(i)

    if (!codePoint) return -1

    // Add the UTF-8 byte length of this code point
    if (codePoint <= 0x7f) {
      bytesCounted += 1 // 1 byte in UTF-8
    } else if (codePoint <= 0x7ff) {
      bytesCounted += 2 // 2 bytes in UTF-8
    } else if (codePoint <= 0xffff) {
      bytesCounted += 3 // 3 bytes in UTF-8
    } else {
      bytesCounted += 4 // 4 bytes in UTF-8
      i++ // Move past the high surrogate
    }

    // Update UTF-16 index and break when the UTF-8 index is reached or exceeded
    if (bytesCounted > utf8Index) {
      break
    }

    utf16Index = i + 1
  }

  return utf16Index
}
