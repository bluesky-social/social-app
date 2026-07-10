import {type ComAtprotoLabelDefs} from '@atproto/api'

import {useLabelersDetailedInfoQuery} from '#/state/queries/labeler'
import {BLACKSKY_LABELER} from '#/state/session/additional-moderation-authorities'

/**
 * Hardcoded fallback for the Blacksky labeler's label-value definitions. Used
 * when the live fetch from {@link BLACKSKY_LABELER} fails or returns nothing,
 * so the label flow never breaks offline. The live definitions are preferred
 * (see {@link useBlackskyLabelDefs}) so the set stays in sync.
 */
export const BLACKSKY_LABEL_DEFS_FALLBACK: ComAtprotoLabelDefs.LabelValueDefinition[] =
  [
    {
      identifier: 'misogynoir',
      severity: 'alert',
      blurs: 'content',
      defaultSetting: 'warn',
      adultOnly: false,
      locales: [
        {
          lang: 'en',
          name: 'Misogynoir',
          description:
            "Content that expresses hatred, bias, or prejudice against Black women, specifically where racism, sexism, and/or transphobia intersect. This includes sexual harassment, objectification, and targeted attacks on Black women's identity or appearance.",
        },
      ],
    },
    {
      identifier: 'antiblack-harassment',
      severity: 'alert',
      blurs: 'content',
      defaultSetting: 'warn',
      adultOnly: false,
      locales: [
        {
          lang: 'en',
          name: 'Antiblack Harassment',
          description:
            'Content that targets individuals or groups based on their Black identity with derogatory, hateful, or dehumanizing language or imagery. This label is applied to content that perpetuates harmful stereotypes, slurs, or direct harassment aimed at Black individuals or communities.',
        },
      ],
    },
    {
      identifier: 'white-supremacy',
      severity: 'inform',
      blurs: 'none',
      defaultSetting: 'warn',
      adultOnly: false,
      locales: [
        {
          lang: 'en',
          name: 'White Supremacy or Antiblack Rhetoric',
          description:
            'Content that expresses statements that are rooted in white supremacy and anti-black rhetoric that does not fall under targeted anti-black harassment. This may include internalized anti-blackness that is harmful in nature.',
        },
      ],
    },
    {
      identifier: 'fatphobia',
      severity: 'alert',
      blurs: 'content',
      defaultSetting: 'warn',
      adultOnly: false,
      locales: [
        {
          lang: 'en',
          name: 'Fatphobia',
          description:
            'Content that expresses statements of fatphobia, including images, videos, and fatphobic language, in an effort to discriminate against fat bodies.',
        },
      ],
    },
    {
      identifier: 'ableism',
      severity: 'alert',
      blurs: 'content',
      defaultSetting: 'warn',
      adultOnly: false,
      locales: [
        {
          lang: 'en',
          name: 'Ableism',
          description:
            'Content that is harmful to people with disabilities, including harassing, abusive, or dehumanizing content directed at people with disabilities that are visible and invisible.',
        },
      ],
    },
    {
      identifier: 'violence',
      severity: 'alert',
      blurs: 'content',
      defaultSetting: 'ignore',
      adultOnly: false,
      locales: [
        {
          lang: 'en',
          name: 'Violence',
          description:
            'Content that expresses violence via images or statements that target Black people. This may include, but is not limited to, threats of physical violence and sexual violence.',
        },
      ],
    },
    {
      identifier: 'doxxing',
      severity: 'alert',
      blurs: 'content',
      defaultSetting: 'hide',
      adultOnly: false,
      locales: [
        {
          lang: 'en',
          name: 'Doxxing',
          description:
            "The act of disclosing someone's personal, non-public information — such as a real name, home address, phone number or any other data that could be used to identify the individual — in an online forum or other public place without the person's consent.",
        },
      ],
    },
    {
      identifier: 'non-consensual-intimate-imagery',
      severity: 'alert',
      blurs: 'content',
      defaultSetting: 'hide',
      adultOnly: true,
      locales: [
        {
          lang: 'en',
          name: 'Non-Consensual Intimate Imagery',
          description:
            "Non-consensual image sharing, or non-consensual intimate image sharing (also called 'non-consensual explicit imagery' (NCEI) or colloquially called 'revenge porn'), refers to the act or threat of creating, publishing or sharing an intimate image or video without the consent of the individuals visible in it.",
        },
      ],
    },
    {
      identifier: 'synthetic-media',
      severity: 'alert',
      blurs: 'media',
      defaultSetting: 'warn',
      adultOnly: false,
      locales: [
        {
          lang: 'en',
          name: 'Synthetic Media',
          description:
            'Content which has been generated or manipulated to appear as though based on reality, when it is in fact artificial. Also referred to as manipulated media.',
        },
      ],
    },
  ]

export type ResolvedLabelStrings = {
  name: string
  description: string
}

/**
 * Resolves the locale-appropriate name/description for a label definition,
 * falling back to English and then the identifier.
 */
export function resolveLabelStrings(
  def: ComAtprotoLabelDefs.LabelValueDefinition,
  lang: string,
): ResolvedLabelStrings {
  const locales = def.locales ?? []
  const match =
    locales.find(l => l.lang === lang) ??
    locales.find(l => l.lang === 'en') ??
    locales[0]
  return {
    name: match?.name || def.identifier,
    description: match?.description || '',
  }
}

// Global atproto system labels offered alongside the labeler's custom defs.
// Clients handle these vals natively, so they never appear in a labeler's
// labelValueDefinitions.
export const GLOBAL_LABEL_DEFS: ComAtprotoLabelDefs.LabelValueDefinition[] = [
  {
    identifier: 'porn',
    severity: 'none',
    blurs: 'media',
    defaultSetting: 'hide',
    adultOnly: true,
    locales: [
      {
        lang: 'en',
        name: 'Adult Content',
        description: 'Explicit sexual images.',
      },
    ],
  },
  {
    identifier: 'sexual',
    severity: 'none',
    blurs: 'media',
    defaultSetting: 'warn',
    adultOnly: true,
    locales: [
      {
        lang: 'en',
        name: 'Sexually Suggestive',
        description: 'Does not include nudity.',
      },
    ],
  },
  {
    identifier: 'nudity',
    severity: 'none',
    blurs: 'media',
    defaultSetting: 'ignore',
    adultOnly: false,
    locales: [
      {
        lang: 'en',
        name: 'Non-sexual Nudity',
        description: 'E.g. artistic nudes.',
      },
    ],
  },
  {
    identifier: 'graphic-media',
    severity: 'none',
    blurs: 'media',
    defaultSetting: 'warn',
    adultOnly: true,
    locales: [
      {
        lang: 'en',
        name: 'Graphic Media',
        description: 'Explicit or potentially disturbing media.',
      },
    ],
  },
]

/**
 * Returns the Blacksky labeler's label-value definitions, preferring the live
 * set fetched from the labeler service and falling back to the hardcoded set.
 */
export function useBlackskyLabelDefs(): {
  defs: ComAtprotoLabelDefs.LabelValueDefinition[]
  isLoading: boolean
} {
  const {data, isLoading} = useLabelersDetailedInfoQuery({
    dids: [BLACKSKY_LABELER],
  })
  const live = data?.[0]?.policies?.labelValueDefinitions
  const custom = live && live.length ? live : BLACKSKY_LABEL_DEFS_FALLBACK
  return {
    defs: [...custom, ...GLOBAL_LABEL_DEFS],
    isLoading,
  }
}
