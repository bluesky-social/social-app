import {type AppBskyLabelerDefs, ComAtprotoModerationDefs} from '@atproto/api'

import {TopLevelReportOption, type ReportOption} from './utils/useReportOptions'

export type ReportState = {
  selectedTopLevelOption?: TopLevelReportOption
  selectedOption?: ReportOption
  selectedLabeler?: AppBskyLabelerDefs.LabelerViewDetailed
  details?: string
  detailsOpen: boolean
  activeStepIndex1: number
  error?: string
}

export type ReportAction =
  | {
      type: 'selectTopLevelOption'
      option: TopLevelReportOption
    }
  | {
      type: 'clearTopLevelOption'
    }
  | {
      type: 'selectOption'
      option: ReportOption
    }
  | {
      type: 'clearOption'
    }
  | {
      type: 'selectLabeler'
      labeler: AppBskyLabelerDefs.LabelerViewDetailed
    }
  | {
      type: 'clearLabeler'
    }
  | {
      type: 'setDetails'
      details: string
    }
  | {
      type: 'setError'
      error: string
    }
  | {
      type: 'clearError'
    }
  | {
      type: 'showDetails'
    }

export const initialState: ReportState = {
  selectedTopLevelOption: undefined,
  selectedOption: undefined,
  selectedLabeler: undefined,
  details: undefined,
  detailsOpen: false,
  activeStepIndex1: 1,
}

export function reducer(state: ReportState, action: ReportAction): ReportState {
  switch (action.type) {
    case 'selectTopLevelOption':
      return {
        ...state,
        selectedTopLevelOption: action.option,
        activeStepIndex1: 2,
        detailsOpen: !!state.details,
      }
    case 'clearTopLevelOption':
      return {
        ...state,
        selectedTopLevelOption: undefined,
        selectedOption: undefined,
        selectedLabeler: undefined,
        activeStepIndex1: 1,
        detailsOpen:
          !!state.details ||
          state.selectedOption?.reason === ComAtprotoModerationDefs.REASONOTHER,
      }
    case 'selectOption':
      return {
        ...state,
        selectedOption: action.option,
        activeStepIndex1: 3,
        detailsOpen:
          !!state.details ||
          action.option.reason === ComAtprotoModerationDefs.REASONOTHER,
      }
    case 'clearOption':
      return {
        ...state,
        selectedOption: undefined,
        selectedLabeler: undefined,
        activeStepIndex1: 2,
        detailsOpen:
          !!state.details ||
          state.selectedOption?.reason === ComAtprotoModerationDefs.REASONOTHER,
      }
    case 'selectLabeler':
      return {
        ...state,
        selectedLabeler: action.labeler,
        activeStepIndex1: 4,
      }
    case 'clearLabeler':
      return {
        ...state,
        selectedLabeler: undefined,
        activeStepIndex1: 3,
        detailsOpen:
          !!state.details ||
          state.selectedOption?.reason === ComAtprotoModerationDefs.REASONOTHER,
      }
    case 'setDetails':
      return {
        ...state,
        details: action.details,
      }
    case 'setError':
      return {
        ...state,
        error: action.error,
      }
    case 'clearError':
      return {
        ...state,
        error: undefined,
      }
    case 'showDetails':
      return {
        ...state,
        detailsOpen: true,
      }
  }
}
