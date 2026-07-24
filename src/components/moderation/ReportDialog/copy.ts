import {useMemo} from 'react'
import {useLingui} from '@lingui/react/macro'

import {type ParsedReportSubject} from './types'

export function useCopyForSubject(subject: ParsedReportSubject) {
  const {t: l} = useLingui()
  return useMemo(() => {
    switch (subject.type) {
      case 'account': {
        return {
          title: l`Report this user`,
          subtitle: l`Why should this user be reviewed?`,
        }
      }
      case 'status': {
        return {
          title: l`Report this livestream`,
          subtitle: l`Why should this livestream be reviewed?`,
        }
      }
      case 'post': {
        return {
          title: l`Report this post`,
          subtitle: l`Why should this post be reviewed?`,
        }
      }
      case 'list': {
        return {
          title: l`Report this list`,
          subtitle: l`Why should this list be reviewed?`,
        }
      }
      case 'feed': {
        return {
          title: l`Report this feed`,
          subtitle: l`Why should this feed be reviewed?`,
        }
      }
      case 'starterPack': {
        return {
          title: l`Report this starter pack`,
          subtitle: l`Why should this starter pack be reviewed?`,
        }
      }
      case 'convoMessage': {
        switch (subject.view) {
          case 'convo': {
            return {
              title: l`Report this conversation`,
              subtitle: l`Why should this conversation be reviewed?`,
            }
          }
          case 'message': {
            return {
              title: l`Report this message`,
              subtitle: l`Why should this message be reviewed?`,
            }
          }
        }
      }
      case 'convo': {
        return {
          title: l`Report this conversation`,
          subtitle: l`Why should this conversation be reviewed?`,
        }
      }
    }
  }, [l, subject])
}
