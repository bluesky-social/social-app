import {useSetThemePrefs, useThemePrefs} from '#/state/shell'
import {Button, ButtonIcon} from '#/components/Button'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/Settings'
import * as Menu from '#/components/Menu'

const THEMES = [
  {name: 'system', label: 'System'},
  {name: 'light', label: 'Light'},
  {name: 'dim', label: 'Dim'},
  {name: 'dark', label: 'Dark'},
] as const

export function ThemeMenu() {
  const {colorMode, darkTheme} = useThemePrefs()
  const {setColorMode, setDarkTheme} = useSetThemePrefs()
  const selectedTheme = colorMode === 'dark' ? darkTheme : colorMode

  return (
    <Menu.Root>
      <Menu.Trigger label="Choose Storybook theme">
        {({props}) => (
          <Button
            {...props}
            testID="storybookThemeMenu"
            label={props.accessibilityLabel}
            color="secondary"
            size="small"
            shape="round">
            <ButtonIcon icon={SettingsIcon} />
          </Button>
        )}
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.LabelText>Theme</Menu.LabelText>
        <Menu.Group>
          {THEMES.map(({name, label}) => (
            <Menu.Item
              key={name}
              testID={`storybookTheme-${name}`}
              label={`Set theme to ${label}`}
              accessibilityState={{selected: selectedTheme === name}}
              onPress={() => {
                if (name === 'system' || name === 'light') {
                  setColorMode(name)
                } else {
                  setColorMode('dark')
                  setDarkTheme(name)
                }
              }}>
              <Menu.ItemText>{label}</Menu.ItemText>
              <Menu.ItemRadio selected={selectedTheme === name} />
            </Menu.Item>
          ))}
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}
