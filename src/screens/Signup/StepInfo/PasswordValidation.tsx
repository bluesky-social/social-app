import {View} from 'react-native'
import Svg, {ClipPath, Defs, G, Path, Rect} from 'react-native-svg'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {Text} from '#/components/Typography'

// RedWarning icon component
function RedWarningIcon() {
  return (
    <Svg width={12} height={13} viewBox="0 0 12 13" fill="none">
      <G clipPath="url(#clip0_938_54641)">
        <Path
          d="M5.99997 11.6071C8.8206 11.6071 11.1071 9.32064 11.1071 6.5C11.1071 3.67941 8.8206 1.39286 5.99997 1.39286C3.17937 1.39286 0.892822 3.67941 0.892822 6.5C0.892822 9.32064 3.17937 11.6071 5.99997 11.6071Z"
          stroke="#C30B0D"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M6 4.14286V6.69643"
          stroke="#C30B0D"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M6.00002 8.85714C5.89153 8.85714 5.80359 8.7692 5.80359 8.66072C5.80359 8.55223 5.89153 8.46429 6.00002 8.46429"
          stroke="#C30B0D"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M6 8.85714C6.10848 8.85714 6.19643 8.7692 6.19643 8.66072C6.19643 8.55223 6.10848 8.46429 6 8.46429"
          stroke="#C30B0D"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_938_54641">
          <Rect
            width={12}
            height={12}
            fill="white"
            transform="translate(0 0.5)"
          />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

// RedWrong icon component
function RedWrongIcon() {
  return (
    <Svg width={10} height={11} viewBox="0 0 10 11" fill="none">
      <Path
        d="M9.22316 1.27679L0.776733 9.72322"
        stroke="#C30B0D"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M0.776733 1.27679L9.22316 9.72322"
        stroke="#C30B0D"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// CheckCorrect icon component
function CheckCorrectIcon() {
  return (
    <Svg width={12} height={13} viewBox="0 0 12 13" fill="none">
      <Path
        d="M1.00891 8.03572L3.48302 10.2005C3.80966 10.4864 4.30809 10.4449 4.58294 10.1089L10.9911 2.27679"
        stroke="black"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// Password validation component
export function PasswordValidation({
  password,
  email,
}: {
  password: string
  email: string
}) {
  const {_} = useLingui()

  const validations = [
    {
      id: 'strength',
      label: _(msg`Password strength: weak`),
      isValid:
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        (/\d/.test(password) ||
          /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)),
      showAlways: false,
      color: '#C30B0D',
    },
    {
      id: 'length',
      label: _(msg`Must be at least 8 characters`),
      isValid: password.length >= 8,
      showAlways: true,
      color: '#696969',
    },
    ...(email
      ? [
          {
            id: 'email',
            label: _(msg`Can't include your email address`),
            isValid:
              !email || !password.toLowerCase().includes(email.toLowerCase()),
            showAlways: false,
            color: '#C30B0D',
          },
        ]
      : []),
    {
      id: 'symbolOrNumber',
      label: _(msg`Must have at least one symbol or number`),
      isValid:
        /\d/.test(password) ||
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      showAlways: true,
      color: '#696969',
    },
  ]

  return (
    <View style={[a.mt_sm, a.gap_xs]}>
      {validations.map(validation => {
        // Only show validation if it should always be shown or if it's not satisfied
        if (!validation.showAlways && validation.isValid) {
          return null
        }

        return (
          <View
            key={validation.id}
            style={[a.flex_row, a.align_center, a.gap_xs]}>
            {validation.id === 'strength' && !validation.isValid ? (
              <RedWarningIcon />
            ) : validation.id === 'email' && !validation.isValid ? (
              <RedWrongIcon />
            ) : validation.id === 'length' ||
              validation.id === 'symbolOrNumber' ? (
              <CheckCorrectIcon />
            ) : (
              <View
                style={[
                  a.rounded_full,
                  {
                    width: 8,
                    height: 8,
                    backgroundColor: validation.isValid
                      ? '#10B981'
                      : validation.color,
                  },
                ]}
              />
            )}
            <Text
              style={[
                a.text_sm,
                {
                  color:
                    validation.id === 'length' ||
                    validation.id === 'symbolOrNumber'
                      ? validation.isValid
                        ? '#696969'
                        : '#AAAAAA'
                      : validation.isValid
                        ? '#10B981'
                        : validation.color,
                },
              ]}>
              {validation.label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
