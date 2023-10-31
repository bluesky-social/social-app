import React from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {observer} from 'mobx-react-lite'
import {View, StyleSheet, ActivityIndicator} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {colors} from 'lib/styles'
import {WaverlyChatModel} from 'state/models/w2/chat/WaverlyChatModel'
import {EmbedBlock} from '../card/EmbedBlock'
import {CardFrame_Full} from '../card/CardFrame_Full'
import {CardBody_Full} from '../card/CardBody_Full'
import LinearGradient from 'react-native-linear-gradient'
import {ProfileCardWithFollowBtn} from 'view/com/profile/ProfileCard'
import {AppBskyActorDefs} from '@atproto/api'
import {useStyle} from 'lib/hooks/waverly/useStyle'

interface ChatContentsProps {
  chatModel: WaverlyChatModel
  isGenerating: boolean
  cardHeight: number
}

export const ChatContents = observer(function ChatContents({
  chatModel,
  isGenerating,
  cardHeight,
}: ChatContentsProps) {
  const pal = usePalette('default')
  let i = 0
  const cardStyle = useStyle(
    () => [styles.borderRadius16, styles.marginBottom1, {height: cardHeight}],
    [cardHeight],
  )

  return (
    <View style={styles.hMargins}>
      <Text style={[pal.textLight, styles.beginning]}>
        (This is the beginning of your chat with Waverly)
      </Text>
      {chatModel.conversation.map((value, index) => {
        if (value.type === 'Break') {
          return (
            <View
              key={++i}
              style={[
                {
                  borderBottomColor: pal.textLight.color,
                },
                styles.breakStyle,
              ]}
            />
          )
        } else if (value.type === 'UGCPost') {
          return (
            <View key={++i} style={cardStyle}>
              <>
                <LinearGradient
                  colors={['#F3E9D4', '#29C5B2']}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}
                  style={styles.gradient}
                />
                <View style={styles.glassCardFrame}>
                  <CardFrame_Full groupPost={value.groupPost}>
                    <CardBody_Full groupPost={value.groupPost} />
                  </CardFrame_Full>
                </View>
              </>
            </View>
          )
        } else if (value.type === 'UserProfile') {
          return (
            <View key={++i} style={[pal.view, pal.border]}>
              <ProfileCardWithFollowBtn
                key={value.profile.did}
                profile={value.profile}
                noBg
                noBorder
                followers={
                  value.profile.followers
                    ? (value.profile
                        .followers as AppBskyActorDefs.ProfileView[])
                    : undefined
                }
              />
            </View>
          )
        } else if (value.type === 'Embed') {
          return (
            <View key={++i} style={styles.marginBottom1}>
              <EmbedBlock
                embedInfo={value.embedInfo}
                imageStyle={styles.maxHeight300}
                containerStyle={[styles.linkContainer, pal.border]}
                fullAxis="width"
              />
            </View>
          )
        } else {
          return (
            <Blob
              key={++i}
              isAI={value.isAI}
              prevSenderMatches={
                index + 1 < chatModel.conversation.length
                  ? chatModel.isAIBlob(index + 1) === value.isAI
                  : true
              }>
              <>
                {value.type === 'ChatStatement' ? (
                  <Text style={[value.isAI ? pal.text : pal.textInverted]}>
                    {value.text}
                  </Text>
                ) : null}
              </>
            </Blob>
          )
        }
      })}

      {isGenerating ? (
        <>
          <ActivityIndicator
            size="small"
            color={pal.textLight.color}
            style={styles.waitingSpinner}
          />
          <Text style={[pal.textLight, styles.waitingText]}>
            Waverly is thinking...
          </Text>
        </>
      ) : // <Blob
      //   key={++i}
      //   text={'waiting for Waverly...'}
      //   isAI={true}
      //   prevSenderMatches={false}
      // />
      undefined}
    </View>
  )
})

interface BlobProps {
  isAI: boolean
  prevSenderMatches: boolean
  children?: React.ReactNode
}
const Blob = ({isAI, prevSenderMatches, children}: BlobProps) => {
  const blobContainer = useStyle(
    () => ({
      flexDirection: 'row',
      justifyContent: isAI ? 'flex-start' : 'flex-end',
      paddingBottom: prevSenderMatches ? 1 : 8,
    }),
    [isAI, prevSenderMatches],
  )

  return (
    <View style={blobContainer}>
      <View
        style={[
          styles.blobFill,
          {backgroundColor: isAI ? colors.gray2 : colors.blue3},
        ]}>
        <View style={styles.flexRow}>{children}</View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  hMargins: {
    marginHorizontal: 8,
  },
  beginning: {
    textAlign: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  waitingText: {
    textAlign: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  waitingSpinner: {
    paddingTop: 10,
  },
  flexRow: {
    flexDirection: 'row',
  },
  borderRadius16: {
    borderRadius: 16,
  },
  marginBottom1: {
    marginBottom: 1,
  },
  maxHeight300: {
    maxHeight: 300,
  },
  blobFill: {
    borderRadius: 16,
    padding: 10,
    maxWidth: '80%',
  },
  linkContainer: {
    borderRadius: 5,
    borderWidth: 0.5,
  },
  breakStyle: {
    borderBottomWidth: 1,
    marginVertical: 16,
  },
  UGCPostOffset: {
    left: '-15%',
    top: '-15%',
    marginTop: -30,
    marginBottom: -170,
  },
  glassCardFrame: {
    flex: 1,
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
})
