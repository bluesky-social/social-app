import {Sentry} from '#/logger/sentry/lib'

type PreviewOutcome =
  'success' | 'no_image' | 'metadata_error' | 'thumbnail_error' | 'error'

/**
 * Times an external preview through metadata and optional thumbnail preparation.
 * Do not attach target URLs, account identifiers, or request bodies to this span.
 */
export function createLinkPreviewTelemetry() {
  type Span = ReturnType<typeof Sentry.startInactiveSpan>

  const preview = Sentry.startInactiveSpan({
    name: 'link.preview',
    op: 'link.preview',
    attributes: {surface: 'composer'},
  })
  let phase: Span | undefined
  let finished = false

  function finishPhase() {
    phase?.end()
    phase = undefined
  }

  function startPhase(name: 'metadata' | 'thumbnail') {
    if (finished) return
    finishPhase()
    phase = Sentry.withActiveSpan(preview, () =>
      Sentry.startInactiveSpan({
        name: `link.preview.${name}`,
        op: `link.preview.${name}`,
      }),
    )
  }

  return {
    startMetadata() {
      startPhase('metadata')
    },
    finishMetadata(hasImage: boolean) {
      preview.setAttribute('metadata.has_image', hasImage)
      finishPhase()
    },
    startThumbnail() {
      startPhase('thumbnail')
    },
    finish(outcome: PreviewOutcome) {
      if (finished) return
      preview.setAttribute('outcome', outcome)
      finished = true
      finishPhase()
      preview.end()
    },
  }
}
