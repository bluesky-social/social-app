const VERSION_COMPONENT = '(?:0|[1-9][0-9]*)'
const VERSION_PATTERN = new RegExp(
  `^${VERSION_COMPONENT}\\.${VERSION_COMPONENT}\\.${VERSION_COMPONENT}$`,
)
const RELEASE_FILENAME_PATTERN = new RegExp(
  `^RELEASE-(${VERSION_COMPONENT}\\.${VERSION_COMPONENT}\\.${VERSION_COMPONENT})\\.md$`,
)
const SOURCE_SHA_PATTERN = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/
const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/

const FRONTMATTER_KEYS = [
  'releaseVersion',
  'sourceTag',
  'sourceSha',
  'iosBuildNumber',
  'androidVersionCode',
]

const PUBLIC_CHANGELOG_START = '<!-- public-changelog:start -->'
const PUBLIC_CHANGELOG_END = '<!-- public-changelog:end -->'

export class ReleaseError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ReleaseError'
  }
}

function fail(message) {
  throw new ReleaseError(message)
}

function normalizeLineEndings(markdown) {
  return markdown.replace(/\r\n?/g, '\n')
}

export function assertReleaseVersion(version) {
  if (typeof version !== 'string' || !VERSION_PATTERN.test(version)) {
    fail(`Release version must use strict x.y.z format; found '${version}'.`)
  }
  return version
}

export function deriveReleaseIdentity(version) {
  assertReleaseVersion(version)
  return Object.freeze({
    version,
    branch: `release-${version}`,
    tag: version,
    filename: `RELEASE-${version}.md`,
    githubReleaseName: `Release ${version}`,
  })
}

function parseFrontmatter(markdown) {
  const normalized = normalizeLineEndings(markdown)
  if (!normalized.startsWith('---\n')) {
    fail('Release file must start with YAML frontmatter.')
  }

  const end = normalized.indexOf('\n---\n', 4)
  if (end === -1) fail('Release file frontmatter is not closed.')

  const metadata = {}
  const lines = normalized.slice(4, end).split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    const match = /^([A-Za-z][A-Za-z0-9]*):[ \t]*(.*)$/.exec(line)
    if (!match) fail(`Unsupported frontmatter line: '${line}'.`)

    const [, key, rawValue] = match
    if (!FRONTMATTER_KEYS.includes(key)) {
      fail(`Unknown release frontmatter field '${key}'.`)
    }
    if (Object.hasOwn(metadata, key)) {
      fail(`Duplicate release frontmatter field '${key}'.`)
    }
    if (!rawValue) fail(`Release frontmatter field '${key}' cannot be empty.`)
    metadata[key] = rawValue
  }

  const body = normalized.slice(end + 5)
  if (!body.startsWith('\n')) {
    fail('Release file must contain a blank line after frontmatter.')
  }

  return {metadata, body: body.slice(1)}
}

function findDelimitedSection(body, startMarker, endMarker) {
  const start = body.indexOf(startMarker)
  const end = body.indexOf(endMarker)
  if (start === -1 || end === -1) {
    fail('Release file must contain the public changelog delimiters.')
  }
  if (
    start !== body.lastIndexOf(startMarker) ||
    end !== body.lastIndexOf(endMarker)
  ) {
    fail('Public changelog delimiters must occur exactly once.')
  }
  if (end < start)
    fail('Public changelog end delimiter precedes its start delimiter.')

  return {
    before: body.slice(0, start + startMarker.length),
    content: body.slice(start + startMarker.length, end).trim(),
    after: body.slice(end),
  }
}

function parseChangelogSections(publicChangelog) {
  const unsupportedHeading = publicChangelog.match(
    /^## (?!Initial release\s*$|OTA [1-9][0-9]*\s*$).+$/m,
  )
  if (unsupportedHeading) {
    fail(`Unsupported public changelog section '${unsupportedHeading[0]}'.`)
  }

  const headings = [
    ...publicChangelog.matchAll(
      /^## (Initial release|OTA ([1-9][0-9]*))\s*$/gm,
    ),
  ]
  if (!headings.length || headings[0][1] !== 'Initial release') {
    fail("Public changelog must begin with an '## Initial release' section.")
  }

  const prefix = publicChangelog.slice(0, headings[0].index).trim()
  if (prefix)
    fail(
      'Public changelog cannot contain content before its initial release section.',
    )

  const sections = headings.map((heading, index) => {
    const start = heading.index + heading[0].length
    const end = headings[index + 1]?.index ?? publicChangelog.length
    const content = publicChangelog.slice(start, end).trim()
    if (!content) fail(`Changelog section '${heading[1]}' cannot be empty.`)
    return {
      type: heading[1] === 'Initial release' ? 'initial' : 'ota',
      sequence: heading[2] ? Number(heading[2]) : null,
      content,
    }
  })

  sections.slice(1).forEach((section, index) => {
    const expected = index + 1
    if (section.type !== 'ota' || section.sequence !== expected) {
      fail(
        `OTA changelog sections must be contiguous; expected OTA ${expected}.`,
      )
    }
  })

  return sections
}

