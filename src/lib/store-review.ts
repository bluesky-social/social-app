import * as StoreReview from 'expo-store-review'
import * as persisted from '#/state/persisted'
import {AppState} from 'react-native'
import {isWeb} from '#/platform/detection'
import {logger} from '#/logger'

async function askForStoreReivew() {
  if (isWeb) return

  if (await StoreReview.hasAction()) {
    await StoreReview.requestReview()
  }
}

async function askForStoreReviewWithDelay() {
  if (isWeb) return

  const {lastPromptedAt, numSessions, numFollowed} =
    persisted.get('storeReview')
  const now = new Date()
  const oneWeek = 1000 * 60 * 60 * 24 * 7
  // don't prompt if we've already prompted in the last week
  if (lastPromptedAt && now.getTime() - lastPromptedAt.getTime() < oneWeek) {
    return
  }
  // prompt if user has had 100 sessions or followed 50 people
  if (numSessions >= 100 || numFollowed >= 50) {
    setTimeout(() => {
      askForStoreReivew().then(() => {
        persisted
          .write('storeReview', {
            completed: true,
            lastPromptedAt: now,
            numSessions: numSessions,
            numFollowed: numFollowed,
          })
          .catch(e => {
            logger.error('error writing store review', {error: String(e)})
          })
      })
    }, 5000) // delay asking for 5 seconds
    return
  }
}

export async function incrementStoreReviewFollowed() {
  if (isWeb) return

  const {numFollowed, ...others} = persisted.get('storeReview')
  await persisted.write('storeReview', {
    numFollowed: numFollowed + 1,
    ...others,
  })
  askForStoreReviewWithDelay()
}

export async function incrementStoreReviewSessions() {
  if (isWeb) return

  const {numSessions, ...others} = persisted.get('storeReview')
  await persisted.write('storeReview', {
    numSessions: numSessions + 1,
    ...others,
  })
  askForStoreReviewWithDelay()
}

export function listenSessionChangeForStoreReview() {
  // sets up AppState listener
  const l = AppState.addEventListener('change', () => {
    if (AppState.currentState === 'active') {
      incrementStoreReviewSessions()
    }
  })

  return () => {
    l.remove()
  }
}
