import React from 'react'
import {View, Text as RNText} from 'react-native'
import {CenteredView, ScrollView} from '#/view/com/util/Views'

import {useSetColorMode} from '#/state/shell'
import {
  useBreakpoints,
  useStyle,
  useStyles,
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

function ThemeSelector() {
  const setColorMode = useSetColorMode()

  return (
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
  )
}

function BreakpointDebugger() {
  const breakpoints = useBreakpoints()

  return (
    <Box>
      <H3 pb="s" fontWeight="bold">
        Breakpoint Debugger
      </H3>
      <Text pa="m" bg="l1" fontFamily="monospace">
        {JSON.stringify(breakpoints, null, 2)}
      </Text>
    </Box>
  )
}

function Hooks() {
  const outer = useStyle({
    pa: 'm',
    bg: 'l1',
  })
  const {heading} = useStyles({
    heading: {
      fontSize: 'l',
      fontWeight: 'bold',
      gtTablet: {
        fontSize: 'xl',
      },
    },
  })

  return (
    <View style={outer}>
      <RNText style={heading}>Hooks</RNText>
    </View>
  )
}

export function DebugScreen() {
  const backgroundStyles = useStyle({
    bg: 'l0',
  })

  return (
    <ScrollView>
      <CenteredView style={backgroundStyles}>
        <Box pa="xl" gap="xxl">
          <ThemeSelector />

          <Box row gap="m">
            <Box column bg="l0" h={60} />
            <Box column bg="l1" h={60} />
            <Box column bg="l2" h={60} />
            <Box column bg="l3" h={60} />
            <Box column bg="l4" h={60} />
            <Box column bg="l5" h={60} />
            <Box column bg="l6" h={60} />
            <Box column bg="l7" h={60} />
          </Box>

          <BreakpointDebugger />

          <Box>
            <H3 pb="s" fontWeight="bold">
              Typography
            </H3>

            <Box gap="m" pa="m" bg="l1">
              <H1>Heading 1</H1>
              <H2>Heading 2</H2>
              <H3>Heading 3</H3>
              <H4>Heading 4</H4>
              <H5>Heading 5</H5>
              <H6>Heading 6</H6>
              <Text fontSize="xl" fontWeight="bold">
                H1 Size Text
              </Text>
              <Text fontSize="l">H2 Size Text</Text>
              <Text fontSize="m">H3 Size Text</Text>
              <Text fontSize="s">H4 Size Text</Text>
              <Text fontSize="xs">H5 Size Text</Text>
              <Text fontSize="xxs">H6 Size Text</Text>
            </Box>
          </Box>

          <Box>
            <H3 pb="s" fontWeight="bold">
              Grid
            </H3>
            <Box pa="m" gap="m" bg="l1">
              <Box row gap="s">
                <Box pa="s" bg="l6" />
                <Box pa="s" bg="l6" />
                <Box pa="s" bg="l6" />
              </Box>

              <Box row gap="s">
                <Box column pa="s" bg="l6" />
                <Box column pa="s" bg="l6" />
                <Box column pa="s" bg="l6" />
              </Box>

              <Box row gap="s">
                <Box column pa="s" bg="l6" debug />
                <Box column={2} pa="s" bg="l6" debug />
                <Box column pa="s" bg="l6" />
              </Box>
            </Box>
          </Box>

          <Box>
            <H3 pb="s" fontWeight="bold">
              Breakpoint styles
            </H3>

            <Box
              row
              justifyContent="center"
              px="l"
              py="l"
              bg="l2"
              gtMobile={{
                py: 'xl',
                bg: 'l4',
              }}
              gtTablet={{
                py: 64,
                bg: 'l6',
              }}>
              <Box w={64} h={64} bg="primary" />
            </Box>
          </Box>

          <Hooks />
        </Box>
      </CenteredView>
    </ScrollView>
  )
}
