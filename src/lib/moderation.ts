import {
  ModerationCause,
  ProfileModeration,
  PostModeration,
  LABEL_GROUPS,
  LABELS,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMemo} from 'react'

export interface ModerationCauseDescription {
  name: string
  description: string
}

export function describeModerationCause(
  cause: ModerationCause | undefined,
  context: 'account' | 'content',
  labelStrings: LabelStrings,
): ModerationCauseDescription {
  // TODO localize
  if (!cause) {
    return {
      name: 'Content Warning',
      description:
        'Moderator has chosen to set a general warning on the content.',
    }
  }
  if (cause.type === 'blocking') {
    if (cause.source.type === 'list') {
      return {
        name: `User Blocked by "${cause.source.list.name}"`,
        description:
          'You have blocked this user. You cannot view their content.',
      }
    } else {
      return {
        name: 'User Blocked',
        description:
          'You have blocked this user. You cannot view their content.',
      }
    }
  }
  if (cause.type === 'blocked-by') {
    return {
      name: 'User Blocking You',
      description: `This user has blocked you. You cannot view their content.`,
    }
  }
  if (cause.type === 'block-other') {
    return {
      name: 'Content Not Available',
      description:
        'This content is not available because one of the users involved has blocked the other.',
    }
  }
  if (cause.type === 'muted') {
    if (cause.source.type === 'list') {
      return {
        name:
          context === 'account'
            ? `Muted by "${cause.source.list.name}"`
            : `Post by muted user ("${cause.source.list.name}")`,
        description: `You have muted this user`,
      }
    } else {
      return {
        name: context === 'account' ? 'Muted User' : 'Post by muted user',
        description: `You have muted this user`,
      }
    }
  }
  // @ts-ignore Temporary extension to the moderation system -prf
  if (cause.type === 'post-hidden') {
    return {
      name: 'Post Hidden by You',
      description: `You have hidden this post`,
    }
  }
  if (cause.labelDef.id in labelStrings) {
    const strings = labelStrings[cause.labelDef.id as keyof typeof LABELS]
    return {
      name: context === 'account' ? strings.account.name : strings.content.name,
      description:
        context === 'account'
          ? strings.account.description
          : strings.content.description,
    }
  }
  return {
    name: 'TODO',
    description: `TODo`,
  }
  // return cause.labelDef.strings[context].en
}

export function getProfileModerationCauses(
  moderation: ProfileModeration,
): ModerationCause[] {
  /*
  Gather everything on profile and account that blurs or alerts
  */
  return [
    moderation.decisions.profile.cause,
    ...moderation.decisions.profile.additionalCauses,
    moderation.decisions.account.cause,
    ...moderation.decisions.account.additionalCauses,
  ].filter(cause => {
    if (!cause) {
      return false
    }
    if (cause?.type === 'label') {
      if (
        cause.labelDef.onwarn === 'blur' ||
        cause.labelDef.onwarn === 'alert'
      ) {
        return true
      } else {
        return false
      }
    }
    return true
  }) as ModerationCause[]
}

export function isPostMediaBlurred(
  decisions: PostModeration['decisions'],
): boolean {
  return decisions.post.blurMedia
}

export function isQuoteBlurred(
  decisions: PostModeration['decisions'],
): boolean {
  return (
    decisions.quote?.blur ||
    decisions.quote?.blurMedia ||
    decisions.quote?.filter ||
    decisions.quotedAccount?.blur ||
    decisions.quotedAccount?.filter ||
    false
  )
}

export function isCauseALabelOnUri(
  cause: ModerationCause | undefined,
  uri: string,
): boolean {
  if (cause?.type !== 'label') {
    return false
  }
  return cause.label.uri === uri
}

export function getModerationCauseKey(cause: ModerationCause): string {
  const source =
    cause.source.type === 'labeler'
      ? cause.source.labeler.did
      : cause.source.type === 'list'
      ? cause.source.list.uri
      : 'user'
  if (cause.type === 'label') {
    return `label:${cause.label.val}:${source}`
  }
  return `${cause.type}:${source}`
}

type LabelGroupStrings = Record<
  keyof typeof LABEL_GROUPS,
  {name: string; description: string}
