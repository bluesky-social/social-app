import {type EmbedPlayerParams} from '#/lib/strings/embed-player'

export function PlayerFrame({
  params,
  onLoad,
}: {
  params: EmbedPlayerParams
  onLoad: () => void
}) {
  return (
    <iframe
      title={params.source}
      src={params.playerUri}
      onLoad={onLoad}
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      allowFullScreen
      style={{
        width: '100%',
        height: '100%',
        border: 0,
        background: 'transparent',
      }}
    />
  )
}
