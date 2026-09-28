import {useState} from 'react'
import {View} from 'react-native'

import {DISCOVER_FEED_URI, TIMELINE_SAVED_FEED} from '#/lib/constants'
import {Provider as ShellLayoutProvider} from '#/state/shell/shell-layout'
import {HomeHeader} from '#/view/com/home/HomeHeader'
import {Pager} from '#/view/com/pager/Pager'
import {PagerWithHeader} from '#/view/com/pager/PagerWithHeader'
import {List, type ListRef} from '#/view/com/util/List'
import {
  HomeHeaderModeProvider,
  MainScrollProvider,
} from '#/view/com/util/MainScrollProvider'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useHeaderOffset} from '#/components/hooks/useHeaderOffset'
import * as Layout from '#/components/Layout'
import {
  NewPostsPill,
  type NewPostsPillAuthor,
  useHomeHeaderPillPlacement,
  usePagerHeaderPillPlacement,
  useScreenHeaderPillPlacement,
} from '#/components/NewPostsPill'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

type PillProps = {
  visible: boolean
  count: number
  authors: NewPostsPillAuthor[]
  onPress: () => void
}

const HOME_FEEDS = [
  {displayName: 'Following', uri: TIMELINE_SAVED_FEED.value},
  {displayName: 'Discover', uri: DISCOVER_FEED_URI},
]
const ROWS = Array.from({length: 40}, (_, index) => index + 1)

/**
 * The real headers and placement hooks in phone-height frames, one per header
 * kind. In each, the pill should sit 16pt under the header's bottom edge,
 * follow that edge as the header collapses, stay put and tappable once it has,
 * and slide in and out from behind it.
 */
export function NewPostsPillPlacement({
  authors,
}: {
  authors: NewPostsPillAuthor[]
}) {
  const [visible, setVisible] = useState(true)
  const [presses, setPresses] = useState(0)

  if (!IS_NATIVE) {
    return (
      <Text>
        Header placement is native-only: web keeps its Load Latest button.
      </Text>
    )
  }

  const pill = {
    visible,
    count: 5,
    authors,
    onPress: () => setPresses(n => n + 1),
  }

  return (
    <View style={[a.gap_md]}>
      <Text>
        Scroll inside each frame to collapse its header. The Home frame uses its
        own shell layout, so it does not disturb the real Home header.
      </Text>
      <View style={[a.flex_row, a.flex_wrap, a.align_center, a.gap_sm]}>
        <Button
          color="secondary"
          size="small"
          label="Show placed pills"
          onPress={() => setVisible(true)}>
          <ButtonText>Show</ButtonText>
        </Button>
        <Button
          color="secondary"
          size="small"
          label="Hide placed pills"
          onPress={() => setVisible(false)}>
          <ButtonText>Hide</ButtonText>
        </Button>
        <Text>Presses: {presses}</Text>
      </View>

      <Text style={[a.font_bold]}>Home header</Text>
      <HomeFixture {...pill} />

      <Text style={[a.font_bold]}>Pager header</Text>
      <PagerFixture {...pill} />

      <Text style={[a.font_bold]}>Screen header</Text>
      <Text>
        The shaded strip stands in for a top inset above the header, which the
        pill has to clear too.
      </Text>
      <ScreenFixture {...pill} />
    </View>
  )
}

/** Home's own pager, header and scroll handling, with a pill on each page. */
function HomeFixture(pill: PillProps) {
  const [page, setPage] = useState(0)
  return (
    <Frame>
      <ShellLayoutProvider>
        <HomeHeaderModeProvider>
          <Pager
            onPageSelected={setPage}
            renderTabBar={props => (
              <HomeHeader
                {...props}
                feeds={HOME_FEEDS}
                onPressSelected={() => {}}
              />
            )}>
            {HOME_FEEDS.map((feed, index) => (
              <HomeFixturePage
                key={feed.uri}
                {...pill}
                visible={pill.visible && page === index}
              />
            ))}
          </Pager>
        </HomeHeaderModeProvider>
      </ShellLayoutProvider>
    </Frame>
  )
}

function HomeFixturePage(pill: PillProps) {
  const headerOffset = useHeaderOffset()
  const placement = useHomeHeaderPillPlacement()
  return (
    <View collapsable={false} style={[a.flex_1]}>
      <MainScrollProvider>
        <FixtureList headerOffset={headerOffset} />
      </MainScrollProvider>
      <NewPostsPill {...pill} style={placement.style} />
    </View>
  )
}

