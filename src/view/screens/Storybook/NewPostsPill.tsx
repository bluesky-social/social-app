import {useState} from 'react'
import {Image as RNImage, ScrollView, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, ThemeProvider, useAlf, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {
  NewPostsPill as Pill,
  type NewPostsPillAuthor,
  type NewPostsPillVariant,
} from '#/components/NewPostsPill'
import {Text} from '#/components/Typography'

const avatars: NewPostsPillAuthor[] = [
  {
    did: 'storybook:one',
    avatar: RNImage.resolveAssetSource(require('../../../../assets/kawaii.png'))
      ?.uri,
  },
  {
    did: 'storybook:two',
    avatar: RNImage.resolveAssetSource(
      require('../../../../assets/icons/community/germ_logo.webp'),
    )?.uri,
  },
  {
    did: 'storybook:three',
    avatar: RNImage.resolveAssetSource(
      require('../../../../assets/kawaii_smol.png'),
    )?.uri,
  },
]

const cases: {
  name: string
  variant?: NewPostsPillVariant
  count?: number
  authors?: NewPostsPillAuthor[]
  showArrow?: boolean
}[] = [
  {name: 'Loaded, count unknown', count: 0},
  {name: 'Loaded, one post', count: 1, authors: avatars},
  {name: 'Loaded, three posts', count: 3, authors: avatars},
  {name: 'Four posts, one face', count: 4, authors: avatars.slice(0, 1)},
  {name: 'Many posts, two faces', count: 40, authors: avatars.slice(0, 2)},
  {name: 'Many posts, three faces', count: 40, authors: avatars},
  {name: 'Many posts, no faces', count: 40},
  {
    name: 'Missing avatar',
    count: 4,
    authors: [{did: 'storybook:missing'}, ...avatars.slice(0, 1)],
  },
  {
    name: 'Broken avatar',
    count: 4,
    authors: [
      ...avatars.slice(0, 1),
      {did: 'storybook:broken', avatar: 'https://example.invalid/x.png'},
    ],
  },
  {name: 'Fetch new posts', variant: 'newPostsToFetch'},
  {name: 'List refresh points up', variant: 'newPostsToFetch', showArrow: true},
  {name: 'Notifications', variant: 'new'},
  {name: 'Scroll to top', variant: 'scrollToTop'},
]

/** Offline fixtures: no feed, account, pager, or analytics provider required. */
export function NewPostsPill() {
  const t = useTheme()
  const {t: l} = useLingui()
  const {fonts} = useAlf()
  const [visible, setVisible] = useState(true)
  const [presses, setPresses] = useState(0)

  return (
    <View style={[a.gap_lg]}>
      <Text style={[a.text_3xl, a.font_bold]}>New posts pill</Text>
      <Text>
        Static cases use bundled images. Background and resume the app while the
        interactive facepile is visible to check the glass rebuild without
        reloading the faces. Turn on Reduce Motion in device settings to check
        the non-animated path.
      </Text>

      <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
        <Button
          color="secondary"
          size="small"
          label="Use default font size"
          onPress={() => fonts.setFontScale('0')}>
          <ButtonText>Default font</ButtonText>
        </Button>
        <Button
          color="secondary"
          size="small"
          label="Use large font size"
          onPress={() => fonts.setFontScale('1')}>
          <ButtonText>Large font</ButtonText>
        </Button>
      </View>

      <View style={[a.flex_row, a.flex_wrap, a.gap_md]}>
        {cases.map(({name, ...props}) => (
          <View
            key={name}
            style={[
              a.p_sm,
              a.rounded_md,
              t.atoms.bg_contrast_25,
              {width: 220, minHeight: 88},
            ]}>
            <Text style={[a.text_xs]}>{name}</Text>
            <Pill visible {...props} onPress={() => setPresses(n => n + 1)} />
          </View>
        ))}
      </View>

      <Text style={[a.font_bold]}>Themes</Text>
      <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
        {(['light', 'dim', 'dark'] as const).map(theme => (
          <ThemeProvider key={theme} theme={theme}>
            <ThemeCase name={theme} />
          </ThemeProvider>
        ))}
      </View>

      <Text style={[a.font_bold]}>Long translated wording</Text>
      <View
        style={[
          a.p_sm,
          t.atoms.bg_contrast_25,
          {maxWidth: 260, minHeight: 90},
        ]}>
        <Pill
          visible
          variant="newPostsToFetch"
          text={l`New posts are ready to load from the people you follow`}
          label={l`Load new posts from the people you follow`}
          onPress={() => setPresses(n => n + 1)}
        />
      </View>

      <Text style={[a.font_bold]}>Show, hide, re-show, press during exit</Text>
      <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
        <Button
          color="secondary"
          size="small"
          label="Show pill"
          onPress={() => setVisible(true)}>
          <ButtonText>Show</ButtonText>
        </Button>
        <Button
          color="secondary"
          size="small"
          label="Hide pill"
          onPress={() => setVisible(false)}>
          <ButtonText>Hide</ButtonText>
        </Button>
        <Text>Presses: {presses}</Text>
      </View>
      <View style={[a.justify_center, {height: 80}]}>
        <Pill
          visible={visible}
          count={8}
          authors={avatars}
          onPress={() => setPresses(n => n + 1)}
        />
      </View>

      <Text style={[a.font_bold]}>Scrollable header placement</Text>
      <HeaderFixture />
    </View>
  )
}

function ThemeCase({name}: {name: string}) {
  const t = useTheme()
  return (
    <View style={[a.p_md, t.atoms.bg, {width: 160, minHeight: 88}]}>
      <Text>{name}</Text>
      <Pill visible count={4} authors={avatars} onPress={() => {}} />
    </View>
  )
}

function HeaderFixture() {
  const t = useTheme()
  const [scrollY, setScrollY] = useState(0)
  const [header, setHeader] = useState<'home' | 'pager' | 'web'>('home')
  const expandedHeight = header === 'home' ? 96 : header === 'pager' ? 76 : 80
  const pinnedHeight = header === 'home' ? 48 : header === 'pager' ? 44 : 40
  const headerHeight = Math.max(pinnedHeight, expandedHeight - scrollY)

  return (
    <View style={[a.gap_sm]}>
      <View style={[a.flex_row, a.gap_sm, a.flex_wrap]}>
        {(['home', 'pager', 'web'] as const).map(value => (
          <Button
            key={value}
            color={header === value ? 'primary' : 'secondary'}
            size="small"
            label={`Preview ${value} header`}
            onPress={() => setHeader(value)}>
            <ButtonText>{value}</ButtonText>
          </Button>
        ))}
      </View>
      <View
        style={[
          a.rounded_md,
          t.atoms.border_contrast_low,
          a.border,
          {height: 280, maxWidth: 440, overflow: 'hidden'},
        ]}>
        <ScrollView
          scrollEventThrottle={16}
          onScroll={event => setScrollY(event.nativeEvent.contentOffset.y)}>
          <View style={{height: expandedHeight}} />
          {Array.from({length: 12}, (_, index) => (
            <View
              key={index}
              style={[a.p_md, a.border_b, t.atoms.border_contrast_low]}>
              <Text>Example post {index + 1}</Text>
            </View>
          ))}
        </ScrollView>
        <View
          pointerEvents="none"
          style={[
            a.absolute,
            a.z_10,
            t.atoms.bg,
            a.justify_center,
            a.px_md,
            {top: 0, left: 0, right: 0, height: headerHeight},
          ]}>
          <Text>{header} header</Text>
        </View>
        <Pill
          visible
          count={5}
          authors={avatars}
          style={[
            a.absolute,
            {top: headerHeight + 16, left: 0, right: 0, zIndex: 5},
          ]}
          onPress={() => {}}
        />
      </View>
    </View>
  )
}
