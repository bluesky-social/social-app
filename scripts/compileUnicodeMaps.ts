// To run:
// npx ts-node --project ../tsconfig.e2e.json compileUnicodeMaps.ts

const fs = require('node:fs')
const readline = require('node:readline')

function readIdentifierStatusFileAndBuildAllowedList(): number[] {
  const identifierStatusTxt = fs.readFileSync(
    './unicode/Public/security/16.0.0/IdentifierStatus.txt',
    {encoding: 'utf-8'},
  ) as string

  const lineRegex = /^(?<start>[a-zA-Z0-9]{4,5})(?:..(?<end>[a-zA-Z0-9]{4,5}))?/

  let allowedCodepoints = []

  function isExtraBanned(codepoint: number): boolean {
    for (const bannedRange of EXTRA_BANNED_CODEPOINT_RANGES) {
      if (bannedRange.start <= codepoint && codepoint <= bannedRange.end) {
        return true
      }
    }
    return false
  }

  for (let line of identifierStatusTxt.split('\n')) {
    if (line.startsWith('#')) {
      continue
    }
    const match = lineRegex.exec(line)
    if (match) {
      const start = Number.parseInt(match.groups!.start, 16)
      let end
      if (match.groups?.end) {
        end = Number.parseInt(match.groups.end, 16)
      } else {
        end = start
      }
      for (let codepoint = start; codepoint <= end; codepoint++) {
        if (!isExtraBanned(codepoint)) {
          allowedCodepoints.push(codepoint)
        }
      }
    }
  }

  for (let extraAllowed of EXTRA_ALLOWED_CODEPOINTS) {
    if (!allowedCodepoints.includes(extraAllowed)) {
      allowedCodepoints.unshift(extraAllowed)
    }
  }
  allowedCodepoints.sort((a, b) => a - b)

  return allowedCodepoints
}

type UCDTable = Map<number, {scx: string; isUpper: boolean}>

async function readUcdFileAndBuildTable(): Promise<UCDTable> {
  const stream = fs.createReadStream(
    './unicode/Public/16.0.0/ucd.all.flat.xml',
    {encoding: 'utf-8'},
  )
  const linesInterface = readline.createInterface({input: stream})

  const charRegex = /^ *<char .*cp="(?<cp>[A-Z0-9]{4,5})".* scx="(?<scx>[^"]+)"/

  const table: UCDTable = new Map()

  for await (const line of linesInterface) {
    const match = charRegex.exec(line)
    if (match) {
      const codepoint = Number.parseInt(match.groups!.cp, 16)
      const scx = match.groups!.scx
      const isUpper = line.includes('Upper="Y"')
      table.set(codepoint, {scx, isUpper})
    } else if (line.includes('<char')) {
      // the line seems to have a <char> tag, but it could not be parsed
      if (line.includes('first-cp="100000" last-cp="10FFFD"')) {
        // this specific line can be safely be ignored
      } else {
        const hasSCX = line.includes('scx="')
        const extra = hasSCX ? ' and scx property' : ''
        throw new Error(
          `Could not parse line with <char> tag${extra}:\n${line}`,
        )
      }
    }
  }

  return table
}

// Unicode code point notation
function toUCPN(codepoint: number): string {
  return `U+${codepoint.toString(16).padStart(4, '0')}`
}

function toHex(codepoint: number): string {
  return `0x${codepoint.toString(16).padStart(4, '0')}`
}

function setEquality(a: Set<any>, b: Set<any>): boolean {
  if (a.size !== b.size) return false
  for (let x of a.values()) {
    if (!b.has(x)) return false
  }
  return true
}

function setIntersection<T>(a: Set<T>, b: Set<T>): Set<T> {
  const output: Set<T> = new Set()
  for (let x of a.values()) {
    if (b.has(x)) {
      output.add(x)
    }
  }
  return output
}

// Sanity check, verifying that we are parsing IdentifierStatus.txt properly.
// Source: https://www.unicode.org/reports/tr39/#Identifier_Status_and_Type
// This checking is not exhaustive.
function checkCodepointScriptSetAllowed(
  codepoint: number,
  codepointScripts: Set<string>,
) {
  const hasLimitedUseScript =
    setIntersection(codepointScripts, LIMITED_USE_SCRIPTS).size > 0
  const hasRecommendedScriptBesidesCommonInherited =
    setIntersection(
      codepointScripts,
      RECOMMENDED_SCRIPTS_BESIDES_COMMON_INHERITED,
    ).size > 0

  const isLimitedUse =
    hasLimitedUseScript && !hasRecommendedScriptBesidesCommonInherited
  if (isLimitedUse)
    throw new Error(
      `The ${toUCPN(codepoint)} codepoint's Identifier_Type is "Limited_Use"`,
    )

  const hasExclusionScript =
    setIntersection(codepointScripts, EXCLUDED_SCRIPTS).size > 0

  const isExclusion =
    hasExclusionScript &&
    !hasLimitedUseScript &&
    !hasRecommendedScriptBesidesCommonInherited
  if (isExclusion)
    throw new Error(
      `The ${toUCPN(codepoint)} codepoint's Identifier_Type is "Exclusion"`,
    )
}

