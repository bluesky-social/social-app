import React from 'react'
import {View} from 'react-native'
import Svg, {Path} from 'react-native-svg'
import {Image as ExpoImage} from 'expo-image'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {AvatarCreatorCircle} from '#/screens/Onboarding2/StepProfile/AvatarCreatorCircle'
import {useAvatar} from '#/screens/Onboarding2/StepProfile/index'
import {atoms as a} from '#/alf'
import {Button} from '#/components/Button'
import {Text} from '#/components/Typography'

export function AvatarCircle({
  openLibrary,
  handle,
}: {
  openLibrary: () => unknown
  openCreator: () => unknown
  handle?: string
}) {
  const {_} = useLingui()
  const {avatar} = useAvatar()

  const styles = React.useMemo(
    () => ({
      card: [
        a.w_full,
        a.rounded_lg,
        a.align_center,
        a.justify_center,
        a.p_4xl,
        {
          height: 241,
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        },
      ],
      imageContainer: [
        a.rounded_full,
        a.overflow_hidden,
        a.align_center,
        a.justify_center,
        a.border,
        {
          height: 128,
          width: 128,
          borderWidth: 2,
          borderColor: '#E0E0E0',
          backgroundColor: '#F8F8F8',
        },
      ],
      placeholder: [
        a.rounded_full,
        a.align_center,
        a.justify_center,
        {
          width: 128,
          height: 128,
          backgroundColor: '#F5F5F5',
        },
      ],
    }),
    [],
  )

  return (
    <View style={styles.card}>
      <View style={[a.relative, a.align_center]}>
        {avatar.useCreatedAvatar ? (
          <AvatarCreatorCircle avatar={avatar} size={128} />
        ) : avatar.image ? (
          <Button
            label={_(msg`Change profile photo`)}
            variant="ghost"
            onPress={openLibrary}
            style={[a.p_0, a.bg_transparent]}>
            <ExpoImage
              source={avatar.image.path}
              style={styles.imageContainer}
              accessibilityIgnoresInvertColors
              transition={{duration: 300, effect: 'cross-dissolve'}}
            />
          </Button>
        ) : (
          <Button
            label={_(msg`Upload profile photo`)}
            variant="ghost"
            onPress={openLibrary}
            style={[a.p_0, a.bg_transparent]}>
            <View style={styles.imageContainer}>
              <ExpoImage
                source={require('../../../../assets/goose.png')}
                style={styles.placeholder}
                contentFit="cover"
                accessibilityIgnoresInvertColors
              />
            </View>
          </Button>
        )}
        <View style={[a.absolute, a.align_center, {bottom: -10}]}>
          <Svg width={29} height={30} viewBox="0 0 29 30" fill="none">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M16.1744 1.45871C15.3008 0.427451 13.7101 0.427451 12.8364 1.45871L10.9137 3.72809C10.8372 3.81844 10.7162 3.85776 10.6011 3.82966L7.71172 3.12383C6.39865 2.8031 5.11187 3.73801 5.01117 5.08589L4.78957 8.05202C4.78075 8.17008 4.70595 8.27302 4.59638 8.3179L1.84392 9.44521C0.593134 9.95753 0.101619 11.4703 0.812411 12.6199L2.37657 15.1498C2.43884 15.2505 2.43884 15.3777 2.37657 15.4785L0.812411 18.0084C0.101619 19.158 0.593134 20.6707 1.84392 21.183L4.59638 22.3103C4.70595 22.3552 4.78075 22.4582 4.78957 22.5763L5.01117 25.5424C5.11187 26.8902 6.39865 27.8252 7.71172 27.5044L10.6011 26.7986C10.7162 26.7705 10.8372 26.8098 10.9137 26.9002L12.8364 29.1696C13.7101 30.2008 15.3008 30.2008 16.1744 29.1696L18.0972 26.9002C18.1737 26.8098 18.2948 26.7705 18.4098 26.7986L21.2992 27.5044C22.6122 27.8252 23.899 26.8902 23.9997 25.5424L24.2213 22.5763C24.2301 22.4582 24.3049 22.3552 24.4145 22.3103L27.1669 21.183C28.4178 20.6707 28.9093 19.158 28.1985 18.0084L26.6343 15.4785C26.5721 15.3777 26.5721 15.2505 26.6343 15.1498L28.1985 12.6199C28.9093 11.4703 28.4178 9.95753 27.1669 9.44521L24.4145 8.3179C24.3049 8.27302 24.2301 8.17008 24.2213 8.05202L23.9997 5.08589C23.899 3.73801 22.6122 2.80309 21.2992 3.12383L18.4098 3.82966C18.2948 3.85776 18.1737 3.81844 18.0972 3.72809L16.1744 1.45871Z"
              fill="#2599FF"
            />
            <Path
              d="M14.1027 24.3133L14.3059 20.4594C14.3166 20.2256 14.1334 20.0269 13.897 20.0164C13.8663 20.0152 13.8356 20.0164 13.8048 20.0222L9.92596 20.6967L10.4495 19.2671C10.4933 19.1502 10.4566 19.0193 10.3597 18.941L6.10973 15.5371L7.06703 15.0953C7.20058 15.0333 7.26677 14.8813 7.22068 14.7422L6.38037 12.187L8.82801 12.7002C8.9651 12.7282 9.1022 12.6569 9.15775 12.5307L9.63167 11.4272L11.5416 13.4553C11.6527 13.5722 11.8394 13.5768 11.9564 13.4658C12.0285 13.398 12.0616 13.2975 12.0427 13.2004L11.122 8.50142L12.5981 9.34537C12.7376 9.42603 12.9173 9.38044 13 9.24134C13.0035 9.23549 13.0059 9.22965 13.0094 9.22497L14.5092 6.31438L16.009 9.22614C16.0811 9.36992 16.2584 9.4272 16.4026 9.35589C16.4085 9.35355 16.4144 9.35005 16.4191 9.34654L17.8953 8.50259L16.9746 13.2016C16.9439 13.3594 17.0479 13.5114 17.2074 13.5418C17.3055 13.5605 17.4071 13.5277 17.4757 13.4564L19.3856 11.4284L19.8595 12.5318C19.9151 12.6592 20.0522 12.7294 20.1892 12.7013L22.6369 12.1882L21.7966 14.7434C21.7505 14.8825 21.8167 15.0333 21.9502 15.0964L22.9075 15.5383L18.6576 18.9421C18.5595 19.0205 18.524 19.1514 18.5677 19.2683L19.0913 20.6979L15.2124 20.0234C14.9784 19.9836 14.7574 20.1391 14.7172 20.3694C14.7125 20.3998 14.7101 20.4302 14.7113 20.4606L14.9146 24.3145H14.1015L14.1027 24.3133Z"
              fill="white"
            />
          </Svg>
        </View>
      </View>
      <View style={[a.mt_xl, a.align_center]}>
        <Text style={[{fontSize: 18, fontWeight: '600', color: '#000000'}]}>
          {handle
            ? // TODO: Remove this hardcoded domain replacement when we have proper domain handling
              // This is a temporary fix to ensure handles show .gander.social instead of .bsky.social
              `@${handle.replace('.bsky.social', '.gander.social')}`
            : '@maggie.gander.social'}
        </Text>
      </View>
    </View>
  )
}
