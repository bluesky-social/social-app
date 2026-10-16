import {View} from 'react-native'
import {type ModerationUI} from '@bsky/sdk/moderation'

import {atoms as a, useTheme} from '#/alf'
import {ButtonText} from '#/components/Button'
import {Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {ContentHider} from '#/components/moderation/ContentHider'
import {Text} from '#/components/Typography'

export function PreviewContent({
  testID,
  title,
  leading,
  children,
  metadataText = [],
  loading = false,
  moderation,
  to,
  openLabel,
  openTestID = `${testID}Open`,
}: {
  testID: string
  title: string
  leading?: React.ReactNode
  children?: React.ReactNode
  metadataText?: string[]
  loading?: boolean
  moderation?: ModerationUI
  to?: React.ComponentProps<typeof Link>['to']
  openLabel?: string
  openTestID?: string
}) {
  const t = useTheme()

  return (
    <ContentHider testID={testID} modui={moderation}>
      <View style={[a.flex_row, a.gap_sm]}>
        {leading}
        <View style={[a.flex_1, a.gap_sm]}>
          <Text emoji style={[a.text_md, a.font_semi_bold]}>
            {title}
          </Text>
          {loading ? <Loader size="md" /> : children}
          {!loading && metadataText.length ? (
            <View style={[a.gap_2xs]}>
              {metadataText.map((text, index) => (
                <Text
                  key={index}
                  emoji
                  style={[a.text_sm, t.atoms.text_contrast_medium]}>
                  {text}
                </Text>
              ))}
            </View>
          ) : null}
          {!loading && to && openLabel ? (
            <View style={[a.align_start]}>
              <Link
                testID={openTestID}
                to={to}
                label={openLabel}
                size="tiny"
                color="secondary">
                <ButtonText>{openLabel}</ButtonText>
              </Link>
            </View>
          ) : null}
        </View>
      </View>
    </ContentHider>
  )
}