/**
 * A real `PagerWithHeader`. Pinning keeps the title row on screen as Profile's
 * minimal header does; over-scroll lets the header follow a pull down, as
 * Profile's does.
 */
function PagerFixture(pill: PillProps) {
  const [pinned, setPinned] = useState(false)
  const [overScroll, setOverScroll] = useState(false)
  return (
    <View style={[a.gap_sm]}>
      <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
        <Button
          color={pinned ? 'primary' : 'secondary'}
          size="small"
          label="Toggle a pinned title row"
          onPress={() => setPinned(value => !value)}>
          <ButtonText>Pinned title</ButtonText>
        </Button>
        <Button
          color={overScroll ? 'primary' : 'secondary'}
          size="small"
          label="Toggle header over-scroll"
          onPress={() => setOverScroll(value => !value)}>
          <ButtonText>Over-scroll</ButtonText>
        </Button>
      </View>
      <Frame>
        <PagerWithHeader
          key={`${pinned}-${overScroll}`}
          items={['Posts', 'Media']}
          isHeaderReady
          allowHeaderOverScroll={overScroll}
          renderHeader={({setMinimumHeight}) => (
            <FixturePagerHeader
              setMinimumHeight={pinned ? setMinimumHeight : undefined}
            />
          )}>
          {({headerHeight, isFocused, scrollElRef}) => (
            <PagerFixturePage
              {...pill}
              visible={pill.visible && isFocused}
              headerHeight={headerHeight}
              scrollElRef={scrollElRef as ListRef}
            />
          )}
          {({headerHeight, isFocused, scrollElRef}) => (
            <PagerFixturePage
              {...pill}
              visible={pill.visible && isFocused}
              headerHeight={headerHeight}
              scrollElRef={scrollElRef as ListRef}
            />
          )}
        </PagerWithHeader>
      </Frame>
    </View>
  )
}

function FixturePagerHeader({
  setMinimumHeight,
}: {
  setMinimumHeight?: (height: number) => void
}) {
  const t = useTheme()
  return (
    <View style={[t.atoms.bg]}>
      <View
        style={[a.justify_end, a.p_md, t.atoms.bg_contrast_50, {height: 120}]}>
        <Text>Banner that scrolls away</Text>
      </View>
      <View
        onLayout={
          setMinimumHeight
            ? e => setMinimumHeight(e.nativeEvent.layout.height)
            : undefined
        }
        style={[a.px_md, a.py_md]}>
        <Text style={[a.font_bold]}>
          {setMinimumHeight ? 'Pinned title row' : 'Title row'}
        </Text>
      </View>
    </View>
  )
}

function PagerFixturePage({
  headerHeight,
  scrollElRef,
  ...pill
}: PillProps & {headerHeight: number; scrollElRef: ListRef}) {
  const placement = usePagerHeaderPillPlacement({headerHeight})
  return (
    <View style={[a.flex_1]}>
      <FixtureList ref={scrollElRef} headerOffset={headerHeight} />
      <NewPostsPill {...pill} style={placement.style} />
    </View>
  )
}

/** A plain `Layout.Header` that shares the pill's parent, as on a feed screen. */
function ScreenFixture(pill: PillProps) {
  const t = useTheme()
  const placement = useScreenHeaderPillPlacement()
  return (
    <Frame>
      <View style={[t.atoms.bg_contrast_25, {height: 24}]} />
      <Layout.Header.Outer onLayout={placement.onHeaderLayout}>
        <Layout.Header.Slot />
        <Layout.Header.Content>
          <Layout.Header.TitleText>Custom feed</Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <FixtureList />
      <NewPostsPill {...pill} style={placement.style} />
    </Frame>
  )
}

function Frame({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.overflow_hidden,
        a.rounded_md,
        a.border,
        t.atoms.border_contrast_low,
        t.atoms.bg,
        {height: 480},
      ]}>
      {children}
    </View>
  )
}

function FixtureList({
  ref,
  headerOffset,
}: {
  ref?: ListRef
  headerOffset?: number
}) {
  const t = useTheme()
  return (
    <List
      ref={ref}
      data={ROWS}
      keyExtractor={item => String(item)}
      headerOffset={headerOffset}
      nestedScrollEnabled
      renderItem={({item}) => (
        <View style={[a.p_md, a.border_b, t.atoms.border_contrast_low]}>
          <Text>Example post {item}</Text>
        </View>
      )}
    />
  )
}
