import {describe, expect, it} from '@jest/globals'

import {type app} from '#/lexicons'
import {parseReportSubject} from './parseReportSubject'

describe('parseReportSubject', () => {
  it('reports a profile link as its link record', () => {
    const link = {
      $type: 'app.bsky.actor.defs#profileLinkView',
      uri: 'at://did:plc:kat/app.bsky.actor.link/3kabc',
      cid: 'bafyreigjtngycmin6ae2654mhhjcmtusy34pz6m5nsonc7vvubll6pokiu',
      url: 'https://ko-fi.com/kat',
    } as app.bsky.actor.defs.ProfileLinkView & {
      $type: 'app.bsky.actor.defs#profileLinkView'
    }
    expect(parseReportSubject(link)).toEqual({
      type: 'profileLink',
      uri: link.uri,
      cid: link.cid,
      nsid: 'app.bsky.actor.link',
    })
  })
})
