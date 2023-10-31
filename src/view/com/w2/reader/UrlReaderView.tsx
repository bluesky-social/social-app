import React, {useEffect, useMemo} from 'react'
import {observer} from 'mobx-react-lite'

import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams} from 'lib/routes/types'
import {EmbedInfo} from 'lib/hooks/waverly/useEmbedInfo'
import {BaseReaderView} from './BaseReaderView'
import {useExternalLinkFetch} from 'view/com/composer/useExternalLinkFetch'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'UrlReaderView'>

const length = '4 min'

export const UrlReaderView = observer(function ReaderView({route}: Props) {
  const {uri: encodedUri} = route.params
  const uri = useMemo(() => decodeURIComponent(encodedUri), [encodedUri])

  const {extLink, setExtLink} = useExternalLinkFetch({setQuote: () => {}})

  useEffect(() => {
    if (uri) setExtLink({uri: uri, isLoading: true})
  }, [setExtLink, uri])

  const link: EmbedInfo['link'] | undefined = useMemo(() => {
    if (extLink?.isLoading === true || !extLink?.meta) return undefined
    let {title, description} = extLink.meta
    if (!title) title = '<Unknown title>'
    if (!description) description = '<Unknown description>'
    try {
      const host = new URL(uri).host
      return {title, description, length, host, uri, originalUri: uri}
    } catch {
      return undefined
    }
  }, [extLink?.isLoading, extLink?.meta, uri])

  return <BaseReaderView link={link} />
})
