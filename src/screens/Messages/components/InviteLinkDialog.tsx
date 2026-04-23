import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme, web} from '#/alf'
import {
  Button,
  ButtonIcon,
  ButtonText,
  StackedButton,
} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon} from '#/components/icons/Arrow'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRightIcon} from '#/components/icons/ArrowShareRight'
import {ChainLinkBroken_Stroke2_Corner0_Rounded as ChainLinkBrokenIcon} from '#/components/icons/ChainLink'
import {EditBig_Stroke2_Corner2_Rounded as EditIcon} from '#/components/icons/EditBig'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {CopyTextButton} from './CopyTextButton'
import {EditTextButton} from './EditTextButton'

enum Step {
  INFO,
  GENERATE,
  MANAGE,
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: 'numeric',
})
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

export function InviteLinkDialog({
  control,
}: {
  control: Dialog.DialogOuterProps['control']
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const [step, setStep] = useState(Step.INFO)
  const [whoCanJoin, setWhoCanJoin] = useState(['anyone'])

  const whoCanJoinOptions = [
    {name: 'anyone', label: l`Anyone can join instantly`},
    {name: 'anyone:requireApproval', label: l`Anyone can request to join`},
    {name: 'followedByOwner', label: l`People I follow can join instantly`},
    {
      name: 'followedByOwner:requireApproval',
      label: l`People I follow can request to join`,
    },
  ]

  let content: React.ReactNode | null = null
  let header: string | null = null
  switch (step) {
    case Step.INFO:
      header = l`Invite link`
      content = (
        <>
          <View>
            <Text style={[a.text_md, t.atoms.text]}>
              <Trans>
                An invite link lets people join this group chat without being
                added directly. You control who can use the link and whether
                they need your approval. You can disable the link at any time.
              </Trans>
            </Text>
            <Text style={[a.mt_lg, a.text_md, t.atoms.text]}>
              <Trans>
                Your name, avatar, and the name of the group chat will be
                visible to everyone.
              </Trans>
            </Text>
          </View>
          <View style={[a.mt_4xl]}>
            <Button
              label={l`Get started`}
              color="primary"
              size="large"
              onPress={() => {
                setStep(Step.GENERATE)
              }}>
              <ButtonText>
                <Trans>Get started</Trans>
              </ButtonText>
              <ButtonIcon icon={ArrowRightIcon} />
            </Button>
          </View>
        </>
      )
      break
    case Step.GENERATE:
      header = l`Generate invite link`
      content = (
        <>
          <View>
            <Text style={[a.text_md, t.atoms.text]}>
              <Trans>Choose who can join this group chat and how.</Trans>
            </Text>
          </View>
          <View style={[a.mt_lg]}>
            <Toggle.Group
              label={l`Who can join this group chat and how`}
              type="radio"
              values={whoCanJoin}
              onChange={setWhoCanJoin}>
              <View style={[a.gap_sm]}>
                {whoCanJoinOptions.map(option => (
                  <Toggle.Item
                    key={option.name}
                    highlightRow={true}
                    label={option.label}
                    name={option.name}
                    style={[a.flex_1]}>
                    {({selected}) => (
                      <TargetOption label={option.label} selected={selected} />
                    )}
                  </Toggle.Item>
                ))}
              </View>
            </Toggle.Group>
          </View>
          <View style={[a.mt_4xl]}>
            <Button
              label={l`Generate invite link`}
              color="primary"
              size="large"
              onPress={() => {
                setStep(Step.MANAGE)
              }}>
              <ButtonText>
                <Trans>Generate invite link</Trans>
              </ButtonText>
              <ButtonIcon icon={ArrowRightIcon} />
            </Button>
          </View>
        </>
      )
      break
    case Step.MANAGE:
      const createdAt = new Date()
      const value =
        whoCanJoinOptions.find(o => o.name === whoCanJoin[0])?.label ??
        whoCanJoinOptions[0].label
      header = l`Invite link`
      content = (
        <>
          <View style={[a.mt_lg]}>
            <CopyTextButton
              label={l`Invite link`}
              value="https://bsky.app/chat/asdf123">
              <Text
                numberOfLines={1}
                style={[a.mr_xs, a.text_md, t.atoms.text]}>
                https//bsky.app/chat/asdf123
              </Text>
            </CopyTextButton>
            <Text style={[a.mt_xs, a.text_xs, t.atoms.text_contrast_medium]}>
              <Trans>
                Created {timeFormatter.format(createdAt)}{' '}
                {dateFormatter.format(createdAt)}
              </Trans>
            </Text>
          </View>
          <View style={[a.mt_lg]}>
            <EditTextButton
              label={l`Edit link settings`}
              value={value}
              onPress={() => setStep(Step.GENERATE)}>
              <Text
                numberOfLines={1}
                style={[a.mr_xs, a.text_md, t.atoms.text, {maxWidth: '80%'}]}>
                {value}
              </Text>
            </EditTextButton>
          </View>
          <View style={[a.flex_row, a.justify_between, a.gap_sm, a.mt_lg]}>
            <StackedButton
              label={l`Disable`}
              icon={ChainLinkBrokenIcon}
              color="negative_subtle"
              style={[a.flex_1, a.rounded_full]}
              onPress={() => {}}>
              Disable
            </StackedButton>
            <StackedButton
              label={l`Post link`}
              icon={EditIcon}
              color="primary_subtle"
              style={[a.flex_1, a.rounded_full]}
              onPress={() => {}}>
              Post link
            </StackedButton>
            <StackedButton
              label={l`Share`}
              icon={ArrowShareRightIcon}
              color="primary_subtle"
              style={[a.flex_1, a.rounded_full]}
              onPress={() => {}}>
              Share
            </StackedButton>
          </View>
        </>
      )
      break
  }

  return (
    <Dialog.Outer
      control={control}
      onClose={() => {
        setStep(Step.INFO)
        setWhoCanJoin(['anyone'])
      }}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        header={
          <View>
            <View style={[IS_WEB ? [a.px_2xl, a.pt_xl] : {paddingTop: 10}]}>
              <Text style={[a.font_bold, a.text_2xl, a.mb_sm, t.atoms.text]}>
                {header}
              </Text>
            </View>
            <Dialog.Close />
          </View>
        }
        label={l`Group chat invite link dialog`}
        style={web({maxWidth: 400})}>
        {content}
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function TargetOption({label, selected}: {label: string; selected: boolean}) {
  const t = useTheme()

  return (
    <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
      <Toggle.Radio />
      <Toggle.LabelText
        style={[
          a.font_normal,
          a.flex_1,
          a.leading_tight,
          selected ? t.atoms.text : t.atoms.text_contrast_high,
        ]}>
        {label}
      </Toggle.LabelText>
    </View>
  )
}
