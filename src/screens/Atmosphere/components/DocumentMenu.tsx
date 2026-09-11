import {useLingui} from '@lingui/react/macro'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {EventStopper} from '#/view/com/util/EventStopper'
import {Button, ButtonIcon} from '#/components/Button'
import {DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon} from '#/components/icons/DotGrid'
import * as Menu from '#/components/Menu'
import {useGlobalReportDialogControl} from '#/components/moderation/ReportDialog'
import {type app} from '#/lexicons'
import {navigate} from '#/Navigation'
import {type ActivityActor} from '../types'

export function DocumentMenu({
  view,
  author,
  testID = 'atmosphereDocumentMenu',
}: {
  view?: app.bsky.embed.external.ViewExternal
  author?: ActivityActor
  testID?: string
}) {
  const {t: l} = useLingui()
  const openLink = useOpenLink()
  const reportDialogControl = useGlobalReportDialogControl()
  const publicationUri = view?.source?.uri

  if (!publicationUri && !author) return null

  return (
    <EventStopper onKeyDown={false}>
      <Menu.Root>
        <Menu.Trigger label={l`More options`}>
          {({props}) => (
            <Button
              {...props}
              label={props.accessibilityLabel}
              testID={testID}
              size="tiny"
              color="secondary"
              shape="round">
              <ButtonIcon icon={EllipsisIcon} size="xs" />
            </Button>
          )}
        </Menu.Trigger>
        <Menu.Outer showCancel style={{minWidth: 180}}>
          <Menu.Group>
            <Menu.Item
              label={l`View publication`}
              disabled={!publicationUri}
              onPress={() => {
                if (publicationUri) openLink(publicationUri)
              }}>
              <Menu.ItemText>{l`View publication`}</Menu.ItemText>
            </Menu.Item>
            <Menu.Item
              label={l`View author`}
              disabled={!author}
              onPress={() => {
                if (author) {
                  void navigate('Profile', {name: author.handle})
                }
              }}>
              <Menu.ItemText>{l`View author`}</Menu.ItemText>
            </Menu.Item>
          </Menu.Group>
          <Menu.Divider />
          <Menu.Group>
            <Menu.Item
              label={l`Report this`}
              disabled={!author}
              destructive
              onPress={() => {
                if (author) {
                  reportDialogControl.open({
                    subject: {
                      ...(author as app.bsky.actor.defs.ProfileViewBasic),
                      $type: 'app.bsky.actor.defs#profileViewBasic',
                    },
                  })
                }
              }}>
              <Menu.ItemText>{l`Report this`}</Menu.ItemText>
            </Menu.Item>
          </Menu.Group>
        </Menu.Outer>
      </Menu.Root>
    </EventStopper>
  )
}
