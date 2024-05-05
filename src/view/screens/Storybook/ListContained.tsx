import React from 'react'
import {View} from 'react-native'

import {ScrollProvider} from 'lib/ScrollContext'
import {List} from 'view/com/util/List'
import {Text} from '#/components/Typography'

// 100 random messages

export function ListContained() {
  const data = React.useMemo(() => {
    return Array.from({length: 100}, (_, i) => ({
      id: i,
      text: `Message ${i}`,
    }))
  }, [])

  return (
    <View style={{width: '100%', height: 300}}>
      <ScrollProvider
        onScroll={() => {
          console.log('onScroll')
        }}>
        <List
          data={data}
          renderItem={item => {
            return (
              <View
                style={{
                  padding: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(0,0,0,0.1)',
                }}>
                <Text>{item.item.text}</Text>
              </View>
            )
          }}
          keyExtractor={item => item.id.toString()}
          containWeb={true}
          style={{flex: 1}}
          onStartReached={() => {
            console.log('Start Reached')
          }}
          onEndReached={() => {
            console.log('End Reached (threshold of 2)')
          }}
          onEndReachedThreshold={2}
        />
      </ScrollProvider>
    </View>
  )
}
