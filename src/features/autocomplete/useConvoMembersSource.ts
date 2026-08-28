import {useConvo} from '#/state/messages/convo'
import {useSession} from '#/state/session'
import {type LocalSource} from '#/components/Autocomplete/types'

/**
 * Members of the active conversation as an autocomplete LocalSource, so the
 * mention typeahead in a chat prioritizes the people in it. Must be used
 * within a ConvoProvider.
 */
export function useConvoMembersSource(): LocalSource {
  const convo = useConvo()
  const {currentAccount} = useSession()
  const members = convo.convo?.members ?? []

  return {
    key: 'convo-members',
    items: members
      .filter(member => member.did !== currentAccount?.did)
      .map(member => ({
        key: member.did,
        type: 'profile' as const,
        value: '@' + member.handle,
        profile: member,
      })),
  }
}
