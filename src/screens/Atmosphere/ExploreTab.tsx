import {ScrollView, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {BlockDrawerGesture} from '#/view/shell/BlockDrawerGesture'
import {atoms as a, tokens, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {ArticleCard} from './components/ArticleCard'
import {PhotoCard} from './components/PhotoCard'
import {getAtmosphereArticles, getAtmospherePhotos} from './exploreData'

const CARD_WIDTH = 216
const PHOTO_CARD_WIDTH = 160
const articles = getAtmosphereArticles()
const photos = getAtmospherePhotos()

export function AtmosphereExploreTab() {
  const {t: l} = useLingui()

  return (
    <Layout.Content
      testID="atmosphereExploreTab"
      contentContainerStyle={[a.pb_xl]}>
      <View style={[a.gap_lg, a.px_lg, a.py_lg]}>
        <View style={[a.gap_md]}>
          <ExploreSectionHeader
            title={l`Featured articles`}
            label={l`See more articles`}
          />
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
                <ArticleCard
                  key={article.id}
                  article={article}
                  width={CARD_WIDTH}
                />
              ))}
            </ScrollView>
          </BlockDrawerGesture>
        </View>
        <View style={[a.gap_md]}>
          <ExploreSectionHeader
            title={l`Featured photos`}
            label={l`See more photos`}
          />
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
                },
              ]}>
              {photos.map(photo => (
                <View key={photo.id} style={{width: PHOTO_CARD_WIDTH}}>
                  <PhotoCard photo={photo} />
                </View>
              ))}
            </ScrollView>
          </BlockDrawerGesture>
        </View>
      </View>
    </Layout.Content>
  )
}

function ExploreSectionHeader({
  title,
  label,
}: {
  title: React.ReactNode
  label: string
}) {
  const t = useTheme()

  return (
    <View style={[a.flex_row, a.align_center, a.justify_between, a.gap_sm]}>
      <Text accessibilityRole="header" style={[a.text_lg, a.font_semi_bold]}>
        {title}
      </Text>
      <Link
        to="/atmosphere"
        label={label}
        accessibilityHint=""
        onPress={event => {
          event.preventDefault()
          return false
        }}>
        {({pressed, hovered}) => {
          const color =
            pressed || hovered ? t.palette.contrast_800 : t.palette.contrast_500

          return (
            <Text style={[a.text_sm, a.font_medium, {color}]}>
              <Trans>See more</Trans>
            </Text>
          )
        }}
      </Link>
    </View>
  )
}
