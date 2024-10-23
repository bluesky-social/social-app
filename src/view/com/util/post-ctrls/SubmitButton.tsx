import React from 'react'
import {TextInput, View} from 'react-native'
import {AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {isWeb} from '#/platform/detection'
import {writeFeedSubmissionRecords} from '#/state/queries/feedgens'
import {useAgent} from '#/state/session'
import {ListMethods} from '#/view/com/util/List'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, native, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useFeedsAutocomplete} from '#/components/Composer/FeedsSelector/useFeedsAutocomplete'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {Text} from '#/components/Typography'

type Item =
  | {
      type: 'feed'
      key: string
      checked: boolean
      feed: AppBskyFeedDefs.GeneratorView
    }
  | {
      type: 'empty'
      key: string
      message: string
    }
  | {
      type: 'placeholder'
      key: string
    }
  | {
      type: 'error'
      key: string
    }

export function FeedSelectDialog({
  control,
  postUri,
}: {
  control: Dialog.DialogOuterProps['control']
  postUri: string
}) {
  const t = useTheme()
  const {_} = useLingui()
  const listRef = React.useRef<ListMethods>(null)
  const inputRef = React.useRef<TextInput>(null)
  const queryClient = useQueryClient()
  const agent = useAgent()

  const [uris, setUris] = React.useState<string[]>([])

  const {
    query: searchText,
    suggestions: results,
    feeds,
    setQuery: setSearchText,
  } = useFeedsAutocomplete()

  const onToggleFeed = React.useCallback(
    (uri: string, checked: boolean) => {
      if (checked) {
        setUris(Array.from(new Set([uri, ...uris])))
      } else {
        setUris(uris.filter(u => u !== uri))
      }
    },
    [uris],
  )

  const items = React.useMemo(() => {
    let _items: Item[] = []

    if (searchText.length) {
      if (results?.length) {
        for (const feed of results) {
          _items.push({
            type: 'feed',
            key: feed.uri,
            checked: uris.includes(feed.uri),
            feed,
          })
        }
      }
    } else {
      if (feeds?.length) {
        for (const feed of feeds) {
          _items.push({
            type: 'feed',
            key: feed.uri,
            checked: uris.includes(feed.uri),
            feed,
          })
        }
      }
    }
    return _items
  }, [results, uris, feeds, searchText])

  if (searchText && !items.length) {
    items.push({type: 'empty', key: 'empty', message: _(msg`No results`)})
  }

  const renderItems = React.useCallback(
    ({item}: {item: Item}) => {
      switch (item.type) {
        case 'feed': {
          return (
            <FeedCard
              key={item.key}
              checked={item.checked}
              feed={item.feed}
              onToggle={onToggleFeed}
            />
          )
        }
        case 'placeholder': {
          return <ProfileCardSkeleton key={item.key} />
        }
        case 'empty': {
          return <Empty key={item.key} message={item.message} />
        }
        default:
          return null
      }
    },
    [onToggleFeed],
  )

  React.useLayoutEffect(() => {
    if (isWeb) {
      setImmediate(() => {
        inputRef?.current?.focus()
      })
    }
  }, [])

  const listHeader = React.useMemo(() => {
    return (
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.relative,
          a.pt_xs,
          a.pb_xs,
          a.pl_lg,
          a.pr_xs,
          a.border_b,
          t.atoms.border_contrast_low,
          t.atoms.bg,
        ]}>
        <View style={[a.flex_1]}>
          <SearchInput
            inputRef={inputRef}
            value={searchText}
            onChangeText={text => {
              setSearchText(text)
              listRef.current?.scrollToOffset({offset: 0, animated: false})
            }}
            onEscape={control.close}
          />
        </View>

        <Button
          label={_(msg`Submit`)}
          size="large"
          shape="default"
          variant={isWeb ? 'ghost' : 'solid'}
          color="primary"
          style={[a.z_20]}
          onPress={async () => {
            await writeFeedSubmissionRecords({
              agent,
              records: uris.map(feedUri => ({
                feedUri,
                postUri,
              })),
            })
            Toast.show('Post submitted')
            for (const feedUri of uris) {
              queryClient.invalidateQueries({
                queryKey: ['post-feed', 'feedgen|' + feedUri, {}],
              })
            }
            control.close()
          }}>
          <ButtonText>Submit</ButtonText>
        </Button>
      </View>
    )
  }, [
    queryClient,
    t.atoms.border_contrast_low,
    t.atoms.bg,
    uris,
    _,
    searchText,
    control,
    setSearchText,
    postUri,
    agent,
  ])

  return (
    <Dialog.InnerFlatList
      ref={listRef}
      data={items}
      renderItem={renderItems}
      ListHeaderComponent={listHeader}
      stickyHeaderIndices={[0]}
      keyExtractor={(item: Item) => item.key}
      style={[
        web([a.py_0, {height: '100vh', maxHeight: 600}, a.px_0]),
        native({height: '100%'}),
        a.p_0,
      ]}
      webInnerStyle={[a.p_0, {maxWidth: 500, minWidth: 200}]}
      keyboardDismissMode="on-drag"
    />
  )
}

