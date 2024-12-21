// Regex from the go implementation
// https://github.com/bluesky-social/indigo/blob/main/atproto/syntax/handle.go#L10
import {decode} from 'punycode'

import {forceLTR} from '#/lib/strings/bidi'

const VALIDATE_REGEX =
  /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/

export function makeValidHandle(str: string): string {
  if (str.length > 20) {
    str = str.slice(0, 20)
  }
  str = str.toLowerCase()
  return str.replace(/^[^a-z0-9]+/g, '').replace(/[^a-z0-9-]/g, '')
}

export function createFullHandle(name: string, domain: string): string {
  name = (name || '').replace(/[.]+$/, '')
  domain = (domain || '').replace(/^[.]+/, '')
  return `${name}.${domain}`
}

export function isInvalidHandle(handle: string): boolean {
  return handle === 'handle.invalid'
}

export function sanitizeHandle(
  asciiHandle: string,
  prefix = '',
  allowUnicode = true,
): string {
  if (isInvalidHandle(asciiHandle)) {
    return '⚠Invalid Handle'
  }
  const handle = allowUnicode
    ? toSanitizedUnicodeHandle(asciiHandle)
    : asciiHandle
  return forceLTR(`${prefix}${handle}`)
}

export interface IsValidHandle {
  handleChars: boolean
  hyphenStartOrEnd: boolean
  frontLength: boolean
  totalLength: boolean
  overall: boolean
}

// More checks from https://github.com/bluesky-social/atproto/blob/main/packages/pds/src/handle/index.ts#L72
export function validateHandle(str: string, userDomain: string): IsValidHandle {
  const fullHandle = createFullHandle(str, userDomain)

  const results = {
    handleChars:
      !str || (VALIDATE_REGEX.test(fullHandle) && !str.includes('.')),
    hyphenStartOrEnd: !str.startsWith('-') && !str.endsWith('-'),
    frontLength: str.length >= 3,
    totalLength: fullHandle.length <= 253,
  }

  return {
    ...results,
    overall: !Object.values(results).includes(false),
  }
}

export function toSanitizedUnicodeHandle(asciiHandle: string): string {
  const sanitizedHandle = asciiHandle
    .split('.')
    .map((label, _index) => {
      // const start = performance.now()
      if (!label.startsWith('xn--')) {
        return label // it's not an IDN label
      }
      const unicodeLabel = decode(label.slice(4))
      if (isHomographAttackPossible(unicodeLabel)) {
        return label
      }
      // const elapsed = performance.now() - start
      // console.log(`sanitizing IDN handle part ${index} took ${elapsed} ms`)
      return unicodeLabel
    })
    .join('.')
  return sanitizedHandle
}

