import * as React from 'react'

import {
  ActorLabel,
  Avatar,
  Box,
  Embed,
  Expandable,
  Label,
  Stack,
  Tabs,
} from './client.js'

export default async function App() {
  return (
    <Stack gap={10}>
      <Label size={36} lineHeight={1.2} weight="bold" text="Hello, world!" />
      <Label
        lineHeight={1.2}
        text='This is the initial version of a fantastic new feature of the AT Protocol called "application components."'
      />
      <Tabs labels={['Layout', 'Display', 'Inputs', 'Forms', 'ATProto']}>
        <Stack gap={10} pad={{t: 20}}>
          <Box pad={{x: 10}}>
            <Label text="Stack" size={10} weight="bold" />
          </Box>
          <Box border="default" corner={10} pad={{x: 2, y: 6}}>
            <Stack direction="row" align="center" gap={10} pad={{x: 10}}>
              <Label text="One" />
              <Label text="Two" color="positive" />
              <Box border="default" corner={4} pad={10}>
                <Label text="Three" />
              </Box>
              <Box background="secondary" corner={4} pad={10}>
                <Label text="Four" />
              </Box>
              <Label text="Five" color="secondary" />
            </Stack>
          </Box>
          <Box pad={{x: 10}}>
            <Label text="Box" size={10} weight="bold" />
          </Box>
          <Box border="default" corner={10} pad={{x: 10, y: 14}}>
            <Label text="You can use the Box element as somewhat similar to a div." />
            <Label text="Its children flow vertically with no gap." />
            <Label text="What it offers is styling -- border, corner radius, background, and padding." />
            <Label text="If you want to control layout then you use a Stack, then if you want styling you use a Box." />
            <Label text="Boxes also make good neutral containers." />
          </Box>
          <Box pad={{x: 10}}>
            <Label text="Expandable" size={10} weight="bold" />
          </Box>
          <Box border="default" corner={10} pad={6}>
            <Expandable label="Expandable">
              <Label text="Content" />
            </Expandable>
          </Box>
        </Stack>
        <Label text="Display TODO" />
        <Label text="Inputs TODO" />
        <Label text="Forms TODO" />
        <Stack gap={10} pad={{t: 20}}>
          <Box pad={{x: 10}}>
            <Label text="Avatar" size={10} weight="bold" />
          </Box>
          <Box border="secondary" corner={8} pad={{x: 16, y: 12}}>
            <Stack direction="row" gap={10}>
              <Avatar uri="bsky.app" />
              <Avatar uri="at://atproto.com" />
              <Avatar uri="at://pfrazee.com/" />
            </Stack>
          </Box>
          <Box pad={{x: 10}}>
            <Label text="ActorLabel" size={10} weight="bold" />
          </Box>
          <Box border="secondary" corner={8} pad={{x: 16, y: 12}}>
            <Stack gap={10}>
              <Stack direction="row" gap={8}>
                <Label weight="bold" text="Display Name:" />
                <ActorLabel uri="bsky.app" field="displayName" />
              </Stack>
              <Stack direction="row" gap={8}>
                <Label weight="bold" text="Handle:" />
                <ActorLabel uri="bsky.app" field="handle" />
              </Stack>
              <Stack direction="row" gap={8}>
                <Label weight="bold" text="Description:" />
                <ActorLabel uri="bsky.app" field="description" />
              </Stack>
            </Stack>
          </Box>
          <Box pad={{x: 10}}>
            <Label text="Embed (Actor)" size={10} weight="bold" />
          </Box>
          <Box border="secondary" corner={8}>
            <Embed uri="bsky.app" />
          </Box>
          <Box border="secondary" corner={8}>
            <Embed uri="at://atproto.com/" />
          </Box>
          <Box border="secondary" corner={8}>
            <Embed uri="at://pfrazee.com" />
          </Box>
          <Box pad={{x: 10}}>
            <Label text="Embed (Post)" size={10} weight="bold" />
          </Box>
          <Box border="secondary" corner={8}>
            <Embed uri="at://pfrazee.com/app.bsky.feed.post/3ku7fbojcqs25" />
          </Box>
          <Box border="secondary" corner={8}>
            <Embed uri="at://bsky.app/app.bsky.feed.post/3ku73zs755e27" />
          </Box>
          <Box pad={{x: 10}}>
            <Label
              text="Embed (Unsupported record type)"
              size={10}
              weight="bold"
            />
          </Box>
          <Box border="secondary" corner={8}>
            <Embed uri="at://pfrazee.com/com.example.unknown/123" />
          </Box>
        </Stack>
      </Tabs>
    </Stack>
  )
}
