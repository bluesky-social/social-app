import React, {useRef, useState} from 'react'
import {TextInput, View} from 'react-native'
import {AppBskyActorDefs, AppBskyFeedPost, AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {EMBED_SCRIPT} from '#/lib/constants'
import {niceDate} from '#/lib/strings/time'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {CodeBrackets_Stroke2_Corner0_Rounded as CodeBrackets} from '#/components/icons/CodeBrackets'
import {Text} from '#/components/Typography'
import {Button, ButtonIcon, ButtonText} from '../Button'

export function EmbedDialog({
  control,
  postAuthor,
  postCid,
  postUri,
  record,
  timestamp,
}: {
  control: Dialog.DialogControlProps
  postAuthor: AppBskyActorDefs.ProfileViewBasic
  postCid: string
  postUri: string
  record: AppBskyFeedPost.Record
  timestamp: string
}) {
  const t = useTheme()
  const {_} = useLingui()
  const ref = useRef<TextInput>(null)
  const [copied, setCopied] = useState(false)

  // reset copied state after 2 seconds
  React.useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [copied])

  const snippet = React.useMemo(() => {
    const pAttrs =
      record.langs && record.langs.length > 0
        ? ` lang="${record.langs.at(0)}"`
        : ''

    const profileHref = toShareUrl(['/profile', postAuthor.did].join('/'))
    const urip = new AtUri(postUri)
    const href = toShareUrl(
      ['/profile', postAuthor.did, 'post', urip.rkey].join('/'),
    )

    return `<blockquote class="bluesky-embed" data-bluesky-uri="${postUri}" data-bluesky-cid="${postCid}"><p${pAttrs}>${
      record.text
    }${
      record.embed ? `<br><br><a href="${href}">[image or embed]</a>` : ''
    }</p>&mdash; ${
      postAuthor.displayName || postAuthor.handle
    } (<a href="${profileHref}">@${
      postAuthor.handle
    }</a>) <a href="${href}">${niceDate(
      timestamp,
    )}</a></blockquote><script async src="${EMBED_SCRIPT}" charset="utf-8"></script>`
  }, [postUri, postCid, record, timestamp, postAuthor])

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.Inner label="Embed post" style={[a.gap_md, {maxWidth: 500}]}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Embed post</Trans>
          </Text>
          <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
            <Trans>
              Embed this post in your website. Simply copy the following snippet
              and paste it into the HTML code of your website.
            </Trans>
          </Text>
        </View>

        <View style={[a.flex_row, a.gap_sm]}>
          <TextField.Root>
            <TextField.Icon icon={CodeBrackets} />
            <TextField.Input
              label={_(msg`Embed HTML code`)}
              editable={false}
              selection={{start: 0, end: snippet.length}}
              value={snippet}
              style={{}}
            />
          </TextField.Root>
          <Button
            label={_(msg`Copy code`)}
            color="primary"
            variant="solid"
            size="medium"
            onPress={() => {
              ref.current?.focus()
              ref.current?.setSelection(0, snippet.length)
              navigator.clipboard.writeText(snippet)
              setCopied(true)
            }}>
            {copied ? (
              <>
                <ButtonIcon icon={Check} />
                <ButtonText>
                  <Trans>Copied!</Trans>
                </ButtonText>
              </>
            ) : (
              <ButtonText>
                <Trans>Copy code</Trans>
              </ButtonText>
            )}
          </Button>
        </View>

        <Dialog.Close />
      </Dialog.Inner>
    </Dialog.Outer>
  )
}
