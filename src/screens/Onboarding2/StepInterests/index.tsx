import React from 'react'
import {Image, View} from 'react-native'
import Svg, {Path} from 'react-native-svg'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {ScreenTransition} from '#/screens/Login/ScreenTransition'
import {Context} from '#/screens/Onboarding2/state'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

const interests = [
  {
    id: 'animals',
    label: 'Animals',
    image: require('../../../../assets/images/interests/animals.png'),
  },
  {
    id: 'art',
    label: 'Art',
    image: require('../../../../assets/images/interests/art.png'),
  },
  {
    id: 'books',
    label: 'Books',
    image: require('../../../../assets/images/interests/book.png'),
  },
  {
    id: 'comedy',
    label: 'Comedy',
    image: require('../../../../assets/images/interests/comedy.png'),
  },
  {
    id: 'comics',
    label: 'Comics',
    image: require('../../../../assets/images/interests/comic.png'),
  },
  {
    id: 'culture',
    label: 'Culture',
    image: require('../../../../assets/images/interests/culture.png'),
  },
  {
    id: 'technology',
    label: 'Technology',
    image: require('../../../../assets/images/interests/technology.png'),
  },
  {
    id: 'education',
    label: 'Education',
    image: require('../../../../assets/images/interests/education.png'),
  },
  {
    id: 'food',
    label: 'Food',
    image: require('../../../../assets/images/interests/food.png'),
  },
]

