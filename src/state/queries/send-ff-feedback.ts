import {logger} from '#/logger'
import {useAgent} from '../session'

type FeedbackItem = {
  postUri: string
  feedback: 'yes' | 'no' | 'unknown'
}

export function useFeedbackFeed() {
  const agent = useAgent()

  const submitFeedback = async (feedback: FeedbackItem) => {
    const url = `${agent.pdsUrl}/xrpc/at.hailey.feedbackfeed.submitFeedback`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${agent.session?.accessJwt}`,
        'atproto-proxy': 'did:web:feedbackfeed.hailey.at#feedback_feed',
      },
      body: JSON.stringify({
        items: [feedback],
      }),
    })

    if (res.status !== 200) {
      logger.error(
        `received non-200 status code from feedback feed: ${res.status}`,
      )
    }
  }

  return {submitFeedback}
}
