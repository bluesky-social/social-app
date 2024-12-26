// To run:
// npx ts-node --project ../tsconfig.e2e.json compileUnicodeMaps.ts

const fs = require('node:fs')
const readline = require('node:readline')

type UCDTable = Map<
  number,
  {scx: string; isUpper?: true; isEmojiBesides0to9?: true; isReserved?: true}
>

async function readUcdFileAndBuildTable(): Promise<UCDTable> {
  const stream = fs.createReadStream(
    './unicode/Public/16.0.0/ucd.all.flat.xml',
    {encoding: 'utf-8'},
  )
  const linesInterface = readline.createInterface({input: stream})

  const charRegex = /^ *<char.* cp="(?<cp>[A-Z0-9]+)".* scx="(?<scx>[^"]+)"/
  const reservedRangeRegex =
    /^ *<reserved first-cp="(?<firstCP>[A-Z0-9]+)" last-cp="(?<lastCP>[A-Z0-9]+)"/

  const table: UCDTable = new Map()

  for await (const line of linesInterface) {
    const charMatch = charRegex.exec(line)
    if (charMatch) {
      const codepoint = Number.parseInt(charMatch.groups!.cp, 16)
      const scx = charMatch.groups!.scx
      const isUpper = line.includes('Upper="Y"')
      const isEmojiBesides0to9 = line.includes('Emoji="Y"') && codepoint > 0x39
      table.set(codepoint, {scx, isUpper, isEmojiBesides0to9})
    } else {
      const reservedMatch = reservedRangeRegex.exec(line)
      if (reservedMatch) {
        const first = Number.parseInt(reservedMatch.groups!.firstCP, 16)
        const last = Number.parseInt(reservedMatch.groups!.lastCP, 16)
        for (let cp = first; cp <= last; cp++) {
          table.set(cp, {scx: '', isReserved: true})
        }
      } else if (line.includes('<char') && !line.includes('first-cp="')) {
        const hasSCX = line.includes('scx="')
        const extra = hasSCX ? ' and scx property' : ''
        throw new Error(`Couldn't parse <char> tag${extra}:\n${line}`)
      } else if (line.includes('<reserved first-cp')) {
        throw new Error(`Couldn't parse <reserved> range tag:\n${line}`)
      }
    }
  }

  return table
}

function readIdentifierStatusFileAndBuildAllowedList(
  ucdTable: UCDTable,
): number[] {
  const identifierStatusTxt = fs.readFileSync(
    './unicode/Public/security/16.0.0/IdentifierStatus.txt',
    {encoding: 'utf-8'},
  ) as string

  const lineRegex =
    /^(?<start>[a-zA-Z0-9]{4,5})(?:..(?<end>[a-zA-Z0-9]{4,5}))? +; Allowed/

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
      continue // comment line
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
        // const isUpper = ucdTable.get(codepoint)?.isUpper
        if (!isExtraBanned(codepoint)) {
          allowedCodepoints.push(codepoint)
        }
      }
    }
  }

  // Emojis are allowed in domain names,
  // but they aren't listed in IdentifierStatus.txt,
  // we need to add them.
  for (const [codepoint, codepointInfo] of ucdTable) {
    if (codepointInfo.isEmojiBesides0to9) {
      allowedCodepoints.push(codepoint)
    }
  }

  allowedCodepoints.sort((a, b) => a - b) // ascending order

  checkForDuplicates(allowedCodepoints)

  return allowedCodepoints
}