function validateMetadata(metadata, stage) {
  assertReleaseVersion(metadata.releaseVersion)

  if (metadata.sourceTag !== undefined) {
    assertReleaseVersion(metadata.sourceTag)
    if (metadata.sourceTag !== metadata.releaseVersion) {
      fail('sourceTag must match releaseVersion.')
    }
  }
  if (
    metadata.sourceSha !== undefined &&
    !SOURCE_SHA_PATTERN.test(metadata.sourceSha)
  ) {
    fail('sourceSha must be a full lowercase hexadecimal Git object ID.')
  }
  for (const key of ['iosBuildNumber', 'androidVersionCode']) {
    if (
      metadata[key] !== undefined &&
      !POSITIVE_INTEGER_PATTERN.test(metadata[key])
    ) {
      fail(`${key} must be a positive integer.`)
    }
  }

  if (stage === 'final') {
    for (const key of FRONTMATTER_KEYS) {
      if (metadata[key] === undefined) {
        fail(`Finalized release file is missing '${key}'.`)
      }
    }
  }
}

export function parseReleaseDocument(markdown, options = {}) {
  if (typeof markdown !== 'string') fail('Release document must be a string.')
  const stage = options.stage ?? 'prepared'
  if (!['prepared', 'final'].includes(stage)) {
    fail(`Unknown release validation stage '${stage}'.`)
  }

  const {metadata, body} = parseFrontmatter(markdown)
  validateMetadata(metadata, stage)

  const expectedTitle = `# Release ${metadata.releaseVersion}`
  if (!body.startsWith(`${expectedTitle}\n`)) {
    fail(
      `Release document must begin with '${expectedTitle}' after frontmatter.`,
    )
  }

  if (options.filename !== undefined) {
    const filenameMatch = RELEASE_FILENAME_PATTERN.exec(options.filename)
    if (!filenameMatch || filenameMatch[1] !== metadata.releaseVersion) {
      fail(`Filename must be 'RELEASE-${metadata.releaseVersion}.md'.`)
    }
  }

  const delimited = findDelimitedSection(
    body,
    PUBLIC_CHANGELOG_START,
    PUBLIC_CHANGELOG_END,
  )
  const sections = parseChangelogSections(delimited.content)

  return Object.freeze({
    metadata: Object.freeze({...metadata}),
    publicChangelog: delimited.content,
    sections: Object.freeze(sections.map(section => Object.freeze(section))),
  })
}

export function createReleaseDocument(version, initialChangelog) {
  assertReleaseVersion(version)
  const content = initialChangelog?.trim()
  if (!content) fail('Initial release changelog cannot be empty.')

  return `---
releaseVersion: ${version}
---

# Release ${version}

${PUBLIC_CHANGELOG_START}

## Initial release

${content}

${PUBLIC_CHANGELOG_END}
`
}

export function extractPublicChangelog(markdown) {
  return parseReleaseDocument(markdown).publicChangelog
}

export function appendOtaChangelog(markdown, sequence, changelog) {
  const normalized = normalizeLineEndings(markdown)
  const parsed = parseReleaseDocument(normalized)
  const expectedSequence = parsed.sections.length
  if (!Number.isSafeInteger(sequence) || sequence !== expectedSequence) {
    fail(`Next OTA sequence must be ${expectedSequence}; found '${sequence}'.`)
  }
  const content = changelog?.trim()
  if (!content) fail('OTA changelog cannot be empty.')

  const delimiter = `\n\n${PUBLIC_CHANGELOG_END}`
  if (!normalized.includes(delimiter)) {
    fail('Could not find the public changelog end delimiter to append the OTA.')
  }
  const replacement = `\n\n## OTA ${sequence}\n\n${content}${delimiter}`
  const updated = normalized.replace(delimiter, replacement)
  parseReleaseDocument(updated)
  return updated
}

export function finalizeReleaseDocument(markdown, finalMetadata) {
  const normalized = normalizeLineEndings(markdown)
  const parsed = parseReleaseDocument(normalized)
  const metadata = {...parsed.metadata, ...finalMetadata}
  validateMetadata(metadata, 'final')

  const frontmatter = FRONTMATTER_KEYS.map(
    key => `${key}: ${metadata[key]}`,
  ).join('\n')
  const frontmatterPattern = /^---\n[\s\S]*?\n---\n/
  if (!frontmatterPattern.test(normalized))
    fail('Could not replace the release frontmatter.')
  const updated = normalized.replace(
    frontmatterPattern,
    `---\n${frontmatter}\n---\n`,
  )
  parseReleaseDocument(updated, {stage: 'final'})
  return updated
}
