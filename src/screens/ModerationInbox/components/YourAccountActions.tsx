import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {cleanError} from '#/lib/strings/errors'
import {useModerationInboxSubjectQuery} from '#/state/queries/moderation-inbox'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {type ActionedSubject} from './hooks/useActionedSubjectLabels'
import {YourAccountRow} from './YourAccountRow'

export function YourAccountActions({item}: {item: ActionedSubject}) {
  const {t: l} = useLingui()
  const did =
    'did' in item.subject && typeof item.subject.did === 'string'
      ? item.subject.did
      : undefined
  const history = useModerationInboxSubjectQuery({
    moderationService: item.src,
    subject: did,
    enabled: !!did,
  })

  if (!did) return <YourAccountRow item={item} unread={!item.isRead} />

  const pages = history.data?.pages
  return (
    <>
      {pages ? (
        pages.flatMap((page, pageIndex) =>
          page.actions.map(action => (
            <YourAccountRow
              key={action.id}
              item={item}
              action={action}
              actionCursor={
                typeof history.data?.pageParams[pageIndex] === 'string'
                  ? history.data.pageParams[pageIndex]
                  : undefined
              }
              unread={!item.isRead && action.id === item.latestAction?.id}
            />
          )),
        )
      ) : (
        <YourAccountRow item={item} unread={!item.isRead} />
      )}
      {history.isError ? (
        <ErrorMessage
          message={cleanError(history.error)}
          onPressTryAgain={() => void history.refetch()}
        />
      ) : null}
      {history.hasNextPage ? (
        <View style={[a.p_lg, a.align_start]}>
          <Button
            testID="moderationInboxOlderAccountActionsBtn"
            label={l`Load older account actions`}
            size="small"
            color="secondary"
            disabled={history.isFetchingNextPage}
            onPress={() => void history.fetchNextPage()}>
            <ButtonText>
              <Trans>Load older account actions</Trans>
            </ButtonText>
          </Button>
        </View>
      ) : null}
    </>
  )
}
