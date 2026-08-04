import {
  type AppBskyLabelerDefs,
  ToolsOzoneReportDefs as OzoneReportDefs,
} from '@atproto/api'

import {OTHER_REPORT_REASONS} from '#/components/moderation/ReportDialog/const'
import {
  type ReportCategoryConfig,
  type ReportOption,
} from '#/components/moderation/ReportDialog/utils/useReportOptions'

export type NciiQualification = {
  isDepicted?: boolean
}

export type ReportState = {
  selectedCategory?: ReportCategoryConfig
  selectedOption?: ReportOption
  selectedLabeler?: AppBskyLabelerDefs.LabelerViewDetailed
  details?: string
  detailsOpen: boolean
  activeStepIndex1: number
  error?: string
  /**
   * Present while the selected reason is NCII. Tracks the answer to the
   * qualifying question that determines whether the report should go through
   * the external NCII report form instead of in-app submission.
   */
  ncii?: NciiQualification
}

/**
 * Resolves the NCII qualifying question into an outcome. The depicted person
 * (or their authorized representative) is directed to the external NCII
 * report form; everyone else proceeds with the normal in-app submission.
 */
export function getNciiQualificationOutcome(
  ncii?: NciiQualification,
): 'pending' | 'externalForm' | 'inApp' | undefined {
  if (!ncii) return undefined
  if (ncii.isDepicted === true) return 'externalForm'
  if (ncii.isDepicted === false) return 'inApp'
  return 'pending'
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
      type: 'answerNciiQuestion'
      question: keyof NciiQualification
      answer: boolean
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
        ncii: undefined,
      }
    case 'selectOption': {
      const isNcii = action.option.reason === OzoneReportDefs.REASONSEXUALNCII
      return {
        ...state,
        selectedOption: action.option,
        // NCII reports require answering qualifying questions before moving on
        activeStepIndex1: isNcii ? 2 : 3,
        detailsOpen: OTHER_REPORT_REASONS.has(action.option.reason),
        ncii: isNcii ? {} : undefined,
      }
    }
    case 'clearOption':
      return {
        ...state,
        selectedOption: undefined,
        selectedLabeler: undefined,
        activeStepIndex1: 2,
        detailsOpen: false,
        ncii: undefined,
      }
    case 'answerNciiQuestion': {
      const ncii = {...state.ncii, [action.question]: action.answer}
      return {
        ...state,
        ncii,
        activeStepIndex1:
          getNciiQualificationOutcome(ncii) === 'inApp'
            ? state.selectedLabeler
              ? 4
              : 3
            : 2,
      }
    }
    case 'selectLabeler':
      return {
        ...state,
        selectedLabeler: action.labeler,
        /*
         * Labelers may be auto-selected (e.g. chat reports only go to
         * Bluesky), so don't advance past pending NCII qualifying questions.
         */
        activeStepIndex1:
          getNciiQualificationOutcome(state.ncii) === 'inApp' || !state.ncii
            ? 4
            : 2,
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