// start and end are inclusive, i.e. the range is [start..=end]
type Partition = {start: number; end: number; scripts: Set<string> | null}

function buildPartitionList(
  sortedCodepoints: number[],
  table: UCDTable,
): Partition[] {
  // null => current range represents a range of codepoints without allowed scripts (i.e. a deny range)
  // Set(...) => current range represents a contiguous range of codepoints with the same script set (i.e. an allow range)
  let rangeScriptSet: Set<string> | null = null
  let rangeStartCodepoint = 0
  // When the currentRangeScriptSet is not null (an allow partition is being determined),
  // allowRangeLastCodepoint represents the current end of the allow range.
  let allowRangeLastCodepoint = 0
  // the previous ranges that we committed to, forming a partition of the space [0..<codepoint]
  const partitions: Partition[] = []

  function addPartition(
    start: number,
    end: number,
    scripts: Set<string> | null,
  ) {
    if (start > end) {
      throw new Error(
        'The start codepoint must be smaller or equal to the end codepoint',
      )
    }
    if (partitions.length > 0) {
      if (partitions[partitions.length - 1].end + 1 !== start) {
        throw new Error('The partitions must be contiguous')
      }
    }
    partitions.push({start, end, scripts})
  }

  for (const codepoint of sortedCodepoints) {
    const codepointInfo = table.get(codepoint)
    if (!codepointInfo) {
      throw new Error(
        `The codepoint ${toUCPN(codepoint)} does not have UCD data`,
      )
    }
    const codepointScriptSet = new Set(codepointInfo.scx.split(' '))
    checkCodepointScriptSetAllowed(codepoint, codepointScriptSet)
    if (rangeScriptSet === null) {
      // previous range is a deny range, we close it
      partitions.push({
        start: rangeStartCodepoint,
        end: codepoint - 1,
        scripts: null,
      })
      // start a new range
      rangeStartCodepoint = codepoint
      allowRangeLastCodepoint = codepoint
      rangeScriptSet = codepointScriptSet
    } else {
      // previous range is an allow range
      if (setEquality(codepointScriptSet, rangeScriptSet)) {
        if (allowRangeLastCodepoint + 1 === codepoint) {
          // the codepoint is right after the current allow range and has the same allow set,
          // we can extend this range by one to include the codepoint
          allowRangeLastCodepoint = codepoint
        } else {
          // The current range is not contiguous with the codepoint,
          // we have to close the current range, add a deny range, and open a new range for the codepoint.
          // Close current range
          addPartition(
            rangeStartCodepoint,
            allowRangeLastCodepoint,
            rangeScriptSet,
          )
          // Add deny range
          addPartition(allowRangeLastCodepoint + 1, codepoint - 1, null)
          // Open new range (with the same script set)
          rangeStartCodepoint = codepoint
          allowRangeLastCodepoint = codepoint
        }
      } else {
        // Script sets are not equal
        if (allowRangeLastCodepoint + 1 === codepoint) {
          // The codepoint is right after the current allow range, so there is no deny range to add.
          // We need to close the current allow range, and open a new one for the codepoint.
          // Close current range
          addPartition(
            rangeStartCodepoint,
            allowRangeLastCodepoint,
            rangeScriptSet,
          )
          // Open new range (with a different script set)
          rangeStartCodepoint = codepoint
          allowRangeLastCodepoint = codepoint
          rangeScriptSet = codepointScriptSet
        } else {
          // The codepoint is not after the current allow range, so there is a deny range to add.
          // Close current range
          addPartition(
            rangeStartCodepoint,
            allowRangeLastCodepoint,
            rangeScriptSet,
          )
          // Add deny range
          addPartition(allowRangeLastCodepoint + 1, codepoint - 1, null)
          // Open new range (with a different script set)
          rangeStartCodepoint = codepoint
          allowRangeLastCodepoint = codepoint
          rangeScriptSet = codepointScriptSet
        }
      }
    }
  }

  if (rangeScriptSet !== null) {
    // Close the current allow range, there are no more allowed codepoints
    partitions.push({
      start: rangeStartCodepoint,
      end: allowRangeLastCodepoint,
      scripts: rangeScriptSet,
    })
  }

  return partitions
}

