import React from 'react'
import {observer} from 'mobx-react-lite'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'

import {ThemeProvider, Box, Text, H1, H2, H3, P} from 'lib/design-system'
import {Toggle} from 'view/com/util/forms/ToggleButton'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'DesignSystem'>

function ToggleButtons() {
  const [selected, setSelected] = React.useState(false)
  return (
    <>
      <Toggle selected={selected} onPress={() => setSelected(!selected)}>
        Toggle button
      </Toggle>
    </>
  )
}

export const DesignSystemScreen = withAuthRequired(
  observer(function DesignSystem({}: Props) {
    return (
      <ThemeProvider theme="dark">
        <Box pa="m" gtPhone={{padding: 'l'}} debug>
          <H2 as="h1" c="text" gtPhone={{mb: 'm', marginTop: 'l'}}>
            Heading 1
          </H2>
          <H1 as="h2" c="text" style={{color: 'tomato'}}>
            Heading 2
          </H1>
          <H3 lh="xl">Heading 3</H3>
          <P caps>Paragraph</P>

          <Box inline aic gap="m" my="l">
            <Box w={100} h={100} bg="textLink" />
            <Box w={50} h={50} bg="text" />
            <Text font="mono">Monospace</Text>
          </Box>

          <Box py="l">
            <ToggleButtons />
          </Box>
        </Box>
      </ThemeProvider>
    )
  }),
)
