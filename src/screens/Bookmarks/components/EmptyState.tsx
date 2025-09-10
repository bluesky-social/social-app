import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {ButtonText} from '#/components/Button'
import {BookmarkDeleteLarge} from '#/components/icons/Bookmark'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

export function EmptyState() {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <View
      style={[
        a.align_center,
        {
          paddingVertical: 64,
        },
      ]}>
      <BookmarkDeleteLarge
        width={64}
        fill={t.atoms.text_contrast_medium.color}
      />
      <View style={[a.pt_sm]}>
        <Text
          style={[
            a.text_lg,
            a.font_medium,
            a.text_center,
            t.atoms.text_contrast_medium,
          ]}>
          <Trans>Nothing saved yet</Trans>
        </Text>
      </View>
      <View style={[a.pt_2xl]}>
        <Link
          to="/"
          action="navigate"
          label={_(
            msg({
              message: `Go home`,
              context: `Button to go back to the home timeline`,
            }),
          )}
          size="small"
          color="secondary">
          <ButtonText>
            <Trans context="Button to go back to the home timeline">
              Go home
            </Trans>
          </ButtonText>
        </Link>
      </View>
    </View>
  )
}