function writePartitionsToTypescriptFile(partitions: Partition[]) {
  const fd = fs.openSync('./unicode/unicodeMap.ts', 'w')
  fs.appendFileSync(
    fd,
    `// Autogenerated by compileUnicodeMaps.ts
// Do not modify, rerun the script instead.

const BANNED = 'BANNED'
const MIXING_ALLOWED = 'ALL'

// eslint-disable-next-line @typescript-eslint/no-unused-vars 
const _PARTITIONS_BY_SCRIPT = [
`,
  )
  for (const partition of partitions) {
    let literal
    if (partition.scripts) {
      if (
        partition.scripts.size === 1 &&
        (partition.scripts.has('Zyyy') || partition.scripts.has('Zinh'))
      ) {
        literal = `MIXING_ALLOWED`
      } else {
        literal = `'${[...partition.scripts].join(' ')}'`
      }
    } else {
      literal = `BANNED`
    }
    const line = `    {lastCodePoint: ${toHex(
      partition.end,
    )}, scripts: ${literal}},\n`
    fs.appendFileSync(fd, line)
  }

  fs.appendFileSync(fd, ']\n')
  fs.closeSync(fd)
}

;(async function main() {
  console.log('Reading UCD file...')
  const ucdTable = await readUcdFileAndBuildTable()
  console.log(`Found ${ucdTable.size} total codepoints`)

  const allowedCodepoints = readIdentifierStatusFileAndBuildAllowedList()
  // console.log(allowedCodepoints.map(cp => toHex(cp)))
  console.log(`Found ${allowedCodepoints.length} allowed identifier codepoints`)

  const partitions = buildPartitionList(allowedCodepoints, ucdTable)
  // console.log(partitions.map(({start, end, scripts}) => ({ start: toHex(start), end: toHex(end), scripts })))
  console.log(`Computed ${partitions.length} partitions`)

  writePartitionsToTypescriptFile(partitions)
  console.log('Wrote output typescript file')
})()

// Codepoints that we wish to allow regardless of what's in IdentifierStatus.txt
const EXTRA_ALLOWED_CODEPOINTS = [
  0x002d, // ASCII Hyphen-Minus, because RFC 1035 allows it
]

// Codepoint ranges that we wish to ban regardless of what's in IdentifierStatus.txt
const EXTRA_BANNED_CODEPOINT_RANGES = [
  // RFC 1035 Rules:
  {start: 0x0027, end: 0x0027}, // ASCII Apostrophe
  {start: 0x002e, end: 0x002e}, // ASCII Dot (RFC 1035 does not allow it __inside labels__)
  {start: 0x003a, end: 0x0060}, // ASCII symbols, uppercase latin letters, underscore, ...
  // add more banned ranges here as needed
]

