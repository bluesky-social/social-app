import * as React from 'react'

import {Label, Stack} from './client.js'

export default async function App() {
  return (
    <Stack gap={10}>
      <Label size={36} lineHeight={1.2} weight="bold" text="Hello, world!" />
    </Stack>
  )
}

// TODO
// const DEFAULT_AC = h('Stack', {gap: 10}, [
//   h('Label', {
//     size: 36,
//     lineHeight: 1.2,
//     weight: 'bold',
//     text: 'Hello, world!',
//   }),
//   h('Label', {
//     lineHeight: 1.2,
//     text: 'This is the initial version of a fantastic new feature of the AT Protocol called "application components."',
//   }),
//   h('Tabs', {labels: ['Layout', 'Display', 'Inputs', 'Forms', 'ATProto']}, [
//     h('Stack', {gap: 10, pad: {t: 20}}, [
//       h('Box', {pad: {x: 10}}, [
//         h('Label', {text: 'Stack', size: 10, weight: 'bold'}),
//       ]),
//       h('Box', {border: 'default', corner: 10, pad: {x: 2, y: 6}}, [
//         h(
//           'Stack',
//           {
//             direction: 'row',
//             align: 'center',
//             gap: 10,
//             pad: {x: 10},
//           },
//           [
//             h('Label', {text: 'One'}),
//             h('Label', {text: 'Two', color: 'positive'}),
//             h('Box', {border: 'default', corner: 4, pad: 10}, [
//               {type: 'Label', props: {text: 'Three'}},
//             ]),
//             h('Box', {background: 'secondary', corner: 4, pad: 10}, [
//               {type: 'Label', props: {text: 'Four'}},
//             ]),
//             h('Label', {text: 'Five', color: 'secondary'}),
//           ],
//         ),
//       ]),
//       h('Box', {pad: {x: 10}}, [
//         h('Label', {text: 'Box', size: 10, weight: 'bold'}),
//       ]),
//       h('Box', {border: 'default', corner: 10, pad: {x: 10, y: 14}}, [
//         h('Label', {
//           text: 'You can use the Box element as somewhat similar to a div.',
//         }),
//         h('Label', {text: 'Its children flow vertically with no gap.'}),
//         h('Label', {
//           text: 'What it offers is styling -- border, corner radius, background, and padding.',
//         }),
//         h('Label', {
//           text: 'If you want to control layout then you use a Stack, then if you want styling you use a Box.',
//         }),
//         h('Label', {
//           text: 'Boxes also make good neutral containers.',
//         }),
//       ]),
//       h('Box', {pad: {x: 10}}, [
//         h('Label', {text: 'Expandable', size: 10, weight: 'bold'}),
//       ]),
//       h('Box', {border: 'default', corner: 10, pad: 6}, [
//         h('Expandable', {label: 'Expandable'}, [h('Label', {text: 'Content'})]),
//       ]),
//     ]),
//     h('Label', {text: 'Display TODO'}),
//     h('Label', {text: 'Inputs TODO'}),
//     h('Label', {text: 'Forms TODO'}),
//     h('Stack', {gap: 10, pad: {t: 20}}, [
//       h('Box', {pad: {x: 10}}, [
//         h('Label', {text: 'Avatar', size: 10, weight: 'bold'}),
//       ]),
//       h('Box', {border: 'secondary', corner: 8, pad: {x: 16, y: 12}}, [
//         h('Stack', {direction: 'row', gap: 10}, [
//           h('Avatar', {uri: 'bsky.app'}),
//           h('Avatar', {uri: 'at://atproto.com'}),
//           h('Avatar', {uri: 'at://pfrazee.com/'}),
//         ]),
//       ]),
//       h('Box', {pad: {x: 10}}, [
//         h('Label', {text: 'ActorLabel', size: 10, weight: 'bold'}),
//       ]),
//       h('Box', {border: 'secondary', corner: 8, pad: {x: 16, y: 12}}, [
//         h('Stack', {gap: 10}, [
//           h('Stack', {direction: 'row', gap: 8}, [
//             h('Label', {weight: 'bold', text: 'Display Name:'}),
//             h('ActorLabel', {uri: 'bsky.app', field: 'displayName'}),
//           ]),
//           h('Stack', {direction: 'row', gap: 8}, [
//             h('Label', {weight: 'bold', text: 'Handle:'}),
//             h('ActorLabel', {uri: 'bsky.app', field: 'handle'}),
//           ]),
//           h('Stack', {direction: 'row', gap: 8}, [
//             h('Label', {weight: 'bold', text: 'Description:'}),
//             h('ActorLabel', {uri: 'bsky.app', field: 'description'}),
//           ]),
//         ]),
//       ]),
//       h('Box', {pad: {x: 10}}, [
//         h('Label', {text: 'Embed (Actor)', size: 10, weight: 'bold'}),
//       ]),
//       h('Box', {border: 'secondary', corner: 8}, [
//         h('Embed', {uri: 'bsky.app'}),
//       ]),
//       h('Box', {border: 'secondary', corner: 8}, [
//         h('Embed', {uri: 'at://atproto.com/'}),
//       ]),
//       h('Box', {border: 'secondary', corner: 8}, [
//         h('Embed', {uri: 'at://pfrazee.com'}),
//       ]),
//       h('Box', {pad: {x: 10}}, [
//         h('Label', {text: 'Embed (Post)', size: 10, weight: 'bold'}),
//       ]),
//       h('Box', {border: 'secondary', corner: 8}, [
//         h('Embed', {uri: 'at://pfrazee.com/app.bsky.feed.post/3ku7fbojcqs25'}),
//       ]),
//       h('Box', {border: 'secondary', corner: 8}, [
//         h('Embed', {uri: 'at://bsky.app/app.bsky.feed.post/3ku73zs755e27'}),
//       ]),
//       h('Box', {pad: {x: 10}}, [
//         h('Label', {
//           text: 'Embed (Unsupported record type)',
//           size: 10,
//           weight: 'bold',
//         }),
//       ]),
//       h('Box', {border: 'secondary', corner: 8}, [
//         h('Embed', {uri: 'at://pfrazee.com/com.example.unknown/123'}),
//       ]),
//     ]),
//   ]),
// ])
