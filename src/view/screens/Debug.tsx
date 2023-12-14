import React from 'react'
import {CenteredView, ScrollView} from '#/view/com/util/Views'

import {useSetColorMode} from '#/state/shell'
import {
  useBreakpoints,
  Box,
  Text,
  Button,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
} from '#/view/nova'

function BreakpointDebugger() {
  const breakpoints = useBreakpoints()

  return (
    <Box>
      <Text fontSize="l" fontWeight="900">
        Breakpoints
      </Text>
      <Text pa="m" bg="l2" fontFamily="monospace">
        {JSON.stringify(breakpoints, null, 2)}
      </Text>
    </Box>
  )
}

export function DebugScreen() {
  const setColorMode = useSetColorMode()

  return (
    <ScrollView>
      <CenteredView>
        <Box pa="xl" gap="xxl">
          <Box row gap="s">
            <Button onPress={() => setColorMode('system')}>
              <Text>System</Text>
            </Button>
            <Button onPress={() => setColorMode('light')}>
              <Text>Light</Text>
            </Button>
            <Button onPress={() => setColorMode('dark')}>
              <Text>Dark</Text>
            </Button>
          </Box>

          <BreakpointDebugger />

          <Box gap="m">
            <H1>Heading 1</H1>
            <H2>Heading 2</H2>
            <H3>Heading 3</H3>
            <H4>Heading 4</H4>
            <H5>Heading 5</H5>
            <H6>Heading 6</H6>
          </Box>

          <Box gap="m">
            <Text fontSize="xl" fontWeight="900">
              H1 Size Text
            </Text>
            <Text fontSize="l">H2 Size Text</Text>
            <Text fontSize="m">H3 Size Text</Text>
            <Text fontSize="s">H4 Size Text</Text>
            <Text fontSize="xs">H5 Size Text</Text>
            <Text fontSize="xxs">H6 Size Text</Text>
          </Box>

          <Box pa="s" gap="m" bg="l3">
            <Box row gap="s">
              <Box pa="s" bg="l6" />
              <Box pa="s" bg="l6" />
              <Box pa="s" bg="l6" />
            </Box>

            <Box row gap="s">
              <Box pa="s" bg="l6" flex={1} />
              <Box pa="s" bg="l6" flex={1} />
              <Box pa="s" bg="l6" flex={1} />
            </Box>

            <Box row gap="s">
              <Box pa="s" bg="l6" flex={1} />
              <Box pa="s" bg="l6" flex={2} />
              <Box pa="s" bg="l6" flex={1} />
            </Box>
          </Box>

          <Box
            row
            justifyContent="center"
            px="l"
            py="l"
            bg="l3"
            gtMobile={{
              py: 'xl',
              bg: 'l5',
            }}
            gtTablet={{
              py: 64,
              bg: 'l7',
            }}>
            <Box w={64} h={64} bg="primary" />
          </Box>
        </Box>
      </CenteredView>
    </ScrollView>
  )
}