// https://www.unicode.org/reports/tr31/#Table_Candidate_Characters_for_Exclusion_from_Identifiers
const EXCLUDED_SCRIPTS = new Set([
  'Aghb', // Caucasian Albanian
  'Aghb', // Caucasian Albanian
  'Ahom', // Ahom
  'Armi', // Imperial Aramaic
  'Avst', // Avestan
  'Bass', // Bassa Vah
  'Bhks', // Bhaiksuki
  'Brah', // Brahmi
  'Bugi', // Buginese
  'Buhd', // Buhid
  'Cari', // Carian
  'Chrs', // Chorasmian
  'Copt', // Coptic
  'Cpmn', // Cypro-Minoan
  'Cprt', // Cypriot
  'Diak', // Dives Akuru
  'Dogr', // Dogra
  'Dsrt', // Deseret
  'Dupl', // Duployan
  'Egyp', // Egyptian Hieroglyphs
  'Elba', // Elbasan
  'Elym', // Elymaic
  'Glag', // Glagolitic
  'Gong', // Gunjala Gondi
  'Gonm', // Masaram Gondi
  'Goth', // Gothic
  'Gran', // Grantha
  'Hano', // Hanunoo
  'Hatr', // Hatran
  'Hluw', // Anatolian Hieroglyphs
  'Hmng', // Pahawh Hmong
  'Hung', // Old Hungarian
  'Ital', // Old Italic
  'Kawi', // Kawi
  'Khar', // Kharoshthi
  'Khoj', // Khojki
  'Kits', // Khitan Small Script
  'Kthi', // Kaithi
  'Lina', // Linear A
  'Linb', // Linear B
  'Lyci', // Lycian
  'Lydi', // Lydian
  'Maka', // Makasar
  'Mahj', // Mahajani
  'Mani', // Manichaean
  'Marc', // Marchen
  'Medf', // Medefaidrin
  'Mend', // Mende Kikakui
  'Merc', // Meroitic Cursive
  'Mero', // Meroitic Hieroglyphs
  'Modi', // Modi
  'Mong', // Mongolian
  'Mroo', // Mro
  'Mult', // Multani
  'Nagm', // Nag Mundari
  'Narb', // Old North Arabian
  'Nand', // Nandinagari
  'Nbat', // Nabataean
  'Nshu', // Nushu
  'Ogam', // Ogham
  'Orkh', // Old Turkic
  'Osma', // Osmanya
  'Ougr', // Old Uyghur
  'Palm', // Palmyrene
  'Pauc', // Pau Cin Hau
  'Perm', // Old Permic
  'Phag', // Phags-pa
  'Phli', // Inscriptional Pahlavi
  'Phlp', // Psalter Pahlavi
  'Phnx', // Phoenician
  'Prti', // Inscriptional Parthian
  'Rjng', // Rejang
  'Runr', // Runic
  'Samr', // Samaritan
  'Sarb', // Old South Arabian
  'Sgnw', // SignWriting
  'Shaw', // Shavian
  'Shrd', // Sharada
  'Sidd', // Siddham
  'Sind', // Khudawadi
  'Sora', // Sora Sompeng
  'Sogd', // Sogdian
  'Sogo', // Old Sogdian
  'Soyo', // Soyombo
  'Tagb', // Tagbanwa
  'Takr', // Takri
  'Tang', // Tangut
  'Tglg', // Tagalog
  'Tirh', // Tirhuta
  'Tnsa', // Tangsa
  'Toto', // Toto
  'Ugar', // Ugaritic
  'Vith', // Vithkuqi
  'Wara', // Warang Citi
  'Xpeo', // Old Persian
  'Xsux', // Cuneiform
  'Yezi', // Yezidi
  'Zanb', // Zanabazar Square
])

/*
const COMMON_OR_INHERITED_META_SCRIPTS = new Set([
    'Zyyy', // Common
    'Zinh', // Inherited
])
  */

// https://www.unicode.org/reports/tr31/#Table_Recommended_Scripts
const RECOMMENDED_SCRIPTS_BESIDES_COMMON_INHERITED = new Set([
  'Arab', // Arabic
  'Armn', // Armenian
  'Beng', // Bengali
  'Bopo', // Bopomofo
  'Cyrl', // Cyrillic
  'Deva', // Devanagari
  'Ethi', // Ethiopic
  'Geor', // Georgian
  'Grek', // Greek
  'Gujr', // Gujarati
  'Guru', // Gurmukhi
  'Hang', // Hangul
  'Hani', // Han
  'Hebr', // Hebrew
  'Hira', // Hiragana
  'Kana', // Katakana
  'Knda', // Kannada
  'Khmr', // Khmer
  'Laoo', // Lao
  'Latn', // Latin
  'Mlym', // Malayalam
  'Mymr', // Myanmar
  'Orya', // Oriya
  'Sinh', // Sinhala
  'Taml', // Tamil
  'Telu', // Telugu
  'Thaa', // Thaana
  'Thai', // Thai
  'Tibt', // Tibetan
])

// https://www.unicode.org/reports/tr31/#Table_Limited_Use_Scripts
// Unicode classifies then apart from the excluded scripts,
// but they aren't allowed just the same for our use case.
const LIMITED_USE_SCRIPTS = new Set([
  'Adlm', // Adlam
  'Bali', // Balinese
  'Bamu', // Bamum
  'Batk', // Batak
  'Cakm', // Chakma
  'Cans', // Canadian Aboriginal Syllabics
  'Cham', // Cham
  'Cher', // Cherokee
  'Hmnp', // Nyiakeng Puachue Hmong
  'Java', // Javanese
  'Kali', // Kayah Li
  'Lana', // Tai Tham
  'Lepc', // Lepcha
  'Limb', // Limbu
  'Lisu', // Lisu
  'Mand', // Mandaic
  'Mtei', // Meetei Mayek
  'Newa', // Newa
  'Nkoo', // Nko
  'Olck', // Ol Chiki
  'Osge', // Osage
  'Plrd', // Miao
  'Rohg', // Hanifi Rohingya
  'Saur', // Saurashtra
  'Sund', // Sundanese
  'Sylo', // Syloti Nagri
  'Syrc', // Syriac
  'Tale', // Tai Le
  'Talu', // New Tai Lue
  'Tavt', // Tai Viet
  'Tfng', // Tifinagh
  'Vaii', // Vai
  'Wcho', // Wancho
  'Yiii', // Yi
])
