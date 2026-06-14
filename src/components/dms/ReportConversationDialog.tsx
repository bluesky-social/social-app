import {type DialogControlProps} from '#/components/Dialog'
import {ReportDialog} from '#/components/moderation/ReportDialog'

export function ReportConversationDialog({
  control,
  convoId,
  did,
  onAfterSubmit,
}: {
  control: DialogControlProps
  convoId: string
  did: string
  onAfterSubmit?: () => void
}) {
  return (
    <ReportDialog
      control={control}
      subject={{convoId, did}}
      onAfterSubmit={onAfterSubmit}
    />
  )
}
