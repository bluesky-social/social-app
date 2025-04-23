import {View} from 'react-native'

import * as Toast from '#/view/com/util/Toast'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import {Alien_Stroke2_Corner0_Rounded as AlienIcon} from '#/components/icons/Alien'
import {BirthdayCake_Stroke2_Corner2_Rounded as BirthdayCakeIcon} from '#/components/icons/BirthdayCake'
import {BubbleInfo_Stroke2_Corner2_Rounded as BubbleInfoIcon} from '#/components/icons/BubbleInfo'
import {CircleQuestion_Stroke2_Corner2_Rounded as CircleQuestionIcon} from '#/components/icons/CircleQuestion'
import {Envelope_Stroke2_Corner2_Rounded as EnvelopeIcon} from '#/components/icons/Envelope'
import {Explosion_Stroke2_Corner0_Rounded as ExplosionIcon} from '#/components/icons/Explosion'
import {Earth_Stroke2_Corner2_Rounded as EarthIcon} from '#/components/icons/Globe'
import {PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon} from '#/components/icons/PaintRoller'
import {Person_Stroke2_Corner2_Rounded as PersonIcon} from '#/components/icons/Person'
import {Pizza_Stroke2_Corner0_Rounded as PizzaIcon} from '#/components/icons/Pizza'
import {RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon} from '#/components/icons/RaisingHand'
import {ShieldCheck_Stroke2_Corner0_Rounded as ShieldIcon} from '#/components/icons/Shield'
import {Window_Stroke2_Corner2_Rounded as WindowIcon} from '#/components/icons/Window'
import {Text} from '#/components/Typography'

export function Settings() {
  const t = useTheme()
  return (
    <View style={{marginLeft: -20, marginRight: -20}}>
      <Text style={{marginLeft: 20, paddingBottom: 12}}>Settings</Text>
      <SettingsList.LinkItem to="/settings" label="Account">
        <SettingsList.ItemIcon icon={PersonIcon} />
        <SettingsList.ItemText>Account</SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem to="/settings" label="Privacy and security">
        <SettingsList.ItemIcon icon={PaintRollerIcon} />
        <SettingsList.ItemText>Privacy and security</SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem to="/settings" label="Moderation">
        <SettingsList.ItemIcon icon={HandIcon} />
        <SettingsList.ItemText>Moderation</SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem to="/settings" label="Content and media">
        <SettingsList.ItemIcon icon={WindowIcon} />
        <SettingsList.ItemText>Content and media</SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem
        to="/settings"
        label="Accessibility and appearance">
        <SettingsList.ItemIcon icon={PaintRollerIcon} />
        <SettingsList.ItemText>
          Accessibilty and appearance
        </SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem to="/settings" label="Languages">
        <SettingsList.ItemIcon icon={EarthIcon} />
        <SettingsList.ItemText>Languages</SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem to="/settings" label="Help">
        <SettingsList.ItemIcon icon={CircleQuestionIcon} />
        <SettingsList.ItemText>Help</SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.LinkItem to="/settings" label="About">
        <SettingsList.ItemIcon icon={BubbleInfoIcon} />
        <SettingsList.ItemText>About</SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.Divider />
      <SettingsList.PressableItem
        destructive
        onPress={() => Toast.show('Sign out pressed')}
        label="Sign out">
        <SettingsList.ItemText>Sign out</SettingsList.ItemText>
      </SettingsList.PressableItem>
      <SettingsList.Item style={[a.mt_xl]}>
        <SettingsList.ItemIcon icon={PizzaIcon} />
        <SettingsList.ItemText>Not pressable</SettingsList.ItemText>
      </SettingsList.Item>
      <SettingsList.PressableItem
        onPress={() => Toast.show('Pressable pressed')}
        label="Pressable">
        <SettingsList.ItemIcon icon={AlienIcon} />
        <SettingsList.ItemText>Pressable</SettingsList.ItemText>
      </SettingsList.PressableItem>
      <SettingsList.LinkItem
        to="/settings"
        label="Destructive link"
        destructive>
        <SettingsList.ItemIcon icon={ExplosionIcon} />
        <SettingsList.ItemText>Destructive link</SettingsList.ItemText>
      </SettingsList.LinkItem>
      <SettingsList.PressableItem
        label="Email"
        onPress={() => Toast.show('Email change dialog goes here')}>
        <SettingsList.ItemIcon icon={EnvelopeIcon} />
        <SettingsList.ItemText>Email</SettingsList.ItemText>
        <SettingsList.BadgeText>hello@example.com</SettingsList.BadgeText>
      </SettingsList.PressableItem>
      <SettingsList.PressableItem
        onPress={() => Toast.show('Pressable pressed')}
        label="Protect your account"
        style={[
          a.my_sm,
          a.mx_lg,
          a.rounded_md,
          {backgroundColor: t.palette.primary_50},
        ]}
        hoverStyle={[{backgroundColor: t.palette.primary_100}]}
        contentContainerStyle={[a.rounded_md, a.px_lg]}>
        <SettingsList.ItemIcon
          icon={ShieldIcon}
          color={t.palette.primary_500}
        />
        <SettingsList.ItemText
          style={[{color: t.palette.primary_500}, a.font_bold]}>
          Protect your account
        </SettingsList.ItemText>
        <SettingsList.Chevron color={t.palette.primary_500} />
      </SettingsList.PressableItem>
      <SettingsList.Divider />
      <SettingsList.Item>
        <SettingsList.ItemIcon icon={BirthdayCakeIcon} />
        <SettingsList.ItemText>Birthday</SettingsList.ItemText>
        <SettingsList.BadgeButton
          label="Edit"
          onPress={() => Toast.show('Show edit birthday dialog')}
        />
      </SettingsList.Item>
      <SettingsList.LinkItem to="/settings" label="Long test">
        <SettingsList.ItemIcon icon={ExplosionIcon} />
        <SettingsList.ItemText>
          long long long long long long long long long long long long long long
          long long long long long long long long long long long long long long
          long long long long long long long long long
        </SettingsList.ItemText>
      </SettingsList.LinkItem>
    </View>
  )
}
