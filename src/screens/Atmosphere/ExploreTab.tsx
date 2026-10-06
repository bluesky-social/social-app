import {ScrollView, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, tokens, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {ExploreCard} from './components/ExploreCard'
import {getAtmosphereArticles} from './exploreData'

const CARD_WIDTH = 216
const articles = getAtmosphereArticles()

export function AtmosphereExploreTab() {
  const {t: l} = useLingui()
  const t = useTheme()

  return (
    <Layout.Content
      testID="atmosphereExploreTab"
      contentContainerStyle={[a.pb_xl]}>
      <View style={[a.gap_lg, a.px_lg, a.py_lg]}>
        <View style={[a.gap_md]}>
          <View
            style={[a.flex_row, a.align_center, a.justify_between, a.gap_sm]}>
            <Text
              accessibilityRole="header"
              style={[a.text_lg, a.font_semi_bold]}>
              <Trans>Featured articles</Trans>
            </Text>
            <Link
              to="/atmosphere"
              label={l`See more articles`}
              onPress={event => {
                event.preventDefault()
                return false
              }}>
              {({pressed, hovered}) => {
                const color =
                  pressed || hovered
                    ? t.palette.contrast_800
                    : t.palette.contrast_500

                return (
                  <>
                    <Text style={[a.text_sm, a.font_medium, {color}]}>
                      <Trans>See more</Trans>
                    </Text>
                  </>
                )
              }}
            </Link>
          </View>
          <BlockDrawerGesture>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{marginHorizontal: -tokens.space.lg}}
              contentContainerStyle={[
                a.flex_row,
                a.flex_nowrap,
                a.align_stretch,
                a.gap_md,
                {
                  paddingLeft: tokens.space.lg,
                  paddingRight: tokens.space.lg,
                  paddingBottom: tokens.space.md,
                },
              ]}>
              {articles.map(article => (
                <ExploreCard
                  key={article.id}
                  article={article}
                  width={CARD_WIDTH}
                />
              ))}
            </ScrollView>
          </BlockDrawerGesture>
        </View>
      </View>
    </Layout.Content>
  )
}
