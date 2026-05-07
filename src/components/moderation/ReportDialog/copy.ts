import {useMemo} from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {type ParsedReportSubject} from './types'

export function useCopyForSubject(subject: ParsedReportSubject) {
  const {_} = useLingui()
  return useMemo(() => {
    switch (subject.type) {
      case 'account': {
        return {
          title: _(msg`Report this user`),
          subtitle: _(msg`Why should this user be reviewed?`),
        }
      }
      case 'status': {
        return {
          title: _(msg`Report this livestream`),
          subtitle: _(msg`Why should this livestream be reviewed?`),
        }
      }
      case 'post': {
        return {
          title: _(msg`Report this post`),
          subtitle: _(msg`Why should this post be reviewed?`),
        }
      }
      case 'list': {
        return {
          title: _(msg`Report this list`),
          subtitle: _(msg`Why should this list be reviewed?`),
        }
      }
      case 'feed': {
        return {
          title: _(msg`Report this feed`),
          subtitle: _(msg`Why should this feed be reviewed?`),
        }
      }
      case 'starterPack': {
        return {
          title: _(msg`Report this starter pack`),
          subtitle: _(msg`Why should this starter pack be reviewed?`),
        }
      }
      case 'convoMessage': {
        switch (subject.view) {
          case 'convo': {
            return {
              title: _(msg`Report this conversation`),
              subtitle: _(msg`Why should this conversation be reviewed?`),
            }
          }
          case 'message': {
            return {
              title: _(msg`Report this message`),
              subtitle: _(msg`Why should this message be reviewed?`),
            }
          }
        }
      }
    }
  }, [_, subject])
}
