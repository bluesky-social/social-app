import React from 'react'
import {observer} from 'mobx-react-lite'
import {ComposeBlog} from 'view/screens/ComposeBlog'
import {View} from 'react-native'
import {s} from 'lib/styles'

export const DevComposeWaverlyBlog = observer(function DevComposeWaverlyBlog() {
  return (
    <View style={[s.flex1, s.p10]}>
      <ComposeBlog />
    </View>
  )
})
