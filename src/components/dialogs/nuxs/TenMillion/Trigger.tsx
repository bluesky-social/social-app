import React from 'react'
import {View} from 'react-native'
import Svg, {Circle, Path} from 'react-native-svg'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Nux, useUpsertNuxMutation} from '#/state/queries/nuxs'
import {atoms as a, ViewStyleProp} from '#/alf'
import {Button, ButtonProps} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {InlineLinkText} from '#/components/Link'
import * as Prompt from '#/components/Prompt'
import {TenMillion} from './'

export function Trigger({children}: {children: ButtonProps['children']}) {
  const {_} = useLingui()
  const {mutate: upsertNux} = useUpsertNuxMutation()
  const [show, setShow] = React.useState(false)
  const [fallback, setFallback] = React.useState(false)
  const control = Prompt.usePromptControl()

  const handleOnPress = () => {
    if (!fallback) {
      setShow(true)
      upsertNux({
        id: Nux.TenMillionDialog,
        completed: true,
        data: undefined,
      })
    } else {
      control.open()
    }
  }

  const onHandleFallback = () => {
    setFallback(true)
    control.open()
  }

  return (
    <>
      <Button
        label={_(msg`Bluesky is celebrating 10 million users!`)}
        onPress={handleOnPress}>
        {children}
      </Button>

      {show && !fallback && (
        <TenMillion
          showTimeout={0}
          onClose={() => setShow(false)}
          onFallback={onHandleFallback}
        />
      )}

      <Prompt.Outer control={control}>
        <View style={{maxWidth: 300}}>
          <Prompt.TitleText>
            <Trans>Bluesky is celebrating 10 million users!</Trans>
          </Prompt.TitleText>
        </View>
        <Prompt.DescriptionText>
          <Trans>
            Together, we're rebuilding the social internet. We're glad you're
            here.
          </Trans>
        </Prompt.DescriptionText>
        <Prompt.DescriptionText>
          <Trans>
            To learn more,{' '}
            <InlineLinkText
              label={_(msg`View our post`)}
              to="/profile/bsky.app/post/3l47prg3wgy23"
              onPress={() => {
                control.close()
              }}
              style={[a.text_md, a.leading_snug]}>
              <Trans>check out our post.</Trans>
            </InlineLinkText>
          </Trans>
        </Prompt.DescriptionText>
        <Dialog.Close />
      </Prompt.Outer>
    </>
  )
}

export function Icon({width, style}: {width: number} & ViewStyleProp) {
  return (
    <Svg width={width} height={width} viewBox="0 0 36 36" style={style}>
      <Path
        fill="#dd2e44"
        d="M11.626 7.488a1.4 1.4 0 0 0-.268.395l-.008-.008L.134 33.141l.011.011c-.208.403.14 1.223.853 1.937c.713.713 1.533 1.061 1.936.853l.01.01L28.21 24.735l-.008-.009c.147-.07.282-.155.395-.269c1.562-1.562-.971-6.627-5.656-11.313c-4.687-4.686-9.752-7.218-11.315-5.656"
      />
      <Path
        fill="#ea596e"
        d="M13 12L.416 32.506l-.282.635l.011.011c-.208.403.14 1.223.853 1.937c.232.232.473.408.709.557L17 17z"
      />
      <Path
        fill="#a0041e"
        d="M23.012 13.066c4.67 4.672 7.263 9.652 5.789 11.124c-1.473 1.474-6.453-1.118-11.126-5.788c-4.671-4.672-7.263-9.654-5.79-11.127c1.474-1.473 6.454 1.119 11.127 5.791"
      />
      <Path
        fill="#aa8dd8"
        d="M18.59 13.609a1 1 0 0 1-.734.215c-.868-.094-1.598-.396-2.109-.873c-.541-.505-.808-1.183-.735-1.862c.128-1.192 1.324-2.286 3.363-2.066c.793.085 1.147-.17 1.159-.292c.014-.121-.277-.446-1.07-.532c-.868-.094-1.598-.396-2.11-.873c-.541-.505-.809-1.183-.735-1.862c.13-1.192 1.325-2.286 3.362-2.065c.578.062.883-.057 1.012-.134c.103-.063.144-.123.148-.158c.012-.121-.275-.446-1.07-.532a1 1 0 0 1-.886-1.102a.997.997 0 0 1 1.101-.886c2.037.219 2.973 1.542 2.844 2.735c-.13 1.194-1.325 2.286-3.364 2.067c-.578-.063-.88.057-1.01.134c-.103.062-.145.123-.149.157c-.013.122.276.446 1.071.532c2.037.22 2.973 1.542 2.844 2.735s-1.324 2.286-3.362 2.065c-.578-.062-.882.058-1.012.134c-.104.064-.144.124-.148.158c-.013.121.276.446 1.07.532a1 1 0 0 1 .52 1.773"
      />
      <Path
        fill="#77b255"
        d="M30.661 22.857c1.973-.557 3.334.323 3.658 1.478c.324 1.154-.378 2.615-2.35 3.17c-.77.216-1.001.584-.97.701c.034.118.425.312 1.193.095c1.972-.555 3.333.325 3.657 1.479c.326 1.155-.378 2.614-2.351 3.17c-.769.216-1.001.585-.967.702s.423.311 1.192.095a1 1 0 1 1 .54 1.925c-1.971.555-3.333-.323-3.659-1.479c-.324-1.154.379-2.613 2.353-3.169c.77-.217 1.001-.584.967-.702c-.032-.117-.422-.312-1.19-.096c-1.974.556-3.334-.322-3.659-1.479c-.325-1.154.378-2.613 2.351-3.17c.768-.215.999-.585.967-.701c-.034-.118-.423-.312-1.192-.096a1 1 0 1 1-.54-1.923"
      />
      <Path
        fill="#aa8dd8"
        d="M23.001 20.16a1.001 1.001 0 0 1-.626-1.781c.218-.175 5.418-4.259 12.767-3.208a1 1 0 1 1-.283 1.979c-6.493-.922-11.187 2.754-11.233 2.791a1 1 0 0 1-.625.219"
      />
      <Path
        fill="#77b255"
        d="M5.754 16a1 1 0 0 1-.958-1.287c1.133-3.773 2.16-9.794.898-11.364c-.141-.178-.354-.353-.842-.316c-.938.072-.849 2.051-.848 2.071a1 1 0 1 1-1.994.149c-.103-1.379.326-4.035 2.692-4.214c1.056-.08 1.933.287 2.552 1.057c2.371 2.951-.036 11.506-.542 13.192a1 1 0 0 1-.958.712"
      />
      <Circle cx="25.5" cy="9.5" r="1.5" fill="#5c913b" />
      <Circle cx="2" cy="18" r="2" fill="#9266cc" />
      <Circle cx="32.5" cy="19.5" r="1.5" fill="#5c913b" />
      <Circle cx="23.5" cy="31.5" r="1.5" fill="#5c913b" />
      <Circle cx="28" cy="4" r="2" fill="#ffcc4d" />
      <Circle cx="32.5" cy="8.5" r="1.5" fill="#ffcc4d" />
      <Circle cx="29.5" cy="12.5" r="1.5" fill="#ffcc4d" />
      <Circle cx="7.5" cy="23.5" r="1.5" fill="#ffcc4d" />
    </Svg>
  )
}
