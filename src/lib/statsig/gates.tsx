import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export type Gate =
  // Keep this alphabetic please.
  | 'debug_show_feedcontext'
  | 'debug_subscriptions'
  | 'old_postonboarding'
  | 'onboarding_add_video_feed'
  | 'remove_show_latest_button'
  | 'test_gate_1'
  | 'test_gate_2'

export interface GateDescription {
  title: string
  description: string
  help?: string[]
}

export type GateDescriptions = Record<Gate, GateDescription | undefined>

export function useGateDescriptions(): GateDescriptions {
  const {_} = useLingui()
  return {
    debug_show_feedcontext: undefined,
    debug_subscriptions: undefined,
    old_postonboarding: undefined,
    onboarding_add_video_feed: undefined,
    remove_show_latest_button: undefined,
    test_gate_1: {
      title: _(msg`Test Gate 1`),
      description: _(
        msg`A test gate which should be removed before we launch this.`,
      ),
    },
    test_gate_2: {
      title: _(msg`Test Gate 2`),
      description: _(
        msg`A test gate which should be removed before we launch this.`,
      ),
      help: [
        _(
          msg`This is a lengthier description of the feature which instructs the user on how to use it.`,
        ),
        _(
          msg`Each line is interpretted as a separate paragraph. We might also need to introduce a way to put images in here, but let's not get ahead of ourselves.`,
        ),
      ],
    },
  }
}
