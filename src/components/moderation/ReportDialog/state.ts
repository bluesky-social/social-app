import {type AppBskyLabelerDefs} from '@atproto/api'

import {OTHER_REPORT_REASONS} from '#/components/moderation/ReportDialog/const'
import {
  type ReportCategoryConfig,
  type ReportOption,
} from '#/components/moderation/ReportDialog/utils/useReportOptions'

export type ReportState = {
  selectedCategory?: ReportCategoryConfig
  selectedOption?: ReportOption
  selectedLabeler?: AppBskyLabelerDefs.LabelerViewDetailed
  details?: string
  detailsOpen: boolean
  activeStepIndex1: number
  error?: string
}

export type ReportAction =
  | {
      type: 'selectCategory'
      option: ReportCategoryConfig
      otherOption: ReportOption
    }
  | {
      type: 'clearCategory'
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
  selectedCategory: undefined,
  selectedOption: undefined,
  selectedLabeler: undefined,
  details: undefined,
  detailsOpen: false,
  activeStepIndex1: 1,
}

export function reducer(state: ReportState, action: ReportAction): ReportState {
  switch (action.type) {
    case 'selectCategory':
      return {
        ...state,
        selectedCategory: action.option,
        activeStepIndex1: action.option.key === 'other' ? 3 : 2,
        selectedOption:
          action.option.key === 'other' ? action.otherOption : undefined,
      }
    case 'clearCategory':
      return {
        ...state,
        selectedCategory: undefined,
        selectedOption: undefined,
        selectedLabeler: undefined,
        activeStepIndex1: 1,
        detailsOpen: false,
      }
    case 'selectOption':
      return {
        ...state,
        selectedOption: action.option,
        activeStepIndex1: 3,
        detailsOpen: OTHER_REPORT_REASONS.has(action.option.reason),
      }
    case 'clearOption':
      return {
        ...state,
        selectedOption: undefined,
        selectedLabeler: undefined,
        activeStepIndex1: 2,
        detailsOpen: false,
      }
    case 'selectLabeler':
      return {
        ...state,
        selectedLabeler: action.labeler,
        activeStepIndex1: 4,
        detailsOpen: state.selectedOption
          ? OTHER_REPORT_REASONS.has(state.selectedOption?.reason)
          : false,
      }
    case 'clearLabeler':
      return {
        ...state,
        selectedLabeler: undefined,
        activeStepIndex1: 3,
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
