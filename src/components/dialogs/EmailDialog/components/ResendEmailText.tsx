import {useState} from 'react'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {wait} from '#/lib/async/wait'
import {atoms as a, type TextStyleProp, useTheme} from '#/alf'
import {CheckThick_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {createStaticClick, InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Span, Text} from '#/components/Typography'

export function ResendEmailText({
  onPress,
  style,
}: TextStyleProp & {
  onPress: () => Promise<any>
}) {
  const t = useTheme()
  const {_} = useLingui()
  const [status, setStatus] = useState<'sending' | 'success' | null>(null)

  const handleOnPress = async () => {
    setStatus('sending')
    try {
      await wait(1000, onPress())
      setStatus('success')
    } finally {
      setTimeout(() => {
        setStatus(null)
      }, 1000)
    }
  }

  return (
    <Text
      style={[a.italic, a.leading_snug, t.atoms.text_contrast_medium, style]}>
      <Trans>
        Don't see an email?{' '}
        <InlineLinkText
          label={_(msg`Resend`)}
          {...createStaticClick(() => {
            handleOnPress()
          })}>
          Click here to resend.
        </InlineLinkText>
      </Trans>{' '}
      <Span style={{top: 1}}>
        {status === 'sending' ? (
          <Loader size="xs" />
        ) : status === 'success' ? (
          <Check size="xs" fill={t.palette.positive_500} />
        ) : null}
      </Span>
    </Text>
  )
}