function checkForDuplicates(array: number[]) {
  let previous = array[0]
  for (let i = 1; i < array.length; i++) {
    if (previous === array[i]) {
      throw new Error(
        `Duplicate codepoint ${toUCPN(previous)} in the allow list`,
      )
    }
    previous = array[i]
  }
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
    if (codepointInfo.isReserved) {
      continue
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

function writePartitionsToMapFile(partitions: Partition[]) {
  const fd = fs.openSync('../src/lib/strings/unicode-map.ts', 'w')

  const augmentations = JSON.stringify(MIXED_SCRIPTS_AUGMENTATION_RULES)
  fs.appendFileSync(
    fd,
    `\
// Autogenerated by compileUnicodeMaps.ts
// Do not modify manually, rerun the script instead.

export const BANNED = 'BANNED'
export const MIXING_ALLOWED = 'ALL'

export const MIXED_SCRIPTS_AUGMENTATIONS: {[key: string]: string[] | undefined } = ${augmentations}
`,
  )

  const literalPartitions = partitions.map(partition => {
    let tagLiteral
    if (partition.scripts) {
      if (
        partition.scripts.size === 1 &&
        (partition.scripts.has('Zyyy') || partition.scripts.has('Zinh'))
      ) {
        tagLiteral = `MIXING_ALLOWED`
      } else {
        tagLiteral = `'${[...partition.scripts].join(' ')}'`
      }
    } else {
      tagLiteral = `BANNED`
    }
    const endLiteral = toHex(partition.end)
    return {endLiteral, tagLiteral}
  })

  const endLiterals = literalPartitions.map(({endLiteral}) => endLiteral)
  const tagLiterals = literalPartitions.map(({tagLiteral}) => tagLiteral)

  fs.appendFileSync(
    fd,
    `
// "struct of arrays" for increased read performance
export const PARTITIONS_BY_SCRIPT = {
  partitionEnds: [${endLiterals.join(', ')}],
  tags: [${tagLiterals.join(', ')}],
}
`,
  )

  fs.closeSync(fd)
}

;(async function main() {
  console.log('Reading UCD file...')
  const ucdTable = await readUcdFileAndBuildTable()
  console.log(`Found ${ucdTable.size} total codepoints`)

  const allowedCodepoints =
    readIdentifierStatusFileAndBuildAllowedList(ucdTable)
  // console.log(allowedCodepoints.map(cp => toHex(cp)))
  console.log(`Found ${allowedCodepoints.length} allowed identifier codepoints`)

  const partitions = buildPartitionList(allowedCodepoints, ucdTable)
  // console.log(partitions.map(({start, end, scripts}) => ({ start: toHex(start), end: toHex(end), scripts })))
  console.log(`Computed ${partitions.length} partitions`)

  writePartitionsToMapFile(partitions)
  console.log('Wrote output unicode map file')
})()

/*
// Codepoints that we wish to allow regardless of what's in IdentifierStatus.txt
const EXTRA_ALLOWED_CODEPOINT_RANGES = [
  {start: 0x1F300, end: 0x1F5FF}, // "Miscellaneous Symbols and Pictographs" (emoji range 1)
  {start: 0x1F600, end: 0x1F64F}, // "Emoticons (Emoji)" (emoji range 2)
  {start: 0x1F680, end: 0x1F6FF}, // "Transport and Map Symbols" (emoji range 3)
  {start: 0x1F7E0, end: 0x1F7EB}, // "Geometric Shapes Extended": "Colored circles" and "Colored squares" (emoji range 4)
  {start: 0x1F90C, end: 0x1F9FF}, // "Supplemental Symbols and Pictographs" without "Typicon symbols" (emoji range 5)
  {start: 0x1FA70, end: 0x1FAFF}, // "Symbols and Pictographs Extended-A" (emoji range 6)
]
  */

// Codepoint ranges that we wish to ban regardless of what's in IdentifierStatus.txt
const EXTRA_BANNED_CODEPOINT_RANGES = [
  // RFC 1035 Rules:
  {start: 0x0027, end: 0x0027}, // ASCII Apostrophe
  {start: 0x002e, end: 0x002e}, // ASCII Dot (RFC 1035 does not allow it __inside labels__)
  {start: 0x003a, end: 0x0060}, // ASCII symbols, uppercase latin letters, underscore, ...
  // add more banned ranges here as needed
]

// https://www.unicode.org/reports/tr39/#Mixed_Script_Detection
const MIXED_SCRIPTS_AUGMENTATION_RULES: {[key: string]: string[] | undefined} =
  {
    Hani: ['Hanb', 'Jpan', 'Kore'],
    Hira: ['Jpan'],
    Kana: ['Jpan'],
    Hang: ['Kore'],
    Bopo: ['Hanb'],
  }

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
