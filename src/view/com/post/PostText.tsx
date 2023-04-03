import React, {useState, useEffect} from 'react'
import {observer} from 'mobx-react-lite'
import {StyleProp, StyleSheet, TextStyle, View} from 'react-native'
import {LoadingPlaceholder} from '../util/LoadingPlaceholder'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {Text} from '../util/text/Text'
import {PostModel} from 'state/models/content/post'
import {useStores} from 'state/index'

export const PostText = observer(function PostText({
  uri,
  style,
}: {
  uri: string
  style?: StyleProp<TextStyle>
}) {
  const store = useStores()
  const [model, setModel] = useState<PostModel | undefined>()

  useEffect(() => {
    if (model?.uri === uri) {
      return // no change needed? or trigger refresh?
    }
    const newModel = new PostModel(store, uri)
    setModel(newModel)
    newModel.setup().catch(err => store.log.error('Failed to fetch post', err))
  }, [uri, model?.uri, store])

  // loading
  // =
  if (!model || model.isLoading || model.uri !== uri) {
    return (
      <View>
        <LoadingPlaceholder width="100%" height={8} style={styles.mt6} />
        <LoadingPlaceholder width="100%" height={8} style={styles.mt6} />
        <LoadingPlaceholder width={100} height={8} style={styles.mt6} />
      </View>
    )
  }

  // error
  // =
  if (model.hasError) {
    return (
      <View>
        <ErrorMessage style={style} message={model.error} />
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

const styles = StyleSheet.create({
  mt6: {marginTop: 6},
})