>
export function useLabelGroupStrings(): LabelGroupStrings {
  const {_} = useLingui()
  return useMemo(
    () => ({
      system: {
        name: _(msg`System`),
        description: _(msg`Moderator overrides for special cases.`),
      },
      legal: {
        name: _(msg`Legal`),
        description: _(msg`Content removed for legal reasons.`),
      },
      'intellectual-property': {
        name: _(msg`Intellectual Property`),
        description: _(msg`Plagiarism, copying without attribution.`),
      },
      porn: {
        name: _(msg`Explicit Sexual Images`),
        description: _(msg`i.e. pornography.`),
      },
      suggestive: {
        name: _(msg`Sexually Suggestive`),
        description: _(msg`Does not include nudity.`),
      },
      nudity: {
        name: _(msg`Other Nudity`),
        description: _(msg`Including non-sexual and artistic.`),
      },
      violence: {
        name: _(msg`Violent / Bloody`),
        description: _(msg`Gore, self-harm, torture.`),
      },
      'drugs-alcohol': {
        name: _(msg`Substance Abuse`),
        description: _(msg`Use of drugs or alcohol.`),
      },
      'self-harm': {
        name: _(msg`Self Harm`),
        description: _(msg`Suicide, self-harm, eating disorders.`),
      },
      intolerance: {
        name: _(msg`Intolerance`),
        description: _(
          msg`Content or behavior which is hateful or intolerant toward a group of people.`,
        ),
      },
      'bad-behavior': {
        name: _(msg`Bad Behavior`),
        description: _(
          msg`Harassment, bullying, and threats toward other users.`,
        ),
      },
      rude: {
        name: _(msg`Rude`),
        description: _(msg`Behavior which is rude toward other users.`),
      },
      upsetting: {
        name: _(msg`Upsetting`),
        description: _(
          msg`Shocking, disgusting, or generally upsetting content.`,
        ),
      },
      troubling: {
        name: _(msg`Troubling`),
        description: _(
          msg`Bad news, troubling information, or dispiriting content.`,
        ),
      },
      'hate-group-mention': {
        name: _(msg`Hate Group Coverage`),
        description: _(
          msg`Images of terror groups, articles covering events, etc.`,
        ),
      },
      discourse: {
        name: _(msg`Discourse / Drama`),
        description: _(
          msg`On-going discussions or debates that may be frustrating.`,
        ),
      },
      curation: {
        name: _(msg`Curation`),
        description: _(
          msg`Judgment of the moderators to remove content not worth showing.`,
        ),
      },
      spam: {
        name: _(msg`Spam`),
        description: _(msg`Content which doesn't add to the conversation.`),
      },
      misrepresentation: {
        name: _(msg`Misrepresentation`),
        description: _(msg`Impersonations, scams.`),
      },
      security: {
        name: _(msg`Security`),
        description: _(msg`Potential security attacks.`),
      },
      misinfo: {
        name: _(msg`Misinformation`),
        description: _(msg`Content which misleads or defrauds users.`),
      },
      context: {
        name: _(msg`Context`),
        description: _(
          msg`Helpful annotations to explain intent, such as satire or parody.`,
        ),
      },
    }),
    [_],
  )
}

type LabelStrings = Record<
  keyof typeof LABELS,
  {
    general: {name: string; description: string}
    account: {name: string; description: string}
    content: {name: string; description: string}
  }