/// Checks if the given unicode domain label may be subject to an
/// homograph attack (https://en.wikipedia.org/wiki/IDN_homograph_attack).
///
/// Applies a policy at least as restrictive as the Mozilla Firefox policy
/// (https://wiki.mozilla.org/IDN_Display_Algorithm).
///
/// This implements the "Single Script" restriction level 2 described in
/// https://www.unicode.org/reports/tr39/#Restriction_Level_Detection
function isHomographAttackPossible(unicodeLabel: string): boolean {
  const DEBUG_ATTACK = true

  if (unicodeLabel !== unicodeLabel.normalize('NFC')) {
    // RFC 5895 requires that unicode domain labels are in NFC form
    // (https://datatracker.ietf.org/doc/html/rfc5895)
    // (https://www.unicode.org/reports/tr46/)
    // If the given domain label is not in NFC form, it shouldn't be trusted.
    if (DEBUG_ATTACK) console.log(`"${unicodeLabel}" is not in NFC form`)
    return true
  }

  // Fast path: the resolved script set contains 0 or 1 scripts.
  let uniqueScript: string | null = null
  // Slower path: the resolved script set contains 2 or more scripts.
  // When `resolvedScriptSet` isn't null, we are in non-unique script mode
  let resolvedScriptSet: Set<string> | null = null

  const iterator = unicodeLabel[Symbol.iterator]()
  let next = iterator.next()

  while (!next.done) {
    const codePoint = next.value.codePointAt(0) as number
    next = iterator.next()
    const sass = UNICODE_MAP.getScriptOrAugmentedScriptSet(codePoint)

    if (typeof sass === 'string') {
      const scriptTag = sass
      if (DEBUG_ATTACK)
        console.log(`analysing codepoint: script is "${scriptTag}"`)
      if (scriptTag === BANNED) {
        if (DEBUG_ATTACK)
          console.log(
            `"${unicodeLabel}" has a banned codepoint 0x${codePoint.toString(
              16,
            )} "${String.fromCodePoint(codePoint)}"`,
          )
        return true // banned codepoint, not trusted
      } else if (scriptTag === MIXING_ALLOWED) {
        // skip this codepoint
      } else if (uniqueScript === null) {
        // select the codepoint's script
        if (DEBUG_ATTACK) console.log(`selecting unique script "${scriptTag}"`)
        uniqueScript = scriptTag
      } else if (uniqueScript === scriptTag) {
        // We are in unique script mode, and the codepoint's script matches
        // continue to next codepoint
      } else {
        if (resolvedScriptSet) {
          // We are in non-unique script mode
          if (resolvedScriptSet.has(scriptTag)) {
            // Go back to unique script mode (fast mode)
            resolvedScriptSet = null
            uniqueScript = scriptTag
            if (DEBUG_ATTACK) console.log('going back to unique script mode')
          } else {
            // the intersection of RSS and {scriptTag} is empty, therefore we are mixing scripts
            if (DEBUG_ATTACK)
              console.log(
                `"${unicodeLabel}" is mixing scripts from cp 0x${codePoint.toString(
                  16,
                )} "${String.fromCodePoint(codePoint)}"`,
              )
            return true
          }
        } else {
          // we are in unique script mode, and `uniqueScript` does not match the codepoint's script
          if (DEBUG_ATTACK)
            console.log(
              `"${unicodeLabel}" is mixing scripts from cp 0x${codePoint.toString(
                16,
              )} "${String.fromCodePoint(codePoint)}"`,
            )
          return true
        }
      }
    } else {
      // Codepoint has multiple scripts, we need to deal with section 5.1.1 rules
      const augmentedScriptSet = sass
      if (DEBUG_ATTACK)
        console.log(
          `analysing codepoint: scripts are ${[...augmentedScriptSet].join(
            ', ',
          )}`,
        )
      if (resolvedScriptSet === null) {
        // switch to non-unique script mode
        resolvedScriptSet = augmentedScriptSet
        if (uniqueScript) {
          if (!resolvedScriptSet.has(uniqueScript)) {
            // The intersection of { uniqueScript } and the codepoint's script set is empty
            // so the Resolved Script Set for the string up to this codepoint is empty,
            // so the string is not Single Script and we don't need to check further.
            if (DEBUG_ATTACK)
              console.log(
                `"${unicodeLabel}" immediately empty RSS from cp 0x${codePoint.toString(
                  16,
                )} "${String.fromCodePoint(codePoint)}"`,
              )
            return true
          }
          resolvedScriptSet.add(uniqueScript)
        }
        uniqueScript = 'NOT_IN_UNIQUE_SCRIPT_MODE' // a value that does not match any script
      } else {
        // already in non-unique script mode
        setIntersection(resolvedScriptSet, augmentedScriptSet)
        if (resolvedScriptSet.size === 0) {
          // The intersection of the prefix codepoints' string sets and this codepoint's script set is empty
          // so the Resolved Script Set for the string up to this codepoint is empty,
          // so the string is not Single Script and we don't need to check further.
          if (DEBUG_ATTACK)
            console.log(
              `"${unicodeLabel}" empty RSS from 0x${codePoint.toString(
                16,
              )} "${String.fromCodePoint(codePoint)}"`,
            )
          return true
        }
      }
    }
  }

  return false // label is trusted
}

/// Computes the set intersection of the two arguments,
/// by modifying the first argument such that it's equal to the result.
/// The second set is left untouched.
function setIntersection(setToModify: Set<string>, other: Set<string>) {
  other.forEach(valueToRemove => {
    setToModify.delete(valueToRemove)
  })
}

