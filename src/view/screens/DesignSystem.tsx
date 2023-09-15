import React from 'react'
import {observer} from 'mobx-react-lite'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'

import {ThemeProvider, Box, Text, H1, H2, H3, P} from 'lib/design-system'
import * as themes from 'lib/design-system/themes'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'DesignSystem'>

export const DesignSystemScreen = withAuthRequired(
  observer(function DesignSystem({}: Props) {
    return (
      <ThemeProvider theme={themes.dark}>
        <Box pa="m" gtPhone={{padding: 'l'}} debug>
          <H2 as="h1" c="theme" gtPhone={{mb: 'm', marginTop: 'l'}}>
            Heading 1
          </H2>
          <H1 as="h2" c="theme" style={{color: 'tomato'}}>
            Heading 2
          </H1>
          <H3 lh="xl">Heading 3</H3>
          <P caps>Paragraph</P>

          <Box inline aic gap="m" my="l">
            <Box w={100} h={100} bg="theme" />
            <Box w={50} h={50} bg="text" />
            <Text font="mono">Monospace</Text>
          </Box>
        </Box>
      </ThemeProvider>
    )
  }),
)
