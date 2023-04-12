export const FILTER_SETTINGS = {
  base: {
    sourceDids: [
      'did:plc:ar7c4by46qjdydhdevvrndac',
      'did:plc:jonz5u6ulzdkwpnhqlwbsbrh',
    ],
    filterLabelVals: ['csam', 'dmca-violation', 'nudity-nonconsentual'],
  },
  'bsky-unfiltered': {
    sourceDids: [
      'did:plc:ar7c4by46qjdydhdevvrndac',
      'did:plc:jonz5u6ulzdkwpnhqlwbsbrh',
    ],
    filterLabelVals: [],
  },
  'bsky-default': {
    sourceDids: [
      'did:plc:ar7c4by46qjdydhdevvrndac',
      'did:plc:jonz5u6ulzdkwpnhqlwbsbrh',
    ],
    filterLabelVals: ['porn', 'nudity', 'gore', 'self-harm', 'torture', 'spam'],
  },
  'bsky-calm': {
    sourceDids: [
      'did:plc:ar7c4by46qjdydhdevvrndac',
      'did:plc:jonz5u6ulzdkwpnhqlwbsbrh',
    ],
    filterLabelVals: [
      'porn',
      'nudity',
      'sexual',
      'gore',
      'self-harm',
      'torture',
      'icon-kkk',
      'icon-nazi',
      'icon-confederate',
      'spam',
      'impersonation',
    ],
  },
}

export const FILTERS = {
  'bsky-unfiltered': {
    title: 'Unfiltered',
    author: 'Bluesky Team',
    description: 'Show me everything.',
    filterLabelVals: FILTER_SETTINGS.base.filterLabelVals.concat(
      FILTER_SETTINGS['bsky-unfiltered'].filterLabelVals,
    ),
  },
  'bsky-default': {
    title: 'Default',
    author: 'Bluesky Team',
    description:
      'Filters out NSFW and nudity, gore, self-harm, torture, and spam.',
    filterLabelVals: FILTER_SETTINGS.base.filterLabelVals.concat(
      FILTER_SETTINGS['bsky-default'].filterLabelVals,
    ),
  },
  'bsky-calm': {
    title: 'Calm',
    author: 'Bluesky Team',
    description:
      'Like default, but also filters out hate-group iconography and impersonations.',
    filterLabelVals: FILTER_SETTINGS.base.filterLabelVals.concat(
      FILTER_SETTINGS['bsky-calm'].filterLabelVals,
    ),
  },
}

export interface LabelValGroup {
  id: string
  title: string
  values: string[]
}

export const LABEL_VAL_GROUPS: Record<string, LabelValGroup> = {
  illegal: {
    id: 'illegal',
    title: 'Illegal Content',
    values: ['csam', 'dmca-violation', 'nudity-nonconsentual'],
  },
  nsfw: {
    id: 'nsfw',
    title: 'Sexual Content',
    values: ['porn', 'nudity', 'sexual'],
  },
  gore: {
    id: 'gore',
    title: 'Violent / Bloody Content',
    values: ['gore', 'self-harm', 'torture'],
  },
  hate: {
    id: 'hate',
    title: 'Political Hate-Group Content',
    values: ['icon-kkk', 'icon-nazi', 'icon-confederate'],
  },
  spam: {
    id: 'spam',
    title: 'Spam',
    values: ['spam'],
  },
  impersonation: {
    id: 'impersonation',
    title: 'Impersonation',
    values: ['impersonation'],
  },
  unknown: {
    id: 'unknown',
    title: 'Unknown Label',
    values: [],
  },
}
