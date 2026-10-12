import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {PlusSmall_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {PILL_LEFT, PILL_RIGHT_TEXT, PILL_VERTICAL} from '../pillSize'
import {buildProfileRow, reorderLinks} from '../row'
import {MAX_PROFILE_LINKS, type ProfileLink} from '../types'
import {LinkFormDialog} from './LinkFormDialog'
import {linkLabel, type PillA11yActions, ProfileLinkPill} from './LinkPill'
import {type SortableItem, SortablePills} from './SortablePills'

/**
 * The Links section of Edit Profile: the links as a wrapping row of pills, an
 * "Add link" pill at the end, and drag to reorder. Tapping a pill opens the
 * form for that link. Changes stay local until the profile is saved.
 */
export function ProfileLinksEditor({
  did,
  links,
  onChange,
  onDragStateChange,
}: {
  /** The owner, whose repo holds the links' stored icons. */
  did: string
  links: ProfileLink[]
  onChange: (links: ProfileLink[]) => void
  onDragStateChange?: (dragging: boolean) => void
}) {
  const {t: l} = useLingui()
  const formControl = useDialogControl()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const editing = editingIndex === null ? null : links[editingIndex]

  const row = buildProfileRow(links, false)
  const rowKeys = row.map(item => item.key)

  const openForm = (index: number | null) => {
    setEditingIndex(index)
    formControl.open()
  }

  const moveBy = (key: string, offset: number) => {
    const from = rowKeys.indexOf(key)
    const to = from + offset
    if (from < 0 || to < 0 || to >= rowKeys.length) return
    const next = [...rowKeys]
    next.splice(from, 1)
    next.splice(to, 0, key)
    onChange(reorderLinks(next, links))
  }

  const a11yActionsFor = (key: string): PillA11yActions => ({
    accessibilityActions: [
      {name: 'moveEarlier', label: l`Move earlier`},
      {name: 'moveLater', label: l`Move later`},
    ],
    onAccessibilityAction: event => {
      if (event.nativeEvent.actionName === 'moveEarlier') moveBy(key, -1)
      if (event.nativeEvent.actionName === 'moveLater') moveBy(key, 1)
    },
  })

  const items: SortableItem[] = row.flatMap(item => {
    if (item.type !== 'link') return []
    const index = links.indexOf(item.link)
    return {
      key: item.key,
      label: linkLabel(item.link),
      node: (
        <ProfileLinkPill
          did={did}
          link={item.link}
          label={l`Edit ${linkLabel(item.link)}`}
          onPress={() => openForm(index)}
          handle
          testID="profileLinkEditorPill"
          a11yActions={a11yActionsFor(item.key)}
        />
      ),
      ghost: <ProfileLinkPill link={item.link} did={did} handle />,
    }
  })

  return (
    <View>
      <TextField.LabelText>
        <Trans>Links</Trans>
      </TextField.LabelText>
      <SortablePills
        items={items}
        onReorder={keys => onChange(reorderLinks(keys, links))}
        onDragStateChange={onDragStateChange}
        trailing={
          links.length < MAX_PROFILE_LINKS ? (
            <AddLinkPill onPress={() => openForm(null)} />
          ) : null
        }
      />
      <LinkFormDialog
        control={formControl}
        link={editing}
        existingUrls={links
          .filter((_, i) => i !== editingIndex)
          .map(link => link.url)}
        onSave={saved =>
          onChange(
            editingIndex === null
              ? [...links, saved]
              : links.map((link, i) => (i === editingIndex ? saved : link)),
          )
        }
        onRemove={
          editingIndex === null
            ? undefined
            : () => onChange(links.filter((_, i) => i !== editingIndex))
        }
      />
    </View>
  )
}

function AddLinkPill({onPress}: {onPress: () => void}) {
  const {t: l} = useLingui()
  const t = useTheme()
  return (
    <Button
      testID="profileLinkAddBtn"
      label={l`Add a link`}
      size="small"
      color="secondary"
      variant="outline"
      onPress={onPress}
      style={{
        // the outline variant draws a hairline on native; this wants a full point
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: t.palette.contrast_600,
        paddingVertical: PILL_VERTICAL,
        paddingLeft: PILL_LEFT,
        paddingRight: PILL_RIGHT_TEXT,
      }}>
      <ButtonIcon icon={PlusIcon} />
      <ButtonText style={{marginLeft: -2}}>
        <Trans>Add link</Trans>
      </ButtonText>
    </Button>
  )
}