function FeedCard({
  checked,
  feed,
  onToggle,
}: {
  checked: boolean
  feed: AppBskyFeedDefs.GeneratorView
  onToggle: (uri: string, checked: boolean) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const displayName = feed.displayName

  const handleOnPress = React.useCallback(
    (selected: boolean) => {
      onToggle(feed.uri, selected)
    },
    [onToggle, feed.uri],
  )

  return (
    <Toggle.Item
      label={_(msg`Add post to ${displayName}`)}
      name={_(msg`Add post to ${displayName}`)}
      value={checked}
      onChange={handleOnPress}>
      {({hovered, pressed, focused}) => (
        <View
          style={[
            a.flex_1,
            a.py_md,
            a.px_lg,
            a.gap_md,
            a.align_center,
            a.flex_row,
            pressed || focused
              ? t.atoms.bg_contrast_25
              : hovered
              ? t.atoms.bg_contrast_50
              : t.atoms.bg,
          ]}>
          <UserAvatar size={42} avatar={feed.avatar} type="algo" />
          <View style={[a.flex_1, a.gap_2xs]}>
            <Text
              style={[t.atoms.text, a.font_bold, a.leading_tight, a.self_start]}
              numberOfLines={1}
              emoji>
              {displayName}
            </Text>
            <Text
              style={[
                t.atoms.text,
                a.leading_tight,
                a.self_start,
                t.atoms.text_contrast_medium,
              ]}
              numberOfLines={1}
              emoji>
              by @{feed.creator.handle}
            </Text>
          </View>
          <Toggle.Checkbox />
        </View>
      )}
    </Toggle.Item>
  )
}

function ProfileCardSkeleton() {
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_1,
        a.py_md,
        a.px_lg,
        a.gap_md,
        a.align_center,
        a.flex_row,
      ]}>
      <View
        style={[
          a.rounded_full,
          {width: 42, height: 42},
          t.atoms.bg_contrast_25,
        ]}
      />

      <View style={[a.flex_1, a.gap_sm]}>
        <View
          style={[
            a.rounded_xs,
            {width: 80, height: 14},
            t.atoms.bg_contrast_25,
          ]}
        />
        <View
          style={[
            a.rounded_xs,
            {width: 120, height: 10},
            t.atoms.bg_contrast_25,
          ]}
        />
      </View>
    </View>
  )
}

function Empty({message}: {message: string}) {
  const t = useTheme()
  return (
    <View style={[a.p_lg, a.py_xl, a.align_center, a.gap_md]}>
      <Text style={[a.text_sm, a.italic, t.atoms.text_contrast_high]}>
        {message}
      </Text>

      <Text style={[a.text_xs, t.atoms.text_contrast_low]}>(╯°□°)╯︵ ┻━┻</Text>
    </View>
  )
}

function SearchInput({
  value,
  onChangeText,
  onEscape,
  inputRef,
}: {
  value: string
  onChangeText: (text: string) => void
  onEscape: () => void
  inputRef: React.RefObject<TextInput>
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const interacted = hovered || focused

  return (
    <View
      {...web({
        onMouseEnter,
        onMouseLeave,
      })}
      style={[a.flex_row, a.align_center, a.gap_sm]}>
      <Search
        size="md"
        fill={interacted ? t.palette.primary_500 : t.palette.contrast_300}
      />

      <TextInput
        // @ts-ignore bottom sheet input types issue — esb
        ref={inputRef}
        placeholder={_(msg`Search`)}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        style={[a.flex_1, a.py_md, a.text_md, t.atoms.text]}
        placeholderTextColor={t.palette.contrast_500}
        keyboardAppearance={t.name === 'light' ? 'light' : 'dark'}
        returnKeyType="search"
        clearButtonMode="while-editing"
        maxLength={50}
        onKeyPress={({nativeEvent}) => {
          if (nativeEvent.key === 'Escape') {
            onEscape()
          }
        }}
        autoCorrect={false}
        autoComplete="off"
        autoCapitalize="none"
        autoFocus
        accessibilityLabel={_(msg`Search profiles`)}
        accessibilityHint={_(msg`Search profiles`)}
      />
    </View>
  )
}
