import React from 'react'
import {View} from 'react-native'

import {useDialogStateControlContext} from '#/state/dialogs'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import {H3, P, Text} from '#/components/Typography'
import {PlatformInfo} from '../../../../modules/expo-bluesky-swiss-army'

export function Dialogs() {
  const scrollable = Dialog.useDialogControl()
  const basic = Dialog.useDialogControl()
  const prompt = Prompt.usePromptControl()
  const withMenu = Dialog.useDialogControl()
  const testDialog = Dialog.useDialogControl()
  const {closeAllDialogs} = useDialogStateControlContext()
  const unmountTestDialog = Dialog.useDialogControl()
  const [reducedMotionEnabled, setReducedMotionEnabled] =
    React.useState<boolean>()
  const [shouldRenderUnmountTest, setShouldRenderUnmountTest] =
    React.useState(false)
  const unmountTestInterval = React.useRef<number>()

  const onUnmountTestStartPressWithClose = () => {
    setShouldRenderUnmountTest(true)

    setTimeout(() => {
      unmountTestDialog.open()
    }, 1000)

    setTimeout(() => {
      unmountTestDialog.close()
    }, 4950)

    setInterval(() => {
      setShouldRenderUnmountTest(prev => !prev)
    }, 5000)
  }

  const onUnmountTestStartPressWithoutClose = () => {
    setShouldRenderUnmountTest(true)

    setTimeout(() => {
      unmountTestDialog.open()
    }, 1000)

    setInterval(() => {
      setShouldRenderUnmountTest(prev => !prev)
    }, 5000)
  }

  const onUnmountTestEndPress = () => {
    setShouldRenderUnmountTest(false)
    clearInterval(unmountTestInterval.current)
  }

  return (
    <View style={[a.gap_md]}>
      <Button
        variant="outline"
        color="secondary"
        size="small"
        onPress={() => {
          scrollable.open()
          prompt.open()
          basic.open()
          withMenu.open()
        }}
        label="Open basic dialog">
        <ButtonText>Open all dialogs</ButtonText>
      </Button>

      <Button
        variant="outline"
        color="secondary"
        size="small"
        onPress={() => {
          scrollable.open()
        }}
        label="Open basic dialog">
        <ButtonText>Open scrollable dialog</ButtonText>
      </Button>

      <Button
        variant="outline"
        color="secondary"
        size="small"
        onPress={() => {
          basic.open()
        }}
        label="Open basic dialog">
        <ButtonText>Open basic dialog</ButtonText>
      </Button>

      <Button
        variant="outline"
        color="primary"
        size="small"
        onPress={() => withMenu.open()}
        label="Open dialog with menu in it">
        <ButtonText>Open dialog with menu in it</ButtonText>
      </Button>

      <Button
        variant="solid"
        color="primary"
        size="small"
        onPress={() => prompt.open()}
        label="Open prompt">
        <ButtonText>Open prompt</ButtonText>
      </Button>

      <Button
        variant="solid"
        color="primary"
        size="small"
        onPress={testDialog.open}
        label="one">
        <ButtonText>Open Tester</ButtonText>
      </Button>

      <Button
        variant="solid"
        color="primary"
        size="small"
        onPress={onUnmountTestStartPressWithClose}
        label="two">
        <ButtonText>Start Unmount Test With `.close()` call</ButtonText>
      </Button>

      <Button
        variant="solid"
        color="primary"
        size="small"
        onPress={onUnmountTestStartPressWithoutClose}
        label="two">
        <ButtonText>Start Unmount Test Without `.close()` call</ButtonText>
      </Button>

      <Button
        variant="solid"
        color="primary"
        size="small"
        onPress={onUnmountTestEndPress}
        label="two">
        <ButtonText>End Unmount Test</ButtonText>
      </Button>

      <Button
        variant="solid"
        color="primary"
        size="small"
        onPress={() => {
          const isReducedMotionEnabled =
            PlatformInfo.getIsReducedMotionEnabled()
          setReducedMotionEnabled(isReducedMotionEnabled)
        }}
        label="two">
        <ButtonText>
          Is reduced motion enabled?: (
          {reducedMotionEnabled?.toString() || 'undefined'})
        </ButtonText>
      </Button>

      <Prompt.Outer control={prompt}>
        <Prompt.TitleText>This is a prompt</Prompt.TitleText>
        <Prompt.DescriptionText>
          This is a generic prompt component. It accepts a title and a
          description, as well as two actions.
        </Prompt.DescriptionText>
        <Prompt.Actions>
          <Prompt.Cancel />
          <Prompt.Action cta="Confirm" onPress={() => {}} />
        </Prompt.Actions>
      </Prompt.Outer>

      <Dialog.Outer control={basic}>
        <Dialog.Inner label="test">
          <H3 nativeID="dialog-title">Dialog</H3>
          <P nativeID="dialog-description">A basic dialog</P>
        </Dialog.Inner>
      </Dialog.Outer>

      <Dialog.Outer control={withMenu}>
        <Dialog.Inner label="test">
          <H3 nativeID="dialog-title">Dialog with Menu</H3>
          <Menu.Root>
            <Menu.Trigger label="Open menu">
              {({props}) => (
                <Button
                  style={a.mt_2xl}
                  label="Open menu"
                  color="primary"
                  variant="solid"
                  size="large"
                  {...props}>
                  <ButtonText>Open Menu</ButtonText>
                </Button>
              )}
            </Menu.Trigger>
            <Menu.Outer>
              <Menu.Group>
                <Menu.Item label="Item 1" onPress={() => console.log('item 1')}>
                  <Menu.ItemText>Item 1</Menu.ItemText>
                </Menu.Item>
                <Menu.Item label="Item 2" onPress={() => console.log('item 2')}>
                  <Menu.ItemText>Item 2</Menu.ItemText>
                </Menu.Item>
              </Menu.Group>
            </Menu.Outer>
          </Menu.Root>
        </Dialog.Inner>
      </Dialog.Outer>

      <Dialog.Outer control={scrollable}>
        <Dialog.ScrollableInner
          accessibilityDescribedBy="dialog-description"
          accessibilityLabelledBy="dialog-title">
          <View style={[a.relative, a.gap_md, a.w_full]}>
            <H3 nativeID="dialog-title">Dialog</H3>
            <P nativeID="dialog-description">
              A scrollable dialog with an input within it.
            </P>
            <Dialog.Input value="" onChangeText={() => {}} label="Type here" />

            <Button
              variant="outline"
              color="secondary"
              size="small"
              onPress={closeAllDialogs}
              label="Close all dialogs">
              <ButtonText>Close all dialogs</ButtonText>
            </Button>
            <View style={{height: 1000}} />
            <View style={[a.flex_row, a.justify_end]}>
              <Button
                variant="outline"
                color="primary"
                size="small"
                onPress={() =>
                  scrollable.close(() => {
                    console.log('CLOSED')
                  })
                }
                label="Open basic dialog">
                <ButtonText>Close dialog</ButtonText>
              </Button>
            </View>
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>

      <Dialog.Outer control={testDialog}>
        <Dialog.ScrollableInner
          accessibilityDescribedBy="dialog-description"
          accessibilityLabelledBy="dialog-title">
          <View style={[a.relative, a.gap_md, a.w_full]}>
            <Text>
              Watch the console logs to test each of these dialog edge cases.
              Functionality should be consistent across both native and web. If
              not then *sad face* something is wrong.
            </Text>

            <Button
              variant="outline"
              color="primary"
              size="small"
              onPress={() => {
                testDialog.close(() => {
                  console.log('close callback')
                })
              }}
              label="Close It">
              <ButtonText>Normal Use (Should just log)</ButtonText>
            </Button>

            <Button
              variant="outline"
              color="primary"
              size="small"
              onPress={() => {
                testDialog.close(() => {
                  console.log('close callback')
                })

                setTimeout(() => {
                  testDialog.open()
                }, 100)
              }}
              label="Close It">
              <ButtonText>
                Calls `.open()` in 100ms (Should log when the animation switches
                to open)
              </ButtonText>
            </Button>

            <Button
              variant="outline"
              color="primary"
              size="small"
              onPress={() => {
                setTimeout(() => {
                  testDialog.open()
                }, 2e3)

                testDialog.close(() => {
                  console.log('close callback')
                })
              }}
              label="Close It">
              <ButtonText>
                Calls `.open()` in 2000ms (Should log after close animation and
                not log on open)
              </ButtonText>
            </Button>

            <Button
              variant="outline"
              color="primary"
              size="small"
              onPress={() => {
                testDialog.close(() => {
                  console.log('close callback')
                })
                setTimeout(() => {
                  testDialog.close(() => {
                    console.log('close callback after 100ms')
                  })
                }, 100)
              }}
              label="Close It">
              <ButtonText>
                Calls `.close()` then again in 100ms (should log twice)
              </ButtonText>
            </Button>

            <Button
              variant="outline"
              color="primary"
              size="small"
              onPress={() => {
                testDialog.close(() => {
                  console.log('close callback')
                })
                testDialog.close(() => {
                  console.log('close callback 2')
                })
              }}
              label="Close It">
              <ButtonText>
                Call `close()` twice immediately (should just log twice)
              </ButtonText>
            </Button>

            <Button
              variant="outline"
              color="primary"
              size="small"
              onPress={() => {
                console.log('Step 1')
                testDialog.close(() => {
                  console.log('Step 3')
                })
                console.log('Step 2')
              }}
              label="Close It">
              <ButtonText>
                Log before `close()`, after `close()` and in the `close()`
                callback. Should be an order of 1 2 3
              </ButtonText>
            </Button>
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>

      {shouldRenderUnmountTest && (
        <Dialog.Outer control={unmountTestDialog}>
          <Dialog.Inner label="test">
            <H3 nativeID="dialog-title">Unmount Test Dialog</H3>
            <P nativeID="dialog-description">Will unmount in about 5 seconds</P>
          </Dialog.Inner>
        </Dialog.Outer>
      )}
    </View>
  )
}
