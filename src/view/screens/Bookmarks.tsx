import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ComposeIcon2} from '#/lib/icons'
import {
  BookmarksTabNavigatorParams,
  NativeStackScreenProps,
} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {useMyBookmarksQuery} from '#/state/queries/my-bookmarks'
import {useComposerControls} from '#/state/shell/composer'
import {FAB} from '#/view/com/util/fab/FAB'
import {atoms as a} from '#/alf'
import * as Layout from '#/components/Layout'
import {MyBookmarks} from '../com/bookmarks/MyBookmarks'

type Props = NativeStackScreenProps<BookmarksTabNavigatorParams, 'Bookmarks'>
export function BookmarksScreen({}: Props) {
  const {_} = useLingui()
  const {openComposer} = useComposerControls()
  const {} = useMyBookmarksQuery()

  return (
    <Layout.Screen testID="bookmarksScreen">
      <Layout.Header.Outer noBottomBorder sticky={false}>
        <Layout.Header.MenuButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Bookmarks</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>
      <MyBookmarks style={a.flex_grow} />
      <FAB
        testID="composeFAB"
        onPress={() => openComposer({})}
        icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
        accessibilityRole="button"
        accessibilityLabel={_(msg`New post`)}
        accessibilityHint=""
      />
    </Layout.Screen>
  )
}
