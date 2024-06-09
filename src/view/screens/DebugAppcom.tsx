import React from 'react'
import {View} from 'react-native'

import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {CenteredView, ScrollView} from '#/view/com/util/Views'
import {atoms as a, useTheme} from '#/alf'
import {AppComponentRegion} from '#/components/appcom/AppCom'
import * as TextField from '#/components/forms/TextField'
import {Text} from '#/components/Typography'

const DEFAULT_AC = h('Stack', {gap: 10}, [
  h('Label', {
    size: 36,
    lineHeight: 1.2,
    weight: 'bold',
    text: 'Hello, world!',
  }),
  h('Label', {
    lineHeight: 1.2,
    text: 'This is the initial version of a fantastic new feature of the AT Protocol called "application components."',
  }),
  h('Tabs', {labels: ['Layout', 'Display', 'Inputs', 'Forms', 'ATProto']}, [
    h('Stack', {gap: 10, pad: {t: 20}}, [
      h('Box', {pad: {x: 10}}, [
        h('Label', {text: 'Stack', size: 10, weight: 'bold'}),
      ]),
      h('Box', {border: 'default', corner: 10, pad: {x: 2, y: 6}}, [
        h(
          'Stack',
          {
            direction: 'row',
            align: 'center',
            gap: 10,
            pad: {x: 10},
          },
          [
            h('Label', {text: 'One'}),
            h('Label', {text: 'Two', color: 'positive'}),
            h('Box', {border: 'default', corner: 4, pad: 10}, [
              {type: 'Label', props: {text: 'Three'}},
            ]),
            h('Box', {background: 'secondary', corner: 4, pad: 10}, [
              {type: 'Label', props: {text: 'Four'}},
            ]),
            h('Label', {text: 'Five', color: 'secondary'}),
          ],
        ),
      ]),
      h('Box', {pad: {x: 10}}, [
        h('Label', {text: 'Box', size: 10, weight: 'bold'}),
      ]),
      h('Box', {border: 'default', corner: 10, pad: {x: 10, y: 14}}, [
        h('Label', {
          text: 'You can use the Box element as somewhat similar to a div.',
        }),
        h('Label', {text: 'Its children flow vertically with no gap.'}),
        h('Label', {
          text: 'What it offers is styling -- border, corner radius, background, and padding.',
        }),
        h('Label', {
          text: 'If you want to control layout then you use a Stack, then if you want styling you use a Box.',
        }),
        h('Label', {
          text: 'Boxes also make good neutral containers.',
        }),
      ]),
      h('Box', {pad: {x: 10}}, [
        h('Label', {text: 'Expandable', size: 10, weight: 'bold'}),
      ]),
      h('Box', {border: 'default', corner: 10, pad: 6}, [
        h('Expandable', {label: 'Expandable'}, [h('Label', {text: 'Content'})]),
      ]),
    ]),
    h('Label', {text: 'Display TODO'}),
    h('Label', {text: 'Inputs TODO'}),
    h('Label', {text: 'Forms TODO'}),
    h('Stack', {gap: 10, pad: {t: 20}}, [
      h('Box', {pad: {x: 10}}, [
        h('Label', {text: 'Avatar', size: 10, weight: 'bold'}),
      ]),
      h('Box', {border: 'secondary', corner: 8, pad: {x: 16, y: 12}}, [
        h('Stack', {direction: 'row', gap: 10}, [
          h('Avatar', {uri: 'bsky.app'}),
          h('Avatar', {uri: 'at://atproto.com'}),
          h('Avatar', {uri: 'at://pfrazee.com/'}),
        ]),
      ]),
      h('Box', {pad: {x: 10}}, [
        h('Label', {text: 'ActorLabel', size: 10, weight: 'bold'}),
      ]),
      h('Box', {border: 'secondary', corner: 8, pad: {x: 16, y: 12}}, [
        h('Stack', {gap: 10}, [
          h('Stack', {direction: 'row', gap: 8}, [
            h('Label', {weight: 'bold', text: 'Display Name:'}),
            h('ActorLabel', {uri: 'bsky.app', field: 'displayName'}),
          ]),
          h('Stack', {direction: 'row', gap: 8}, [
            h('Label', {weight: 'bold', text: 'Handle:'}),
            h('ActorLabel', {uri: 'bsky.app', field: 'handle'}),
          ]),
          h('Stack', {direction: 'row', gap: 8}, [
            h('Label', {weight: 'bold', text: 'Description:'}),
            h('ActorLabel', {uri: 'bsky.app', field: 'description'}),
          ]),
        ]),
      ]),
      h('Box', {pad: {x: 10}}, [
        h('Label', {text: 'Embed (Actor)', size: 10, weight: 'bold'}),
      ]),
      h('Box', {border: 'secondary', corner: 8}, [
        h('Embed', {uri: 'bsky.app'}),
      ]),
      h('Box', {border: 'secondary', corner: 8}, [
        h('Embed', {uri: 'at://atproto.com/'}),
      ]),
      h('Box', {border: 'secondary', corner: 8}, [
        h('Embed', {uri: 'at://pfrazee.com'}),
      ]),
      h('Box', {pad: {x: 10}}, [
        h('Label', {text: 'Embed (Post)', size: 10, weight: 'bold'}),
      ]),
      h('Box', {border: 'secondary', corner: 8}, [
        h('Embed', {uri: 'at://pfrazee.com/app.bsky.feed.post/3ku7fbojcqs25'}),
      ]),
      h('Box', {border: 'secondary', corner: 8}, [
        h('Embed', {uri: 'at://bsky.app/app.bsky.feed.post/3ku73zs755e27'}),
      ]),
      h('Box', {pad: {x: 10}}, [
        h('Label', {
          text: 'Embed (Unsupported record type)',
          size: 10,
          weight: 'bold',
        }),
      ]),
      h('Box', {border: 'secondary', corner: 8}, [
        h('Embed', {uri: 'at://pfrazee.com/com.example.unknown/123'}),
      ]),
    ]),
  ]),
])

export const DebugAppcomScreen = ({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'DebugAppcom'
>) => {
  const t = useTheme()
  const [acJson, setAcJson] = React.useState(
    JSON.stringify(DEFAULT_AC, null, 2),
  )
  const [acObj, setAcObj] = React.useState(undefined)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    try {
      setAcObj(JSON.parse(acJson))
      setError('')
    } catch (e: any) {
      setError(e.toString())
    }
  }, [acJson, setAcObj, setError])

  return (
    <ScrollView>
      <CenteredView style={[t.atoms.bg, a.px_lg, a.py_lg]}>
        <Text style={[a.text_5xl, a.font_bold, a.pb_lg]}>
          Application components
        </Text>

        <TextField.LabelText>Application JSON component</TextField.LabelText>
        <TextField.Input
          multiline
          numberOfLines={20}
          value={acJson}
          onChangeText={setAcJson}
          label="Application component JSON"
        />

        {error && (
          <View
            style={[
              {backgroundColor: t.palette.negative_500},
              a.px_lg,
              a.py_md,
              a.rounded_sm,
            ]}>
            <Text style={{color: '#fff'}}>{error}</Text>
          </View>
        )}

        <View style={{height: 40}} />

        {acObj && <AppComponentRegion tree={acObj} origin="@bsky.app" />}
      </CenteredView>
    </ScrollView>
  )
}

function h(type: string, props?: any | Array<any>, children?: Array<any>) {
  return {
    type,
    props: Array.isArray(props) ? undefined : props,
    children: Array.isArray(props) ? props : children,
  }
}