>
export function useLabelStrings(): LabelStrings {
  const {_} = useLingui()
  return useMemo(
    () => ({
      '!hide': {
        general: {
          name: _(msg`Moderator Hide`),
          description: _(msg`Moderator has chosen to hide the content.`),
        },
        account: {
          name: _(msg`Content Blocked`),
          description: _(msg`This account has been hidden by the moderators.`),
        },
        content: {
          name: _(msg`Content Blocked`),
          description: _(msg`This content has been hidden by the moderators.`),
        },
      },
      '!no-promote': {
        general: {
          name: _(msg`Moderator Filter`),
          description: _(
            msg`Moderator has chosen to filter the content from feeds.`,
          ),
        },
        account: {
          name: _(msg`N/A`),
          description: _(msg`N/A`),
        },
        content: {
          name: _(msg`N/A`),
          description: _(msg`N/A`),
        },
      },
      '!warn': {
        general: {
          name: _(msg`Moderator Warn`),
          description: _(
            msg`Moderator has chosen to set a general warning on the content.`,
          ),
        },
        account: {
          name: _(msg`Content Warning`),
          description: _(
            msg`This account has received a general warning from moderators.`,
          ),
        },
        content: {
          name: _(msg`Content Warning`),
          description: _(
            msg`This content has received a general warning from moderators.`,
          ),
        },
      },
      '!no-unauthenticated': {
        general: {
          name: _(msg`Sign-in Required`),
          description: _(
            msg`This user has requested that their account only be shown to signed-in users.`,
          ),
        },
        account: {
          name: _(msg`Sign-in Required`),
          description: _(
            msg`This user has requested that their account only be shown to signed-in users.`,
          ),
        },
        content: {
          name: _(msg`Sign-in Required`),
          description: _(
            msg`This user has requested that their content only be shown to signed-in users.`,
          ),
        },
      },
      'dmca-violation': {
        general: {
          name: _(msg`Copyright Violation`),
          description: _(
            msg`The content has received a DMCA takedown request.`,
          ),
        },
        account: {
          name: _(msg`Copyright Violation`),
          description: _(
            msg`This account has received a DMCA takedown request. It will be restored if the concerns can be resolved.`,
          ),
        },
        content: {
          name: _(msg`Copyright Violation`),
          description: _(
            msg`This content has received a DMCA takedown request. It will be restored if the concerns can be resolved.`,
          ),
        },
      },
      doxxing: {
        general: {
          name: _(msg`Doxxing`),
          description: _(
            msg`Information that reveals private information about someone which has been shared without the consent of the subject.`,
          ),
        },
        account: {
          name: _(msg`Doxxing`),
          description: _(
            msg`This account has been reported to publish private information about someone without their consent. This report is currently under review.`,
          ),
        },
        content: {
          name: _(msg`Doxxing`),
          description: _(
            msg`This content has been reported to include private information about someone without their consent.`,
          ),
        },
      },
      plagiarism: {
        general: {
          name: _(msg`Plagiarism`),
          description: _(
            msg`Content that appears to have been taken from another creator without attribution.`,
          ),
        },
        account: {
          name: _(msg`Plagiarism`),
          description: _(
            msg`The moderators believe this account has published content which is plagiarized.`,
          ),
        },
        content: {
          name: _(msg`Plagiarism`),
          description: _(
            msg`The moderators believe this content is plagiarized.`,
          ),
        },
      },
      porn: {
        general: {
          name: _(msg`Pornography`),
          description: _(
            msg`Images of full-frontal nudity (genitalia) in any sexualized context, or explicit sexual activity (meaning contact with genitalia or breasts) even if partially covered. Includes graphic sexual cartoons (often jokes/memes).`,
          ),
        },
        account: {
          name: _(msg`Adult Content`),
          description: _(
            msg`This account contains imagery of full-frontal nudity or explicit sexual activity.`,
          ),
        },
        content: {
          name: _(msg`Adult Content`),
          description: _(
            msg`This content contains imagery of full-frontal nudity or explicit sexual activity.`,
          ),
        },
      },
      sexual: {
        general: {
          name: _(msg`Sexually Suggestive`),
          description: _(
            msg`Content that does not meet the level of "pornography", but is still sexual. Some common examples have been selfies and "hornyposting" with underwear on, or partially naked (naked but covered, eg with hands or from side perspective). Sheer/see-through nipples may end up in this category.`,
          ),
        },
        account: {
          name: _(msg`Suggestive Content`),
          description: _(
            msg`This account contains imagery which is sexually suggestive. Common examples include selfies in underwear or in partial undress.`,
          ),
        },
        content: {
          name: _(msg`Suggestive Content`),
          description: _(
            msg`This content contains imagery which is sexually suggestive. Common examples include selfies in underwear or in partial undress.`,
          ),
        },
      },
      nudity: {
        general: {
          name: _(msg`Nudity`),
          description: _(
            msg`Nudity which is not sexual, or that is primarily "artistic" in nature. For example: breastfeeding; classic art paintings and sculptures; newspaper images with some nudity; fashion modeling. "Erotic photography" is likely to end up in sexual or porn.`,
          ),
        },
        account: {
          name: _(msg`Adult Content`),
          description: _(
            msg`This account contains imagery which portrays nudity in a non-sexual or artistic setting.`,
          ),
        },
        content: {
          name: _(msg`Adult Content`),
          description: _(
            msg`This content contains imagery which portrays nudity in a non-sexual or artistic setting.`,
          ),
        },
      },
      nsfl: {
        general: {
          name: _(msg`NSFL`),
          description: _(
            msg`"Not Suitable For Life." This includes graphic images like the infamous "goatse" (don\'t look it up).`,
          ),
        },
        account: {
          name: _(msg`Graphic Imagery (NSFL)`),
          description: _(
            msg`This account contains graphic images which are often referred to as "Not Suitable For Life."`,
          ),
        },
        content: {
          name: _(msg`Graphic Imagery (NSFL)`),
          description: _(
            msg`This content contains graphic images which are often referred to as "Not Suitable For Life."`,
          ),
        },
      },
      corpse: {
        general: {
          name: _(msg`Corpse`),
          description: _(
            msg`Visual image of a dead human body in any context. Includes war images, hanging, funeral caskets. Does not include all figurative cases (cartoons), but can include realistic figurative images or renderings.`,
          ),
        },
        account: {
          name: _(msg`Graphic Imagery (Corpse)`),
          description: _(
            msg`This account contains images of a dead human body in any context. Includes war images, hanging, funeral caskets.`,
          ),
        },
        content: {
          name: _(msg`Graphic Imagery (Corpse)`),
          description: _(
            msg`This content contains images of a dead human body in any context. Includes war images, hanging, funeral caskets.`,
          ),
        },
      },
      gore: {
        general: {
          name: _(msg`Gore`),
          description: _(
            msg`Intended for shocking images, typically involving blood or visible wounds.`,
          ),
        },
        account: {
          name: _(msg`Graphic Imagery (Gore)`),
          description: _(
            msg`This account contains shocking images involving blood or visible wounds.`,
          ),
        },
        content: {
          name: _(msg`Graphic Imagery (Gore)`),
          description: _(
            msg`This content contains shocking images involving blood or visible wounds.`,
          ),
        },
      },
      torture: {
        general: {
          name: _(msg`Torture`),
          description: _(
            msg`Depictions of torture of a human or animal (animal cruelty).`,
          ),
        },
        account: {
          name: _(msg`Graphic Imagery (Torture)`),
          description: _(
            msg`This account contains depictions of torture of a human or animal.`,
          ),
        },
        content: {
          name: _(msg`Graphic Imagery (Torture)`),
          description: _(
            msg`This content contains depictions of torture of a human or animal.`,
          ),
        },
      },
      'substance-abuse': {
        general: {
          name: _(msg`Substance Abuse`),
          description: _(msg`Abuse of drugs or alcohol.`),
        },
        account: {
          name: _(msg`Substance Abuse`),
          description: _(
            msg`This account has published content which includes drug or alcohol abuse.`,
          ),
        },
        content: {
          name: _(msg`Substance Abuse`),
          description: _(msg`This content includes drug or alcohol abuse.`),
        },
      },
      'self-harm': {
        general: {
          name: _(msg`Self-Harm`),
          description: _(
            msg`A visual depiction (photo or figurative) of cutting, suicide, or similar.`,
          ),
        },
        account: {
          name: _(msg`Graphic Imagery (Self-Harm)`),
          description: _(
            msg`This account includes depictions of cutting, suicide, or other forms of self-harm.`,
          ),
        },
        content: {
          name: _(msg`Graphic Imagery (Self-Harm)`),
          description: _(
            msg`This content includes depictions of cutting, suicide, or other forms of self-harm.`,
          ),
        },
      },
      'eating-disorder': {
        general: {
          name: _(msg`Eating Disorder`),
          description: _(
            msg`Discussion of anorexia, bulimia, or other forms of eating disorders.`,
          ),
        },
        account: {
          name: _(msg`Eating Disorder`),
          description: _(
            msg`This account has published content which discusses anorexia, bulimia, or other forms of eating disorders.`,
          ),
        },
        content: {
          name: _(msg`Eating Disorder`),
          description: _(
            msg`This content discusses anorexia, bulimia, or other forms of eating disorders.`,
          ),
        },
      },
      'intolerant-race': {
        general: {
          name: _(msg`Racial Intolerance`),
          description: _(msg`Hateful or intolerant content related to race.`),
        },
        account: {
          name: _(msg`Intolerance (Racial)`),
          description: _(
            msg`This account includes hateful or intolerant content related to race.`,
          ),
        },
        content: {
          name: _(msg`Intolerance (Racial)`),
          description: _(
            msg`This content includes hateful or intolerant views related to race.`,
          ),
        },
      },
      'intolerant-gender': {
        general: {
          name: _(msg`Gender Intolerance`),
          description: _(
            msg`Hateful or intolerant content related to gender or gender identity.`,
          ),
        },
        account: {
          name: _(msg`Intolerance (Gender)`),
          description: _(
            msg`This account includes hateful or intolerant content related to gender or gender identity.`,
          ),
        },
        content: {
          name: _(msg`Intolerance (Gender)`),
          description: _(
            msg`This content includes hateful or intolerant views related to gender or gender identity.`,
          ),
        },
      },
      'intolerant-sexual-orientation': {
        general: {
          name: _(msg`Sexual Orientation Intolerance`),
          description: _(
            msg`Hateful or intolerant content related to sexual preferences.`,
          ),
        },
        account: {
          name: _(msg`Intolerance (Orientation)`),
          description: _(
            msg`This account includes hateful or intolerant content related to sexual preferences.`,
          ),
        },
        content: {
          name: _(msg`Intolerance (Orientation)`),
          description: _(
            msg`This content includes hateful or intolerant views related to sexual preferences.`,
          ),
        },
      },
      'intolerant-religion': {
        general: {
          name: _(msg`Religious Intolerance`),
          description: _(
            msg`Hateful or intolerant content related to religious views or practices.`,
          ),
        },
        account: {
          name: _(msg`Intolerance (Religious)`),
          description: _(
            msg`This account includes hateful or intolerant content related to religious views or practices.`,
          ),
        },
        content: {
          name: _(msg`Intolerance (Religious)`),
          description: _(
            msg`This content includes hateful or intolerant views related to religious views or practices.`,
          ),
        },
      },
      intolerant: {
        general: {
          name: _(msg`Intolerance`),
          description: _(
            msg`A catchall for hateful or intolerant content which is not covered elsewhere.`,
          ),
        },
        account: {
          name: _(msg`Intolerance`),
          description: _(
            msg`This account includes hateful or intolerant content.`,
          ),
        },
        content: {
          name: _(msg`Intolerance`),
          description: _(
            msg`This content includes hateful or intolerant views.`,
          ),
        },
      },
      harassment: {
        general: {
          name: _(msg`Harassment`),
          description: _(
            msg`Frequent unwanted interactions, commentary, or negativity toward other users.`,
          ),
        },
        account: {
          name: _(msg`Harassment`),
          description: _(
            msg`This account has engaged in frequent unwanted interactions, commentary, or negativity toward other users.`,
          ),
        },
        content: {
          name: _(msg`Harassment`),
          description: _(
            msg`This content is part of frequent unwanted interactions, commentary, or negativity toward other users.`,
          ),
        },
      },
      bullying: {
        general: {
          name: _(msg`Bullying`),
          description: _(
            msg`Needless negativity or cruelty toward another user.`,
          ),
        },
        account: {
          name: _(msg`Bullying`),
          description: _(
            msg`This account has engaged in needless negativity or cruelty toward other users.`,
          ),
        },
        content: {
          name: _(msg`Bullying`),
          description: _(
            msg`Needless negativity or cruelty toward another user.`,
          ),
        },
      },
      rude: {
        general: {
          name: _(msg`Rude`),
          description: _(
            msg`Unkind, impolite, or uncharitable behavior toward another user.`,
          ),
        },
        account: {
          name: _(msg`Rude`),
          description: _(
            msg`This account has been unkind, impolite, or uncharitable toward another user.`,
          ),
        },
        content: {
          name: _(msg`Rude`),
          description: _(
            msg`Unkind, impolite, or uncharitable behavior toward another user.`,
          ),
        },
      },
      threat: {
        general: {
          name: _(msg`Threats`),
          description: _(
            msg`Statements or imagery published with the intent to threaten, intimidate, or harm.`,
          ),
        },
        account: {
          name: _(msg`Threats`),
          description: _(
            msg`The moderators believe this account has published statements or imagery with the intent to threaten, intimidate, or harm others.`,
          ),
        },
        content: {
          name: _(msg`Threats`),
          description: _(
            msg`The moderators believe this content was published with the intent to threaten, intimidate, or harm others.`,
          ),
        },
      },
      disgusting: {
        general: {
          name: _(msg`Disgusting`),
          description: _(msg`Gross or disgusting, such as pictures of poop.`),
        },
        account: {
          name: _(msg`Disgusting`),
          description: _(
            msg`This account includes content which is gross or disgusting, such as pictures of poop.`,
          ),
        },
        content: {
          name: _(msg`Disgusting`),
          description: _(
            msg`This includes content which is gross or disgusting, such as pictures of poop.`,
          ),
        },
      },
      upsetting: {
        general: {
          name: _(msg`Upsetting`),
          description: _(msg`Upsetting to read or see.`),
        },
        account: {
          name: _(msg`Upsetting`),
          description: _(
            msg`This account includes content which might ruin your day.`,
          ),
        },
        content: {
          name: _(msg`Upsetting`),
          description: _(msg`This includes content which might ruin your day.`),
        },
      },
      troubling: {
        general: {
          name: _(msg`Troubling`),
          description: _(
            msg`Information which is difficult to process and may affect your mood.`,
          ),
        },
        account: {
          name: _(msg`Troubling`),
          description: _(
            msg`This account publishes information which is difficult to process and may affect your mood.`,
          ),
        },
        content: {
          name: _(msg`Troubling`),
          description: _(
            msg`Information which is difficult to process and may affect your mood.`,
          ),
        },
      },
      dispiriting: {
        general: {
          name: _(msg`Dispiriting`),
          description: _(msg`Content which is pessimistic, cynical, or sad.`),
        },
        account: {
          name: _(msg`Dispiriting`),
          description: _(
            msg`This account publishes content which is pessimistic, cynical, or sad.`,
          ),
        },
        content: {
          name: _(msg`Dispiriting`),
          description: _(
            msg`Includes content which is pessimistic, cynical, or sad.`,
          ),
        },
      },
      'bad-news': {
        general: {
          name: _(msg`Bad News`),
          description: _(
            msg`Recent events which involve death, harm, loss, or bad outcomes.`,
          ),
        },
        account: {
          name: _(msg`Bad News`),
          description: _(
            msg`This account publishes about recent events which involve death, harm, loss, or bad outcomes.`,
          ),
        },
        content: {
          name: _(msg`Bad News`),
          description: _(
            msg`Discusses recent events which involve death, harm, loss, or bad outcomes.`,
          ),
        },
      },
      'icon-intolerant': {
        general: {
          name: _(msg`Intolerant Iconography`),
          description: _(
            msg`Visual imagery associated with a hate group, such as the KKK or Nazi, in any context (supportive, critical, documentary, etc).`,
          ),
        },
        account: {
          name: _(msg`Intolerant Iconography`),
          description: _(
            msg`This account includes imagery associated with a hate group such as the KKK or Nazis. This warning may apply to content any context, including critical or documentary purposes.`,
          ),
        },
        content: {
          name: _(msg`Intolerant Iconography`),
          description: _(
            msg`This content includes imagery associated with a hate group such as the KKK or Nazis. This warning may apply to content any context, including critical or documentary purposes.`,
          ),
        },
      },
      discourse: {
        general: {
          name: _(msg`Discourse`),
          description: _(
            msg`Lengthy debate about a topic which may stir strong emotions.`,
          ),
        },
        account: {
          name: _(msg`Discourse`),
          description: _(
            msg`This account engages in lengthy debate about a topic which may stir strong emotions.`,
          ),
        },
        content: {
          name: _(msg`Discourse`),
          description: _(
            msg`This content is a part of lengthy debate about a topic which may stir strong emotions.`,
          ),
        },
      },
      drama: {
        general: {
          name: _(msg`Drama`),
          description: _(
            msg`A debate, argument, or controversy within a community.`,
          ),
        },
        account: {
          name: _(msg`Drama`),
          description: _(
            msg`This account engages in debate, argument, or controversy within a community.`,
          ),
        },
        content: {
          name: _(msg`Drama`),
          description: _(
            msg`This content is a part of debate, argument, or controversy within a community.`,
          ),
        },
      },
      curation: {
        general: {
          name: _(msg`Curation`),
          description: _(
            msg`Judgment of the moderators to remove content they feel does not meet their standards of quality, however they choose to define it.`,
          ),
        },
        account: {
          name: _(msg`Curation`),
          description: _(
            msg`The moderators feel this account does not meet their standards of quality.`,
          ),
        },
        content: {
          name: _(msg`Curation`),
          description: _(
            msg`The moderators feel this content does not meet their standards of quality.`,
          ),
        },
      },
      spam: {
        general: {
          name: _(msg`Spam`),
          description: _(
            msg`Repeat, low-quality messages which are clearly not designed to add to a conversation or space.`,
          ),
        },
        account: {
          name: _(msg`Spam`),
          description: _(
            msg`This account publishes repeat, low-quality messages which are clearly not designed to add to a conversation or space.`,
          ),
        },
        content: {
          name: _(msg`Spam`),
          description: _(
            msg`This content is a part of repeat, low-quality messages which are clearly not designed to add to a conversation or space.`,
          ),
        },
      },
      'interaction-noise': {
        general: {
          name: _(msg`Interaction Noise`),
          description: _(
            msg`Repeat low-quality interactions designed to get your attention, such as repeatedly following and unfollowing.`,
          ),
        },
        account: {
          name: _(msg`Interaction Noise`),
          description: _(
            msg`This account engages in repeated low-quality interactions designed to get your attention, such as repeatedly following and unfollowing.`,
          ),
        },
        content: {
          name: _(msg`Interaction Noise`),
          description: _(
            msg`This content is a part of repeated low-quality interactions designed to get your attention, such as repeatedly following and unfollowing.`,
          ),
        },
      },
      'engagement-farming': {
        general: {
          name: _(msg`Engagement Farming`),
          description: _(
            msg`Automated interactions designed to drive up engagement with an account or some content.`,
          ),
        },
        account: {
          name: _(msg`Engagement Farming`),
          description: _(
            msg`This account engages in automated interactions designed to drive up engagement with an account or some content.`,
          ),
        },
        content: {
          name: _(msg`Engagement Farming`),
          description: _(
            msg`This content is an automated interaction designed to drive up engagement with an account or some content.`,
          ),
        },
      },
      shilling: {
        general: {
          name: _(msg`Shilling`),
          description: _(
            msg`Unwanted promotion, shilling, or advertisement for some product or service.`,
          ),
        },
        account: {
          name: _(msg`Shilling`),
          description: _(
            msg`This account engages in unwanted promotion, shilling, or advertisement for some product or service.`,
          ),
        },
        content: {
          name: _(msg`Shilling`),
          description: _(
            msg`This content is unwanted promotion, shilling, or advertisement for some product or service.`,
          ),
        },
      },
      impersonation: {
        general: {
          name: _(msg`Impersonation`),
          description: _(msg`Accounts which falsely assert some identity.`),
        },
        account: {
          name: _(msg`Impersonation Warning`),
          description: _(
            msg`The moderators believe this account is lying about their identity.`,
          ),
        },
        content: {
          name: _(msg`Impersonation Warning`),
          description: _(
            msg`The moderators believe this account is lying about their identity.`,
          ),
        },
      },
      scam: {
        general: {
          name: _(msg`Scam`),
          description: _(msg`Fraudulent content.`),
        },
        account: {
          name: _(msg`Scam Warning`),
          description: _(
            msg`The moderators believe this account publishes fraudulent content.`,
          ),
        },
        content: {
          name: _(msg`Scam Warning`),
          description: _(
            msg`The moderators believe this is fraudulent content.`,
          ),
        },
      },
      'account-security': {
        general: {
          name: _(msg`Security Concerns`),
          description: _(
            msg`Content designed to hijack user accounts such as a phishing attack.`,
          ),
        },
        account: {
          name: _(msg`Security Warning`),
          description: _(
            msg`This account has published content designed to hijack user accounts such as a phishing attack.`,
          ),
        },
        content: {
          name: _(msg`Security Warning`),
          description: _(
            msg`This content is designed to hijack user accounts such as a phishing attack.`,
          ),
        },
      },
      'net-abuse': {
        general: {
          name: _(msg`Network Attacks`),
          description: _(
            msg`Content designed to attack network systems such as denial-of-service attacks.`,
          ),
        },
        account: {
          name: _(msg`Network Attack Warning`),
          description: _(
            msg`This account has published content designed to attack network systems such as denial-of-service attacks.`,
          ),
        },
        content: {
          name: _(msg`Network Attack Warning`),
          description: _(
            msg`This content is designed to attack network systems such as denial-of-service attacks.`,
          ),
        },
      },
      misinfo: {
        general: {
          name: _(msg`Misinformation`),
          description: _(msg`False information.`),
        },
        account: {
          name: _(msg`Misinformation`),
          description: _(
            msg`The moderators believe this account is spreading false information.`,
          ),
        },
        content: {
          name: _(msg`Misinformation`),
          description: _(
            msg`The moderators believe this includes false information.`,
          ),
        },
      },
      misleading: {
        general: {
          name: _(msg`Misleading`),
          description: _(msg`Accounts which share misleading information.`),
        },
        account: {
          name: _(msg`Misleading`),
          description: _(
            msg`The moderators believe this account is spreading misleading information.`,
          ),
        },
        content: {
          name: _(msg`Misleading`),
          description: _(
            msg`The moderators believe this account is spreading misleading information.`,
          ),
        },
      },
      unverified: {
        general: {
          name: _(msg`Unverified`),
          description: _(
            msg`Information which is not certain to be true or false.`,
          ),
        },
        account: {
          name: _(msg`Unverified`),
          description: _(
            msg`The moderators believe this account is spreading information which is not certain to be true or false.`,
          ),
        },
        content: {
          name: _(msg`Unverified`),
          description: _(
            msg`The moderators believe this includes information which is not certain to be true or false.`,
          ),
        },
      },
      manipulated: {
        general: {
          name: _(msg`Manipulated`),
          description: _(
            msg`Media which has been modified from its original form.`,
          ),
        },
        account: {
          name: _(msg`Manipulated`),
          description: _(
            msg`The moderators believe this account is spreading media which has been modified from its original form.`,
          ),
        },
        content: {
          name: _(msg`Manipulated`),
          description: _(
            msg`The moderators believe this includes media which has been modified from its original form.`,
          ),
        },
      },
      fringe: {
        general: {
          name: _(msg`Fringe / Conspiracy`),
          description: _(
            msg`Explanations for events that assert a conspiracy by powerful groups instead of other more probable explanations.`,
          ),
        },
        account: {
          name: _(msg`Fringe / Conspiracy`),
          description: _(
            msg`The moderators believe this account is engaged in spreading conspiracy theories.`,
          ),
        },
        content: {
          name: _(msg`Fringe / Conspiracy`),
          description: _(
            msg`The moderators believe this asserts a conspiracy instead of other more probable explanations.`,
          ),
        },
      },
      satire: {
        general: {
          name: _(msg`Satire`),
          description: _(
            msg`Content which is not intended to be taken seriously.`,
          ),
        },
        account: {
          name: _(msg`Satire`),
          description: _(
            msg`This account is not intended to be taken seriously.`,
          ),
        },
        content: {
          name: _(msg`Satire`),
          description: _(msg`This is not intended to be taken seriously.`),
        },
      },
      parody: {
        general: {
          name: _(msg`Parody`),
          description: _(
            msg`Content which is poking fun at something else through imitation.`,
          ),
        },
        account: {
          name: _(msg`Parody`),
          description: _(
            msg`This account is poking fun at something else through imitation.`,
          ),
        },
        content: {
          name: _(msg`Parody`),
          description: _(
            msg`This is poking fun at something else through imitation.`,
          ),
        },
      },
      bot: {
        general: {
          name: _(msg`Bot`),
          description: _(msg`An automated account.`),
        },
        account: {
          name: _(msg`Bot`),
          description: _(msg`This account is automated.`),
        },
        content: {
          name: _(msg`Bot`),
          description: _(msg`This content is produced by an automated system.`),
        },
      },
      'ai-generated': {
        general: {
          name: _(msg`AI Generated`),
          description: _(msg`Content generated by AI.`),
        },
        account: {
          name: _(msg`AI Generated`),
          description: "This account's content is generated by AI.",
        },
        content: {
          name: _(msg`AI Generated`),
          description: _(msg`This content is generated by AI.`),
        },
      },
    }),
    [_],
  )
}
