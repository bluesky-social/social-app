import React, {useCallback} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, Pressable, StyleSheet, View} from 'react-native'
import {AppBskyGraphDefs as GraphDefs} from '@atproto/api'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {Text} from '../util/text/Text'
import {UserAvatar} from '../util/UserAvatar'
import {ListsList} from '../lists/ListsList'
import {ListsListModel} from 'state/models/lists/lists-list'
import {ListMembershipModel} from 'state/models/content/list-membership'
import {Button} from '../util/forms/Button'
import * as Toast from '../util/Toast'
import {useStores} from 'state/index'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb, isAndroid} from 'platform/detection'
import isEqual from 'lodash.isequal'
import {logger} from '#/logger'

export const snapPoints = ['fullscreen']

export const Component = observer(function UserAddRemoveListsImpl({
  subject,
  displayName,
  onAdd,
  onRemove,
}: {
  subject: string
  displayName: string
  onAdd?: (listUri: string) => void
  onRemove?: (listUri: string) => void
}) {
  const store = useStores()
  const pal = usePalette('default')
  const palPrimary = usePalette('primary')
  const palInverted = usePalette('inverted')
  const [originalSelections, setOriginalSelections] = React.useState<string[]>(
    [],
  )
  const [selected, setSelected] = React.useState<string[]>([])
  const [membershipsLoaded, setMembershipsLoaded] = React.useState(false)

  const listsList: ListsListModel = React.useMemo(
    () => new ListsListModel(store, store.me.did),
    [store],
  )
  const memberships: ListMembershipModel = React.useMemo(
    () => new ListMembershipModel(store, subject),
    [store, subject],
  )
  React.useEffect(() => {
    listsList.refresh()
    memberships.fetch().then(
      () => {
        const ids = memberships.memberships.map(m => m.value.list)
        setOriginalSelections(ids)
        setSelected(ids)
        setMembershipsLoaded(true)
      },
      err => {
        logger.error('Failed to fetch memberships', {error: err})
      },
    )
  }, [memberships, listsList, store, setSelected, setMembershipsLoaded])

  const onPressCancel = useCallback(() => {
    store.shell.closeModal()
  }, [store])

  const onPressSave = useCallback(async () => {
    let changes
    try {
      changes = await memberships.updateTo(selected)
    } catch (err) {
      logger.error('Failed to update memberships', {error: err})
      return
    }
    Toast.show('Lists updated')
    for (const uri of changes.added) {
      onAdd?.(uri)
    }
    for (const uri of changes.removed) {
      onRemove?.(uri)
    }
    store.shell.closeModal()
  }, [store, selected, memberships, onAdd, onRemove])

  const onToggleSelected = useCallback(
    (uri: string) => {
      if (selected.includes(uri)) {
        setSelected(selected.filter(uri2 => uri2 !== uri))
      } else {
        setSelected([...selected, uri])
      }
    },
    [selected, setSelected],
  )

  const renderItem = useCallback(
    (list: GraphDefs.ListView, index: number) => {
      const isSelected = selected.includes(list.uri)
      return (
        <Pressable
          testID={`toggleBtn-${list.name}`}
          style={[
            styles.listItem,
            pal.border,
            {
              opacity: membershipsLoaded ? 1 : 0.5,
              borderTopWidth: index === 0 ? 0 : 1,
            },
          ]}
          accessibilityLabel={`${isSelected ? 'Remove from' : 'Add to'} ${
            list.name
          }`}
          accessibilityHint=""
          disabled={!membershipsLoaded}
          onPress={() => onToggleSelected(list.uri)}>
          <View style={styles.listItemAvi}>
            <UserAvatar size={40} avatar={list.avatar} />
          </View>
          <View style={styles.listItemContent}>
            <Text
              type="lg"
              style={[s.bold, pal.text]}
              numberOfLines={1}
              lineHeight={1.2}>
              {sanitizeDisplayName(list.name)}
            </Text>
            <Text type="md" style={[pal.textLight]} numberOfLines={1}>
              {list.purpose === 'app.bsky.graph.defs#curatelist' &&
                'User list '}
              {list.purpose === 'app.bsky.graph.defs#modlist' &&
                'Moderation list '}
              by{' '}
              {list.creator.did === store.me.did
                ? 'you'
                : sanitizeHandle(list.creator.handle, '@')}
            </Text>
          </View>
          {membershipsLoaded && (
            <View
              style={
                isSelected
                  ? [styles.checkbox, palPrimary.border, palPrimary.view]
                  : [styles.checkbox, pal.borderDark]
              }>
              {isSelected && (
                <FontAwesomeIcon
                  icon="check"
                  style={palInverted.text as FontAwesomeIconStyle}
                />
              )}
            </View>
          )}
        </Pressable>
      )
    },
    [
      pal,
      palPrimary,
      palInverted,
      onToggleSelected,
      selected,
      store.me.did,
      membershipsLoaded,
    ],
  )

  // Only show changes button if there are some items on the list to choose from AND user has made changes in selection
  const canSaveChanges =
    !listsList.isEmpty && !isEqual(selected, originalSelections)

  return (
    <View testID="userAddRemoveListsModal" style={s.hContentRegion}>
      <Text style={[styles.title, pal.text]}>
        Update {displayName} in Lists
      </Text>
      <ListsList
        listsList={listsList}
        inline
        renderItem={renderItem}
        style={[styles.list, pal.border]}
      />
      <View style={[styles.btns, pal.border]}>
        <Button
          testID="cancelBtn"
          type="default"
          onPress={onPressCancel}
          style={styles.footerBtn}
          accessibilityLabel="Cancel"
          accessibilityHint=""
          onAccessibilityEscape={onPressCancel}
          label="Cancel"
        />
        {canSaveChanges && (
          <Button
            testID="saveBtn"
            type="primary"
            onPress={onPressSave}
            style={styles.footerBtn}
            accessibilityLabel="Save changes"
            accessibilityHint=""
            onAccessibilityEscape={onPressSave}
            label="Save Changes"
          />
        )}

        {(listsList.isLoading || !membershipsLoaded) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator />
          </View>
        )}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: isWeb ? 0 : 16,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 10,
  },
  list: {
    flex: 1,
    borderTopWidth: 1,
  },
  btns: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 10,
    paddingBottom: isAndroid ? 10 : 0,
    borderTopWidth: 1,
  },
  footerBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  listItemAvi: {
    width: 54,
    paddingLeft: 4,
    paddingTop: 8,
    paddingBottom: 10,
  },
  listItemContent: {
    flex: 1,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 8,
  },
  loadingContainer: {
    position: 'absolute',
    top: 10,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
  },
})