export function StepInterests() {
  const {_} = useLingui()
  const {state, dispatch} = React.useContext(Context)
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>([])

  const onNextPress = React.useCallback(() => {
    logger.metric(
      'signup:nextPressed',
      {
        activeStep: Number(state.activeStep),
      },
      {statsig: true},
    )
    dispatch({type: 'next'})
  }, [dispatch, state.activeStep])

  const onBackPress = React.useCallback(() => {
    dispatch({type: 'prev'})
  }, [dispatch])

  const toggleInterest = React.useCallback((interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId],
    )
  }, [])

  return (
    <ScreenTransition>
      <View style={[a.gap_md]}>
        <View style={[a.mb_md]}>
          <Svg width={48} height={49} viewBox="0 0 48 49" fill="none">
            <Path
              d="M22.4999 3.16418C23.0897 3.16418 23.667 3.33304 24.164 3.65051C24.6498 3.9609 25.0373 4.40158 25.286 4.92102H25.288L29.9726 14.379L29.9999 14.4366V14.4376H30.0019L30.0565 14.4445L40.3983 15.9767H40.3974C40.9688 16.0554 41.5071 16.2924 41.9511 16.6613C42.3455 16.989 42.6516 17.4092 42.8427 17.8829L42.9179 18.089V18.0909C43.0972 18.6482 43.1148 19.2455 42.9677 19.8136C42.8242 20.3673 42.5293 20.8689 42.1181 21.2648L34.6649 28.6613C34.6542 28.6719 34.6428 28.6822 34.6317 28.6925C34.6242 28.6996 34.6191 28.7082 34.6161 28.7169C34.6126 28.7276 34.6117 28.7383 34.6132 28.7472L34.6151 28.755L36.412 39.1554L36.4413 39.3712C36.4931 39.8766 36.4217 40.3894 36.2294 40.8634L36.2284 40.8644C36.0087 41.4045 35.6416 41.8721 35.1688 42.215L35.1698 42.2159C34.6967 42.5591 34.1367 42.7615 33.5536 42.8019C32.9699 42.8427 32.3877 42.7189 31.873 42.4454V42.4445L22.6015 37.545C22.5692 37.5299 22.5345 37.5216 22.4999 37.5216C22.465 37.5216 22.4299 37.5296 22.3974 37.545L13.1259 42.4445L13.1269 42.4454C12.6118 42.7191 12.0292 42.8438 11.4452 42.8029V42.8019C10.8632 42.7614 10.3038 42.5589 9.83096 42.2159C9.35801 41.8732 8.99108 41.4045 8.77139 40.8634C8.57909 40.3896 8.5064 39.8766 8.5585 39.3702L8.5878 39.1544L10.3847 28.6398L10.3866 28.63C10.3883 28.6203 10.3877 28.6102 10.3847 28.6007L10.3681 28.5743C10.3622 28.5689 10.3563 28.5633 10.3505 28.5577L2.80752 21.2804L2.8085 21.2794C2.37967 20.8691 2.07679 20.345 1.93838 19.7677C1.79912 19.1865 1.83141 18.577 2.03116 18.0138C2.23105 17.4505 2.58992 16.9564 3.06436 16.5929H3.06534C3.51219 16.2507 4.0435 16.039 4.60147 15.9767L14.9433 14.4445C14.9614 14.4418 14.9797 14.4396 14.998 14.4376H14.9989L14.9999 14.4366L15.0272 14.379L19.7118 4.92102H19.7128C19.9615 4.40141 20.3499 3.96099 20.8358 3.65051C21.3328 3.33301 21.9102 3.16418 22.4999 3.16418ZM22.4511 6.17883C22.4365 6.18818 22.4242 6.20114 22.4169 6.21692C22.4114 6.22868 22.406 6.24046 22.4003 6.25208L17.7157 15.7101L17.7147 15.7091C17.501 16.1649 17.178 16.561 16.7714 16.8585C16.3623 17.1578 15.8838 17.3465 15.3817 17.4113L15.3827 17.4122L5.04092 18.9445C5.0066 18.9495 4.972 18.9535 4.93741 18.9562C4.92865 18.9569 4.92012 18.9589 4.91202 18.962L4.88955 18.9747C4.87552 18.9855 4.86419 19.0001 4.8583 19.0167C4.8525 19.0332 4.85227 19.0514 4.85635 19.0685L4.88174 19.1134L4.89053 19.1212L12.4335 26.3995H12.4325C12.7505 26.7013 13.0001 27.0667 13.164 27.4718L13.2304 27.6515L13.2851 27.8341C13.3984 28.261 13.4168 28.708 13.3407 29.1447L13.3417 29.1456L11.5448 39.6642L11.5439 39.6691C11.54 39.691 11.5424 39.7138 11.5507 39.7345C11.5591 39.7553 11.5736 39.7741 11.5917 39.7872H11.5927C11.6103 39.8 11.631 39.8081 11.6532 39.8097H11.6552C11.6764 39.8112 11.699 39.807 11.7196 39.796L11.7226 39.7941L21.0331 34.8741L21.0731 34.8536C21.5166 34.6361 22.0046 34.5216 22.4999 34.5216C22.9333 34.5216 23.3613 34.6089 23.7587 34.7765L23.9267 34.8536L23.9667 34.8741L33.2773 39.7941L33.2802 39.796C33.3008 39.807 33.3235 39.8112 33.3446 39.8097H33.3466C33.3688 39.8081 33.3901 39.8003 33.4081 39.7872L33.4325 39.7638C33.4395 39.7549 33.4447 39.7444 33.4491 39.7335C33.457 39.7134 33.4599 39.6908 33.456 39.6681V39.6671L31.6581 29.2657V29.2648C31.5704 28.7639 31.6096 28.2499 31.7694 27.7697C31.9262 27.299 32.1951 26.8743 32.5517 26.5314L40.0058 19.1359C40.0161 19.1256 40.0273 19.1156 40.038 19.1056C40.0508 19.0936 40.0601 19.0782 40.0644 19.0616C40.0684 19.0459 40.0675 19.0286 40.0624 19.0118L40.0341 18.9689C40.0208 18.9578 40.0043 18.9506 39.9872 18.9484C39.9778 18.9471 39.9683 18.9459 39.9589 18.9445L29.6171 17.4122V17.4113C29.1153 17.3464 28.6372 17.1576 28.2284 16.8585C27.8217 16.5609 27.4978 16.165 27.2841 15.7091V15.7101L22.5995 6.25208C22.5938 6.24046 22.5884 6.22868 22.5829 6.21692C22.5756 6.20113 22.5634 6.18819 22.5487 6.17883C22.534 6.16946 22.5172 6.16419 22.4999 6.16418C22.4825 6.16418 22.4657 6.16949 22.4511 6.17883Z"
              fill="#C30B0D"
            />
          </Svg>
        </View>

        <View style={[a.align_start]}>
          <Text style={[{fontSize: 32, fontWeight: '600', marginBottom: 8}]}>
            <Trans>What floats your boat?</Trans>
          </Text>
          <Text
            style={[
              {fontSize: 17, fontWeight: 400, lineHeight: 21, color: '#666'},
            ]}>
            <Trans>
              Let us know your interests. We'll use this to help customize your
              feeds.
            </Trans>
          </Text>
        </View>

        <View style={[a.flex_row, a.flex_wrap, a.gap_md, {marginTop: 24}]}>
          {interests.map(interest => {
            const isSelected = selectedInterests.includes(interest.id)
            return (
              <View
                key={interest.id}
                style={[
                  {
                    width: '30%',
                  },
                ]}
                onTouchEnd={() => toggleInterest(interest.id)}>
                <View
                  style={[
                    {
                      aspectRatio: 1,
                      borderRadius: 12,
                      overflow: 'hidden',
                      borderWidth: 2,
                      borderColor: isSelected ? '#000' : '#E5E5E5',
                      backgroundColor: '#F8F8F8',
                      position: 'relative',
                    },
                  ]}>
                  {/* eslint-disable-next-line react-native-a11y/has-valid-accessibility-ignores-invert-colors */}
                  <Image
                    source={interest.image}
                    style={[
                      {
                        width: '100%',
                        height: '100%',
                        resizeMode: 'cover',
                      },
                    ]}
                  />
                  {isSelected && (
                    // eslint-disable-next-line react-native-a11y/has-valid-accessibility-ignores-invert-colors
                    <Image
                      source={require('../../../../assets/images/interests/whiteTick.png')}
                      style={[
                        {
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          width: 24,
                          height: 24,
                        },
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    {
                      fontSize: 14,
                      fontWeight: isSelected ? 'bold' : '500',
                      textAlign: 'left',
                      color: isSelected ? '#000' : '#696969',
                      marginTop: 4,
                      paddingHorizontal: 4,
                    },
                  ]}>
                  {interest.label}
                </Text>
              </View>
            )
          })}
        </View>
      </View>

      <View
        style={[a.border_t, a.mt_lg, {borderColor: '#D8D8D8', borderWidth: 1}]}
      />
      <View style={[a.flex_row, a.align_center, a.pt_lg]}>
        <Button
          label={_(msg`Back`)}
          variant="solid"
          color="secondary"
          size="large"
          onPress={onBackPress}>
          <ButtonText>
            <Trans>Back</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        <Button
          testID="nextBtn"
          label={_(msg`Continue to next step`)}
          accessibilityHint={_(msg`Continues to next step`)}
          variant="solid"
          color="primary"
          size="large"
          disabled={state.isLoading}
          onPress={onNextPress}>
          <ButtonText>
            <Trans>Next</Trans>
          </ButtonText>
          {state.isLoading && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </ScreenTransition>
  )
}
