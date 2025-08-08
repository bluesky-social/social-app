import {useEffect, useState} from 'react'
import {TouchableOpacity, View} from 'react-native'
import Svg, {ClipPath, Defs, G, Path, Rect} from 'react-native-svg'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {Text} from '#/components/Typography'

// BlackCross icon component
function BlackCrossIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
      <G clipPath="url(#clip0_938_54201)">
        <Path
          d="M10.3775 1.62292L1.62244 10.378"
          stroke="black"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M1.62244 1.62292L10.3775 10.378"
          stroke="black"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_938_54201">
          <Rect
            width={12}
            height={12}
            fill="white"
            transform="translate(0 0.000488281)"
          />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

// RightArrowBlack icon component
function RightArrowBlackIcon() {
  return (
    <Svg width={12} height={13} viewBox="0 0 12 13" fill="none">
      <G clipPath="url(#clip0_1780_17550)">
        <Path
          d="M3.61218 1.32654L8.50421 6.21861C8.65966 6.37402 8.65966 6.62599 8.50421 6.78141L3.61218 11.6735"
          stroke="black"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_1780_17550">
          <Rect
            width={12}
            height={12}
            fill="white"
            transform="translate(-0.00012207 0.5)"
          />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

interface ConfirmationDialogProps {
  control: ReturnType<typeof Dialog.useDialogControl>
  onConfirm: () => void
  email: string
  onEmailChange?: () => void
}

export function ConfirmationDialog({
  control,
  onConfirm,
  email,
  onEmailChange,
}: ConfirmationDialogProps) {
  const {_} = useLingui()
  const [verificationCode, setVerificationCode] = useState('')

  // Generate a random 6-digit code when component mounts
  useEffect(() => {
    const generateCode = () => {
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      setVerificationCode(code)
    }
    generateCode()
  }, [])

  const handleSubmit = () => {
    control.close()
    onConfirm()
  }

  const handleCancel = () => {
    control.close()
  }

  const handleEmailChange = () => {
    control.close()
    onEmailChange?.()
  }

  const handleSendNewCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setVerificationCode(code)
  }

  return (
    <Dialog.Outer control={control}>
      <Dialog.Inner
        label={_(msg`OTP Validation`)}
        style={[
          {
            borderTopLeftRadius: 60,
            borderTopRightRadius: 60,
            backgroundColor: '#FFFFFF',
          },
        ]}>
        <View style={[]}>
          <View
            style={[
              a.px_lg,
              a.pb_lg,
              a.flex_row,
              a.justify_between,
              a.align_center,
            ]}>
            <View style={a.flex_1} />
            <Text style={[a.text_center, {fontSize: 18, fontWeight: '600'}]}>
              <Trans>Verify your email</Trans>
            </Text>
            <View style={a.flex_1} />
            <TouchableOpacity
              onPress={handleCancel}
              style={[a.p_2xs]}
              accessibilityLabel={_(msg`Close dialog`)}
              accessibilityHint={_(msg`Closes the verification dialog`)}>
              <BlackCrossIcon />
            </TouchableOpacity>
          </View>
          <View style={[a.px_lg, a.pb_lg, a.gap_lg, a.pt_lg]}>
            <Text style={[{fontWeight: '600', fontSize: 18}]}>
              <Trans>
                Enter the code we sent to{'\n'}
                {email}
              </Trans>
            </Text>

            {/* Verification Code Boxes */}
            <View style={[a.flex_row, a.justify_center, a.gap_sm, a.mt_lg]}>
              {verificationCode.split('').map((digit, index) => (
                <View
                  key={index}
                  style={[
                    {
                      width: 47.5,
                      height: 54,
                      borderWidth: 2,
                      borderColor: '#D8D8D8',
                      borderRadius: 8,
                      backgroundColor: '#F8F8F8',
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}>
                  <Text
                    style={[
                      {
                        fontSize: 17,
                        fontWeight: 'bold',
                        color: '#000000',
                      },
                    ]}>
                    {digit}
                  </Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={[a.mt_xl]}>
              {/* Change Email Address Row */}
              <TouchableOpacity
                onPress={handleEmailChange}
                style={[a.flex_row, a.justify_between, a.align_center, a.py_md]}
                accessibilityRole="button"
                accessibilityLabel={_(msg`Change email address`)}
                accessibilityHint={_(
                  msg`Opens dialog to change email address`,
                )}>
                <Text style={[{fontSize: 16, color: '#000000'}]}>
                  <Trans>Change email address</Trans>
                </Text>
                <RightArrowBlackIcon />
              </TouchableOpacity>

              {/* Send New Code Row */}
              <TouchableOpacity
                onPress={handleSendNewCode}
                style={[a.flex_row, a.justify_between, a.align_center, a.py_md]}
                accessibilityRole="button"
                accessibilityLabel={_(msg`Send a new code`)}
                accessibilityHint={_(
                  msg`Generates and displays a new verification code`,
                )}>
                <Text style={[{fontSize: 16, color: '#000000'}]}>
                  <Trans>Send a new code</Trans>
                </Text>
                <RightArrowBlackIcon />
              </TouchableOpacity>
            </View>
          </View>

          <View style={a.flex_1} />
          <Divider
            style={[a.mt_md, {borderColor: '#D8D8D8', borderWidth: 1}]}
          />
          <View style={[a.flex_row, a.align_center, a.px_lg, a.pt_lg]}>
            <Button
              label={_(msg`Cancel`)}
              variant="solid"
              color="secondary"
              size="large"
              onPress={handleCancel}>
              <ButtonText>
                <Trans>Cancel</Trans>
              </ButtonText>
            </Button>
            <View style={a.flex_1} />
            <Button
              testID="submitBtn"
              label={_(msg`Submit`)}
              accessibilityHint={_(
                msg`Submits the form and continues to next step`,
              )}
              variant="solid"
              color="primary"
              size="large"
              onPress={handleSubmit}>
              <ButtonText>
                <Trans>Submit</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>
      </Dialog.Inner>
    </Dialog.Outer>
  )
}
