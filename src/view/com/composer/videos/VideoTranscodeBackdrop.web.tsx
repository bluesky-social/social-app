import {atoms as a, flatten} from '#/alf'

export function clearThumbnailCache() {
  // no-op on web
}

export function VideoTranscodeBackdrop({uri}: {uri: string}) {
  return (
    <video
      src={uri}
      style={flatten([
        a.absolute,
        a.inset_0,
        a.h_full,
        a.w_full,
        {
          objectFit: 'cover',
          filter: 'blur(15px)',
          transform: 'scale(1.1)', // hide blur edges
        },
      ])}
      muted
      playsInline
    />
  )
}
