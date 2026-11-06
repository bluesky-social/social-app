import {useLingui} from '@lingui/react/macro'

import {type ParsedReportSubject} from './types'

export function useCopyForSubject(subject: ParsedReportSubject) {
  return useGetCopyForSubject()(subject)
}

/**
 * Returns a getter for report copy, for callers that need copy for several
 * subjects at once, e.g. one menu item per reportable record.
 */
export function useGetCopyForSubject() {
  const {t: l} = useLingui()
  return (subject: ParsedReportSubject) => {
    switch (subject.type) {
      case 'account': {
        return {
          title: l`Report this user`,
          subtitle: l`Why should this user be reviewed?`,
        }
      }
      case 'status':
      case 'livestream': {
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
      case 'profileLink': {
        return {
          title: l`Report this link`,
          subtitle: l`Why should this link be reviewed?`,
        }
      }
      case 'article': {
        return {
          title: l`Report this article`,
          subtitle: l`Why should this article be reviewed?`,
        }
      }
      case 'photo': {
        return {
          title: l`Report this photo`,
          subtitle: l`Why should this photo be reviewed?`,
        }
      }
      case 'publication': {
        return {
          title: l`Report this publication`,
          subtitle: l`Why should this publication be reviewed?`,
        }
      }
      case 'gallery': {
        return {
          title: l`Report this gallery`,
          subtitle: l`Why should this gallery be reviewed?`,
        }
      }
      case 'record': {
        return {
          title: l`Report this record`,
          subtitle: l`Why should this record be reviewed?`,
        }
      }
      case 'starterPack': {
        return {
          title: l`Report this Starter Pack`,
          subtitle: l`Why should this Starter Pack be reviewed?`,
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
  }
}
