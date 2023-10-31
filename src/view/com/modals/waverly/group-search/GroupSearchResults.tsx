import React, {useCallback} from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {observer} from 'mobx-react-lite'
import {
  ListRenderItemInfo,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {GroupSearchUIModel} from 'state/models/w2/GroupSearchUIModel'
import {FlatList} from 'view/com/util/Views'
import {Text} from 'view/com/util/text/Text'
import {GroupItem} from './GroupItem'
import {GroupSearchItem} from 'w2-api/waverly_sdk'

export const GroupSearchResults = observer(function GroupSearchResults({
  model,
  onChangeGroup,
}: {
  model: GroupSearchUIModel
  onChangeGroup: (g: GroupSearchItem) => void
}) {
  const pal = usePalette('default')

  const renderItem = useCallback(
    ({item}: ListRenderItemInfo<GroupSearchItem>) => {
      return (
        <TouchableOpacity
          key={item.handle}
          style={styles.itemContainer}
          accessibilityRole="button"
          onPress={() => onChangeGroup(item)}>
          <GroupItem group={item} />
        </TouchableOpacity>
      )
    },
    [onChangeGroup],
  )

  return (
    <View style={[s.h100pct, s.pt10, s.pb20]}>
      {!model.isActive ? (
        <></>
      ) : model.isLoading ? (
        <Text type="xl" style={[styles.empty, pal.text]}>
          Loading...
        </Text>
      ) : model.groups.length === 0 ? (
        <Text type="xl" style={[styles.empty, pal.text]}>
          No groups found for "{model.query}"
        </Text>
      ) : (
        <FlatList
          keyExtractor={d => d.handle}
          data={model.groups}
          renderItem={renderItem}
          style={[pal.view, s.flex1]}
          contentContainerStyle={s.pt10}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  itemContainer: {
    paddingBottom: 24,
  },
  empty: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
})