const BANNED = 'BANNED'
const MIXING_ALLOWED = 'ALL' // Common (Zyyy) or Inherited (Zinh)
const UNICODE_MAP = (() => {
  // Ranges are in ascending order, where the first codepoint of the range is either
  // - the code point 0, for the first item
  // - the previous' item lastCodePoint + 1, for all other items

  const COMBINING_DIACRITICS_SUBRANGE = 'COMBINING_DIACRITICS_SUBRANGE'
  // Partitions set 1 : Basic Multilingual Plane (0x0000 to 0xFFFF)
  const partitionsBMP = [
    // Data from https://www.unicode.org/Public/16.0.0/ucdxml/
    // where scx is the "scx" value of the <group> tag (when the range matches a group exactly)
    // or the "scx" value of the matched <char> tags when they share the same value,
    // or MIXING_ALLOWED when scx is "Zyyy" or "Zinh" and there are no confusables,
    // or BANNED as needed.
    // Note: "scx" can contain more than 1 script, separated by spaces.
    // Note: you can use https://symbl.cc/en/unicode-table/ as quick reference.
    {lastCodePoint: 0x002c, scx: BANNED}, // control characters, symbols
    {lastCodePoint: 0x002d, scx: MIXING_ALLOWED}, // dash-hyphen
    {lastCodePoint: 0x002f, scx: BANNED}, // dot, forward slash
    {lastCodePoint: 0x0039, scx: MIXING_ALLOWED}, // [0-9]
    {lastCodePoint: 0x0060, scx: BANNED}, // symbols, [A-Z]
    {lastCodePoint: 0x007a, scx: 'Latn'}, // [a-z]
    {lastCodePoint: 0x00bf, scx: BANNED}, // symbols, Latin-1 Supplement control chars & symbols
    {lastCodePoint: 0x024f, scx: 'Latn'}, // Latin-1 Supplement letters, Latin Extended A & B
    {lastCodePoint: 0x02ff, scx: BANNED}, // IPA & SML
    {lastCodePoint: 0x036f, scx: COMBINING_DIACRITICS_SUBRANGE}, // Combining Diacritical Marks
    {lastCodePoint: 0x03ff, scx: 'Grek'},
    {lastCodePoint: 0x052f, scx: 'Cyrl'},
    {lastCodePoint: 0x058f, scx: 'Armn'},
    {lastCodePoint: 0x05ff, scx: 'Hebr'},
    {lastCodePoint: 0x06ff, scx: 'Arab'},
    {lastCodePoint: 0x074f, scx: 'Syrc'},
    {lastCodePoint: 0x077f, scx: 'Arab'},
    // Multiple limited use scripts https://www.unicode.org/reports/tr31/#Table_Limited_Use_Scripts
    {lastCodePoint: 0x086f, scx: BANNED},
    {lastCodePoint: 0x08ff, scx: 'Arab'}, // Arabic Extended A & B
    {lastCodePoint: 0x097f, scx: BANNED}, // limited use script
    {lastCodePoint: 0x09ff, scx: 'Beng'},
    {lastCodePoint: 0x0a7f, scx: 'Guru'},
    {lastCodePoint: 0x0aff, scx: 'Gujr'},
    {lastCodePoint: 0x0b7f, scx: 'Orya'},
    {lastCodePoint: 0x0bff, scx: 'Taml'},
    {lastCodePoint: 0x0c7f, scx: 'Telu'},
    {lastCodePoint: 0x0cff, scx: 'Knda'},
    {lastCodePoint: 0x0d7f, scx: 'Mlym'},
    {lastCodePoint: 0x0dff, scx: 'Sinh'},
    {lastCodePoint: 0x0e7f, scx: 'Thai'},
    {lastCodePoint: 0x0eff, scx: 'Laoo'},
    {lastCodePoint: 0x0fff, scx: 'Tibt'},
    {lastCodePoint: 0x109f, scx: 'Mymr'},
    {lastCodePoint: 0x10ff, scx: 'Geor'},
    {lastCodePoint: 0x11ff, scx: 'Hang'}, // Hangul Jamo
    {lastCodePoint: 0x139f, scx: 'Ethi'},
    {lastCodePoint: 0x13ff, scx: BANNED},
    {lastCodePoint: 0x167f, scx: BANNED},
    {lastCodePoint: 0x169f, scx: 'Ogam'},
    {lastCodePoint: 0x16ff, scx: 'Runr'},
    {lastCodePoint: 0x171f, scx: 'Tglg'},
    {lastCodePoint: 0x173f, scx: 'Hano'},
    {lastCodePoint: 0x175f, scx: 'Buhd'},
    {lastCodePoint: 0x177f, scx: 'Tagb'},
    {lastCodePoint: 0x17ff, scx: 'Khmr'},
    {lastCodePoint: 0x18af, scx: 'Mong'},
    {lastCodePoint: 0x18ff, scx: 'Cans'},
    {lastCodePoint: 0x194f, scx: 'Limb'},
    {lastCodePoint: 0x197f, scx: 'Tale'},
    {lastCodePoint: 0x19df, scx: 'Talu'},
    {lastCodePoint: 0x19ff, scx: 'Khmr'},
    {lastCodePoint: 0x1a1f, scx: 'Bugi'},
    {lastCodePoint: 0x1a1f, scx: 'Lana'}, // Tai Tham
    {lastCodePoint: 0x1aff, scx: MIXING_ALLOWED}, // Combining Diacritical Marks extended
    {lastCodePoint: 0x1b7f, scx: 'Bali'},
    {lastCodePoint: 0x1bbf, scx: 'Sund'},
    {lastCodePoint: 0x1bff, scx: 'Batk'},
    {lastCodePoint: 0x1c4f, scx: 'Lepc'},
    {lastCodePoint: 0x1c7f, scx: 'Olck'},
    {lastCodePoint: 0x1cbf, scx: 'Geor'},
    {lastCodePoint: 0x1ccf, scx: 'Sund'},
    {lastCodePoint: 0x1cff, scx: 'Deva'},
    {lastCodePoint: 0x1dbf, scx: BANNED}, // Phonetic Extensions + supplement (IPA)
    {lastCodePoint: 0x1dff, scx: MIXING_ALLOWED}, // Combining Diacritical Marks Supplement
    {lastCodePoint: 0x1eff, scx: 'Latn'}, // Latin Extended Additional
    {lastCodePoint: 0x1fff, scx: 'Grek'}, // Greek Extended

    // Control characters; Zero Width Space, Joiner, Non-joiner; LTR and RTL marks;
    // Non-Breaking Hyphen; Non-Breaking Narrow Space; invisibles; etc.
    // High potential for abuse so they are banned.
    {lastCodePoint: 0x206f, scx: BANNED}, // General Punctuation
    {lastCodePoint: 0x209f, scx: BANNED}, // Superscripts and Subscripts
    {lastCodePoint: 0x20cf, scx: BANNED}, // Currency Symbols

    {lastCodePoint: 0x20ff, scx: MIXING_ALLOWED}, // blk=Diacriticals_For_Symbols sc=Zinh

    // Multiple groups:
    // Letterlike Symbols; Number Forms; Arrows; Math Operators; Misc. Technical;
    // Control Pictures; OCR; Enclosed Alphanumerics; Box Drawing; etc.
    {lastCodePoint: 0x2bff, scx: BANNED},

    {lastCodePoint: 0x2c5f, scx: 'Glag'},
    {lastCodePoint: 0x2c7f, scx: 'Latn'}, // Latin Extended-C
    {lastCodePoint: 0x2cff, scx: 'Copt'},
    {lastCodePoint: 0x2d2f, scx: 'Geor'},
    {lastCodePoint: 0x2d7f, scx: 'Tfng'},
    {lastCodePoint: 0x2ddf, scx: 'Ethi'},
    {lastCodePoint: 0x2dff, scx: 'Cyrl'}, // Cyrillic Extended-A
    {lastCodePoint: 0x2e7f, scx: BANNED}, // Supplemental Punctuation (contains confusables)

    // Starting from here, ranges are subject to the section 5.1.1 rules (script augmentation)
    {lastCodePoint: 0x2eff, scx: 'Hani'},
    {lastCodePoint: 0x2fdf, scx: 'Hani'},
    {lastCodePoint: 0x2fef, scx: BANNED}, // not defined
    {lastCodePoint: 0x2fff, scx: 'Hani Tang'},
    {lastCodePoint: 0x303f, scx: 'Hani'},
    {lastCodePoint: 0x309f, scx: 'Hira'},
    {lastCodePoint: 0x30ff, scx: 'Kana'},
    {lastCodePoint: 0x312f, scx: 'Bopo'},
    {lastCodePoint: 0x318f, scx: 'Hang'},
    {lastCodePoint: 0x319f, scx: 'Hani'},
    {lastCodePoint: 0x31bf, scx: 'Bopo'},
    {lastCodePoint: 0x31ef, scx: 'Hani'},
    {lastCodePoint: 0x31ff, scx: 'Kana'},
    {lastCodePoint: 0x32ff, scx: 'Hani'},

    // CJK Compatibility group
    {lastCodePoint: 0x3357, scx: 'Kana'}, // Squared Katakana words
    {lastCodePoint: 0x3370, scx: 'Hani'}, // Telegraph symbols for hours
    {lastCodePoint: 0x337a, scx: BANNED}, // Squared Latin abbreviations (confusable)
    {lastCodePoint: 0x337f, scx: 'Hani'}, // Japanese era names, Japanese corporation
    {lastCodePoint: 0x33df, scx: BANNED}, // more latin abbreviations (confusable)
    {lastCodePoint: 0x33fe, scx: 'Hani'}, // Telegraph symbols for days
    {lastCodePoint: 0x33ff, scx: BANNED}, // 1 more latin abbreviation (confusable)

    {lastCodePoint: 0x4dbf, scx: 'Hani'},
    {lastCodePoint: 0x4dff, scx: MIXING_ALLOWED},
    {lastCodePoint: 0x9fff, scx: 'Hani'},
    {lastCodePoint: 0xa4cf, scx: 'Yiii'},
    {lastCodePoint: 0xa4ff, scx: 'Lisu'},
    {lastCodePoint: 0xa63f, scx: 'Vaii'},
    {lastCodePoint: 0xa69f, scx: 'Cyrl'},
    {lastCodePoint: 0xa6ff, scx: 'Bamu'},
    {lastCodePoint: 0xa71f, scx: BANNED}, // Modifier Tone Letters
    {lastCodePoint: 0xa7ff, scx: BANNED}, // Latin Extended-D
    {lastCodePoint: 0xa82f, scx: 'Sylo'},
    {
      lastCodePoint: 0xa83f,
      scx: 'Deva Dogr Gujr Guru Khoj Knda Kthi Mahj Mlym Modi Nand Shrd Sind Takr Tirh Tutg',
    },
    {lastCodePoint: 0xa87f, scx: 'Phag'},
    {lastCodePoint: 0xa8df, scx: 'Saur'},
    {lastCodePoint: 0xa8ff, scx: 'Deva'},
    {lastCodePoint: 0xa92f, scx: 'Kali'},

    // TODO : add the rest
  ]

  // lookup table for codepoints from 0x0300 to 0x036F
  const combiningDiacriticsLookupTable = [
    'Cher Copt Cyrl Grek Latn Perm Sunu Tale', // U+0300 combining grave accent
    'Cher Cyrl Grek Latn Osge Sunu Tale Todr', // U+0301 combining acute accent
    'Cher Cyrl Latn Tfng', // U+0302 combining circumflex accent
    'Glag Latn Sunu Syrc Thai', // U+0303 combining tilde
    'Aghb Cher Copt Cyrl Goth Grek Latn Osge Syrc Tfng Todr', // U+0304 combining macron
    'Copt Elba Glag Goth Kana Latn', // U+0305 combining overline
    'Cyrl Grek Latn Perm', // U+0306 combining breve
    'Copt Dupl Hebr Latn Perm Syrc Tale Tfng Todr', // U+0307 combining dot above
    'Armn Cyrl Dupl Goth Grek Hebr Latn Perm Syrc Tale', // U+0308 combining diaeresis
    'Latn Tfng', // U+0309 combining hook above
    'Dupl Latn Syrc', // U+030A combining ring above
    'Cher Cyrl Latn Osge', // U+030B combining double acute accent
    'Cher Latn Tale', // U+030C combining caron
    'Latn Sunu', // U+030D combining vertical line above
    'Ethi Latn', // U+030E combining double vertical line above
    MIXING_ALLOWED, // U+030F combining double grave accent
    'Latn Sunu', // U+0310 combining candrabindu
    'Cyrl Latn Todr', // U+0311 combining inverted breve
    MIXING_ALLOWED, // U+0312 combining turned comma above
    'Grek Latn Perm Todr', // U+0313 combining comma above
    MIXING_ALLOWED, // U+0314 combining reversed comma above
    MIXING_ALLOWED, // U+0315 combining comma above right
    MIXING_ALLOWED, // U+0316 combining grave accent below
    MIXING_ALLOWED, // U+0317 combining acute accent below
    MIXING_ALLOWED, // U+0318 combining left tack below
    MIXING_ALLOWED, // U+0319 combining right tack below
    MIXING_ALLOWED, // U+031A combining left angle above
    MIXING_ALLOWED, // U+031B combining horn
    MIXING_ALLOWED, // U+031C combining left half ring below
    MIXING_ALLOWED, // U+031D combining up tack below
    MIXING_ALLOWED, // U+031E combining down tack below
    MIXING_ALLOWED, // U+031F combining plus sign below
    'Latn Syrc', // U+0320 combining minus sign below
    MIXING_ALLOWED, // U+0321 combining palatalized hook below
    MIXING_ALLOWED, // U+0322 combining retroflex hook below
    'Cher Dupl Kana Latn Syrc', // U+0323 combining dot below
    'Cher Dupl Latn Syrc', // U+0324 combining diaeresis below
    'Latn Syrc', // U+0325 combining ring below
    MIXING_ALLOWED, // U+0326 combining comma below
    MIXING_ALLOWED, // U+0327 combining cedilla
    MIXING_ALLOWED, // U+0328 combining ogonek
    MIXING_ALLOWED, // U+0329 combining vertical line below
    MIXING_ALLOWED, // U+032A combining bridge below
    MIXING_ALLOWED, // U+032B combining inverted double arch below
    MIXING_ALLOWED, // U+032C combining caron below
    'Latn Sunu Syrc', // U+032D combining circumflex accent below
    'Latn Syrc', // U+032E combining breve below
    MIXING_ALLOWED, // U+032F combining inverted breve below
    'Cher Latn Syrc', // U+0330 combining tilde below
    'Aghb Cher Goth Latn Sunu Thai', // U+0331 combining macron below
    MIXING_ALLOWED, // U+0332 combining low line
    MIXING_ALLOWED, // U+0333 combining double low line
    MIXING_ALLOWED, // U+0334 combining tilde overlay
    MIXING_ALLOWED, // U+0335 combining short stroke overlay
    MIXING_ALLOWED, // U+0336 combining long stroke overlay
    MIXING_ALLOWED, // U+0337 combining short solidus overlay
    MIXING_ALLOWED, // U+0338 combining long solidus overlay
    MIXING_ALLOWED, // U+0339 combining right half ring below
    MIXING_ALLOWED, // U+033A combining inverted bridge below
    MIXING_ALLOWED, // U+033B combining square below
    MIXING_ALLOWED, // U+033C combining seagull below
    MIXING_ALLOWED, // U+033D combining x above
    MIXING_ALLOWED, // U+033E combining vertical tilde
    MIXING_ALLOWED, // U+033F combining double overline
    MIXING_ALLOWED, // U+0340 combining grave tone mark
    MIXING_ALLOWED, // U+0341 combining acute tone mark
    'Grek', // U+0342 combining greek perispomeni
    MIXING_ALLOWED, // U+0343 combining greek koronis
    MIXING_ALLOWED, // U+0344 combining greek dialytika tonos
    'Grek', // U+0345 combining greek ypogegrammeni
    MIXING_ALLOWED, // U+0346 combining bridge above
    MIXING_ALLOWED, // U+0347 combining equals sign below
    MIXING_ALLOWED, // U+0348 combining double vertical line below
    MIXING_ALLOWED, // U+0349 combining left angle below
    MIXING_ALLOWED, // U+034A combining not tilde above
    MIXING_ALLOWED, // U+034B combining homothetic above
    MIXING_ALLOWED, // U+034C combining almost equal to above
    MIXING_ALLOWED, // U+034D combining left right arrow below
    MIXING_ALLOWED, // U+034E combining upwards arrow below
    MIXING_ALLOWED, // U+034F combining grapheme joiner
    MIXING_ALLOWED, // U+0350 combining right arrowhead above
    MIXING_ALLOWED, // U+0351 combining left half ring above
    MIXING_ALLOWED, // U+0352 combining fermata
    MIXING_ALLOWED, // U+0353 combining x below
    MIXING_ALLOWED, // U+0354 combining left arrowhead below
    MIXING_ALLOWED, // U+0355 combining right arrowhead below
    MIXING_ALLOWED, // U+0356 combining right arrowhead and up arrowhead below
    MIXING_ALLOWED, // U+0357 combining right half ring above
    'Latn Osge', // U+0358 combining dot above right
    MIXING_ALLOWED, // U+0359 combining asterisk below
    MIXING_ALLOWED, // U+035A combining double ring below
    MIXING_ALLOWED, // U+035B combining zigzag above
    MIXING_ALLOWED, // U+035C combining double breve below
    MIXING_ALLOWED, // U+035D combining double breve
    'Aghb Latn Todr', // U+035E combining double macron
    MIXING_ALLOWED, // U+035F combining double macron below
    MIXING_ALLOWED, // U+0360 combining double tilde
    MIXING_ALLOWED, // U+0361 combining double inverted breve
    MIXING_ALLOWED, // U+0362 combining double rightwards arrow below
    'Latn', // U+0363 combining latin small letter a
    'Latn', // U+0364 combining latin small letter e
    'Latn', // U+0365 combining latin small letter i
    'Latn', // U+0366 combining latin small letter o
    'Latn', // U+0367 combining latin small letter u
    'Latn', // U+0368 combining latin small letter c
    'Latn', // U+0369 combining latin small letter d
    'Latn', // U+036A combining latin small letter h
    'Latn', // U+036B combining latin small letter m
    'Latn', // U+036C combining latin small letter r
    'Latn', // U+036D combining latin small letter t
    'Latn', // U+036E combining latin small letter v
    'Latn', // U+036F combining latin small letter x
  ]

  // From https://www.unicode.org/reports/tr39/#Mixed_Script_Detection
  const mixedScriptAugmentationsRules: {[key: string]: string[] | undefined} = {
    Hani: ['Hanb', 'Jpan', 'Kore'],
    Hira: ['Jpan'],
    Kana: ['Jpan'],
    Hang: ['Kore'],
    Bopo: ['Hanb'],
  }

  return {
    // "struct of arrays" for increased read performance
    rangesBMP: partitionsBMP.map(({lastCodePoint}) => lastCodePoint),
    rangesTagsBMP: partitionsBMP.map(({scx}) => scx),
    combiningDiacriticsLookupTable,
    mixedScriptAugmentationsRules,

    getScriptOrAugmentedScriptSet(codePoint: number): string | Set<string> {
      if (codePoint <= 0xffff) {
        // code point is in the BMP
        for (let i = 0; i < this.rangesBMP.length; i++) {
          const lastCodePoint = this.rangesBMP[i]
          if (codePoint <= lastCodePoint) {
            // found the codepoint's group
            let tag = this.rangesTagsBMP[i]
            if (tag === COMBINING_DIACRITICS_SUBRANGE) {
              tag = this.combiningDiacriticsLookupTable[codePoint - 0x0300]
            }
            if (tag.includes(' ')) {
              // split tag into scripts, and follow augmentation rules
              const extendedScripts = tag.split(' ')
              const augmentedScriptSet = new Set(extendedScripts)
              extendedScripts.forEach((script: string) => {
                this.mixedScriptAugmentationsRules[script]?.forEach(
                  augmentation => {
                    augmentedScriptSet.add(augmentation)
                  },
                )
              })
              return augmentedScriptSet
            } else {
              const extendedScript = tag
              const augmentations =
                this.mixedScriptAugmentationsRules[extendedScript]
              if (augmentations) {
                // follow augmentation rule
                return new Set([extendedScript, ...augmentations])
              } else {
                // no augmentation needed (usual case)
                return extendedScript
              }
            }
          }
          // continue looking for the codepoint's group
        }
      } else {
        // other planes
        // TODO fill planes
      }
      return BANNED // unknown codepoint
    },
  }
})()
