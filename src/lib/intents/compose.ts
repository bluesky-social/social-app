import {ComposerOpts} from 'state/shell/composer'

export const onComposeIntent = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  text,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  imageUris,
  openComposer,
  hasSession,
}: {
  text: string | null
  imageUris: string | null // unused for right now, will be used later with intents
  openComposer: (opts: ComposerOpts) => unknown
  hasSession: boolean
}) => {
  if (!hasSession) return

  setTimeout(() => {
    openComposer({}) // will pass in values to the composer here in the share extension
  }, 500)
}
