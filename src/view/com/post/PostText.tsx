import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {ActivityIndicator, Text, View} from 'react-native'
import {PostModel} from '../../../state/models/post'
import {useStores} from '../../../state'

export const PostText = observer(function PostText({
  uri,
  style,
}: {
  uri: string
  style?: StyleProp
}) {
  const store = useStores()
  const [model, setModel] = useState<PostModel | undefined>()

  useEffect(() => {
    if (model?.uri === uri) {
      return // no change needed? or trigger refresh?
    }
    const newModel = new PostModel(store, uri)
    setModel(newModel)
    newModel.setup().catch(err => console.error('Failed to fetch post', err))
  }, [uri, model?.uri, store])

  // loading
  // =
  if (!model || model.isLoading || model.uri !== uri) {
    return (
      <View>
        <ActivityIndicator />
      </View>
    )
  }

  // error
  // =
  if (model.hasError) {
    return (
      <View>
        <Text style={style}>{model.error}</Text>
      </View>
    )
  }

  // loaded
  // =
  return (
    <View>
      <Text style={style}>{model.text}</Text>
    </View>
  )
})
