import React from 'react'

export default class HLSDownloadView extends React.PureComponent {
  constructor(props: {}) {
    super(props)
  }

  async downloadAsync(
    sourceUrl: string,
    progressCb: (progress: number) => void,
  ): Promise<string | null> {
    throw new Error(`Method not implemented. ${sourceUrl} ${progressCb}`)
  }

  async cancelAsync(sourceUrl: string): Promise<void> {
    throw new Error(`Method not implemented. ${sourceUrl}`)
  }

  render() {
    return null
  }
}
