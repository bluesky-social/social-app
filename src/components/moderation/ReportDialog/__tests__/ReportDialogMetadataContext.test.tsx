import {useEffect} from 'react'
import {render} from '@testing-library/react-native'

import {
  Provider,
  type ReportDialogMetadata,
  useReportDialogMetadataContext,
} from '../ReportDialogMetadataContext'

type MetadataRef = React.RefObject<ReportDialogMetadata> | null

function CaptureContext({capture}: {capture: (context: MetadataRef) => void}) {
  const context = useReportDialogMetadataContext()

  useEffect(() => {
    capture(context)
  }, [capture, context])

  return null
}

describe('ReportDialogMetadataContext', () => {
  it('provides stable mutable metadata without rerendering consumers', () => {
    const contexts: MetadataRef[] = []
    const capture = (context: MetadataRef) => contexts.push(context)
    const view = render(
      <Provider>
        <CaptureContext capture={capture} />
      </Provider>,
    )

    expect(contexts).toHaveLength(1)
    expect(contexts[0]?.current).toEqual({})

    if (contexts[0]) {
      contexts[0].current.videoTimestampSeconds = 12.5
    }
    expect(contexts[0]?.current.videoTimestampSeconds).toBe(12.5)
    expect(contexts).toHaveLength(1)

    view.rerender(
      <Provider>
        <CaptureContext capture={capture} />
      </Provider>,
    )
    expect(contexts).toHaveLength(1)
  })

  it('keeps metadata isolated between providers', () => {
    let first: MetadataRef
    let second: MetadataRef

    render(
      <>
        <Provider>
          <CaptureContext capture={context => (first = context)} />
        </Provider>
        <Provider>
          <CaptureContext capture={context => (second = context)} />
        </Provider>
      </>,
    )

    expect(first!).not.toBe(second!)
  })

  it('uses the nearest provider for nested subjects', () => {
    let outer: MetadataRef
    let inner: MetadataRef

    render(
      <Provider>
        <CaptureContext capture={context => (outer = context)} />
        <Provider>
          <CaptureContext capture={context => (inner = context)} />
        </Provider>
      </Provider>,
    )

    expect(outer!).not.toBe(inner!)
  })

  it('returns null outside a provider', () => {
    let captured: MetadataRef
    render(<CaptureContext capture={context => (captured = context)} />)
    expect(captured!).toBeNull()
  })
})
