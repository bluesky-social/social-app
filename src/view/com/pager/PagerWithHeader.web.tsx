import * as React from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {useAnimatedRef} from 'react-native-reanimated'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {Pager, PagerRef, RenderTabBarFnProps} from '#/view/com/pager/Pager'
import {ListMethods} from '../util/List'
import {TabBar} from './TabBar'

export interface PagerWithHeaderChildParams {
  headerHeight: number
  isFocused: boolean
  scrollElRef: React.MutableRefObject<ListMethods | ScrollView | null>
}

export interface PagerWithHeaderProps {
  testID?: string
  children:
    | (((props: PagerWithHeaderChildParams) => JSX.Element) | null)[]
    | ((props: PagerWithHeaderChildParams) => JSX.Element)
  items: string[]
  isHeaderReady: boolean
  renderHeader?: () => JSX.Element
  initialPage?: number
  onPageSelected?: (index: number) => void
  onCurrentPageSelected?: (index: number) => void
}
export const PagerWithHeader = React.forwardRef<PagerRef, PagerWithHeaderProps>(
  function PageWithHeaderImpl(
    {
      children,
      testID,
      items,
      isHeaderReady,
      renderHeader,
      initialPage,
      onPageSelected,
      onCurrentPageSelected,
    }: PagerWithHeaderProps,
    ref,
  ) {
    const [currentPage, setCurrentPage] = React.useState(0)

    const renderTabBar = React.useCallback(
      (props: RenderTabBarFnProps) => {
        return (
          <PagerTabBar
            items={items}
            renderHeader={renderHeader}
            isHeaderReady={isHeaderReady}
            currentPage={currentPage}
            onCurrentPageSelected={onCurrentPageSelected}
            onSelect={props.onSelect}
            tabBarAnchor={props.tabBarAnchor}
            testID={testID}
          />
        )
      },
      [
        items,
        isHeaderReady,
        renderHeader,
        currentPage,
        onCurrentPageSelected,
        testID,
      ],
    )

    const onPageSelectedInner = React.useCallback(
      (index: number) => {
        setCurrentPage(index)
        onPageSelected?.(index)
      },
      [onPageSelected, setCurrentPage],
    )

    const onPageSelecting = React.useCallback((index: number) => {
      setCurrentPage(index)
    }, [])

    return (
      <Pager
        ref={ref}
        testID={testID}
        initialPage={initialPage}
        onPageSelected={onPageSelectedInner}
        onPageSelecting={onPageSelecting}
        renderTabBar={renderTabBar}>
        {toArray(children)
          .filter(Boolean)
          .map((child, i) => {
            const isReady = isHeaderReady
            return (
              <View
                key={i}
                collapsable={false}
                style={{
                  display: isReady ? undefined : 'none',
                }}>
                <PagerItem isFocused={i === currentPage} renderTab={child} />
              </View>
            )
          })}
      </Pager>
    )
  },
)

let PagerTabBar = ({
  currentPage,
  items,
  isHeaderReady,
  testID,
  renderHeader,
  onCurrentPageSelected,
  onSelect,
  tabBarAnchor,
}: {
  currentPage: number
  items: string[]
  testID?: string
  renderHeader?: () => JSX.Element
  isHeaderReady: boolean
  onCurrentPageSelected?: (index: number) => void
  onSelect?: (index: number) => void
  tabBarAnchor?: JSX.Element | null | undefined
}): React.ReactNode => {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  return (
    <>
      <View
        style={[
          !isMobile && styles.headerContainerDesktop,
          pal.border,
          !isHeaderReady && styles.loadingHeader,
        ]}>
        {renderHeader?.()}
      </View>
      {tabBarAnchor}
      <View
        style={[
          styles.tabBarContainer,
          isMobile
            ? styles.tabBarContainerMobile
            : styles.tabBarContainerDesktop,
          pal.border,
          {
            display: isHeaderReady ? undefined : 'none',
          },
        ]}>
        <TabBar
          testID={testID}
          items={items}
          selectedPage={currentPage}
          onSelect={onSelect}
          onPressSelected={onCurrentPageSelected}
        />
      </View>
    </>
  )
}
PagerTabBar = React.memo(PagerTabBar)

function PagerItem({
  isFocused,
  renderTab,
}: {
  isFocused: boolean
  renderTab: ((props: PagerWithHeaderChildParams) => JSX.Element) | null
}) {
  const scrollElRef = useAnimatedRef()
  if (renderTab == null) {
    return null
  }
  return renderTab({
    headerHeight: 0,
    isFocused,
    scrollElRef: scrollElRef as React.MutableRefObject<
      ListMethods | ScrollView | null
    >,
  })
}

const styles = StyleSheet.create({
  headerContainerDesktop: {
    marginHorizontal: 'auto',
    width: 600,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  tabBarContainer: {
    // @ts-ignore web-only
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  tabBarContainerDesktop: {
    marginHorizontal: 'auto',
    width: 600,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  tabBarContainerMobile: {
    paddingHorizontal: 0,
  },
  loadingHeader: {
    borderColor: 'transparent',
  },
})

function toArray<T>(v: T | T[]): T[] {
  if (Array.isArray(v)) {
    return v
  }
  return [v]
}
