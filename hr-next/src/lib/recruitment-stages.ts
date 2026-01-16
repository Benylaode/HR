// Recruitment Stage Definitions and State Machine Logic

export const RecruitmentStages = {
  CV_SCREENING: 'CV Screening',
  AI_SCREENING: 'AI Screening',
  RANKING: 'Ranking',
  HR_REVIEW: 'HR Review',
  PSYCHOTEST: 'Psychotest',
  INTERVIEW_HR: 'Interview HR',
  INTERVIEW_USER: 'Interview User',
  FINAL_SELECTION: 'Final Selection',
  OFFERING: 'Offering',
  NEGOTIATION: 'Negotiation',
  OFFERING_ACCEPTED: 'Offering Accepted',
  OFFERING_DECLINED: 'Offering Declined',
  MCU_PROCESS: 'MCU Process',
  MCU_REVIEW: 'MCU Review',
  MCU_FAILED: 'MCU Failed',
  TICKET: 'Flight Ticket',
  ONBOARDING: 'Onboarding',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
} as const

export type RecruitmentStage = keyof typeof RecruitmentStages

// Allowed state transitions (matches backend state machine)
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  CV_SCREENING: ['AI_SCREENING', 'REJECTED'],
  AI_SCREENING: ['RANKING', 'HR_REVIEW', 'REJECTED'],
  RANKING: ['HR_REVIEW', 'PSYCHOTEST', 'REJECTED'],
  HR_REVIEW: ['PSYCHOTEST', 'REJECTED'],
  PSYCHOTEST: ['INTERVIEW_HR', 'REJECTED'],
  INTERVIEW_HR: ['INTERVIEW_USER', 'REJECTED'],
  INTERVIEW_USER: ['FINAL_SELECTION', 'OFFERING', 'REJECTED'],
  FINAL_SELECTION: ['OFFERING', 'REJECTED'],
  OFFERING: ['NEGOTIATION', 'OFFERING_ACCEPTED', 'OFFERING_DECLINED'],
  NEGOTIATION: ['OFFERING_ACCEPTED', 'OFFERING_DECLINED'],
  OFFERING_ACCEPTED: ['MCU_PROCESS'],
  MCU_PROCESS: ['MCU_REVIEW', 'MCU_FAILED'],
  MCU_REVIEW: ['TICKET', 'ONBOARDING', 'MCU_FAILED'],
  TICKET: ['ONBOARDING'],
  ONBOARDING: ['HIRED'],
}

// Terminal states (cannot move from these)
export const TERMINAL_STATES = ['HIRED', 'REJECTED', 'MCU_FAILED', 'OFFERING_DECLINED']

// Rejection stages that require notes
export const REJECTION_STAGES = ['REJECTED', 'MCU_FAILED', 'OFFERING_DECLINED']

/**
 * Get allowed next stages from current stage
 */
export function getAllowedNextStages(currentStage: string): string[] {
  return ALLOWED_TRANSITIONS[currentStage] || []
}

/**
 * Check if a stage transition is valid
 */
export function isValidTransition(currentStage: string | null, newStage: string): boolean {
  // First stage must be CV_SCREENING
  if (currentStage === null) {
    return newStage === 'CV_SCREENING'
  }
  
  // Same stage allowed (for notes update)
  if (currentStage === newStage) {
    return true
  }
  
  const allowedNext = ALLOWED_TRANSITIONS[currentStage] || []
  return allowedNext.includes(newStage)
}

/**
 * Check if stage is a rejection stage (requires notes)
 */
export function isRejectionStage(stage: string): boolean {
  return REJECTION_STAGES.includes(stage)
}

/**
 * Check if stage is terminal (cannot move from)
 */
export function isTerminalStage(stage: string): boolean {
  return TERMINAL_STATES.includes(stage)
}

/**
 * Get stage color for UI
 */
export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    HIRED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
    MCU_FAILED: 'bg-red-100 text-red-800 border-red-200',
    OFFERING_DECLINED: 'bg-orange-100 text-orange-800 border-orange-200',
    CV_SCREENING: 'bg-blue-100 text-blue-800 border-blue-200',
    OFFERING: 'bg-purple-100 text-purple-800 border-purple-200',
    ONBOARDING: 'bg-teal-100 text-teal-800 border-teal-200',
  }
  
  return colors[stage] || 'bg-slate-100 text-slate-800 border-slate-200'
}

/**
 * Get stage icon
 */
export function getStageIcon(stage: string): string {
  const icons: Record<string, string> = {
    CV_SCREENING: '📄',
    AI_SCREENING: '🤖',
    RANKING: '📊',
    HR_REVIEW: '👤',
    PSYCHOTEST: '🧠',
    INTERVIEW_HR: '💼',
    INTERVIEW_USER: '🗣️',
    FINAL_SELECTION: '⭐',
    OFFERING: '📝',
    NEGOTIATION: '🤝',
    OFFERING_ACCEPTED: '✅',
    OFFERING_DECLINED: '❌',
    MCU_PROCESS: '🏥',
    MCU_REVIEW: '📋',
    MCU_FAILED: '⚕️',
    TICKET: '✈️',
    ONBOARDING: '🎓',
    HIRED: '🎉',
    REJECTED: '❌',
  }
  
  return icons[stage] || '📍'
}

/**
 * Get progress percentage based on current stage
 */
export function getProgressPercentage(currentStage: string): number {
  const stageOrder = [
    'CV_SCREENING', 'AI_SCREENING', 'RANKING', 'HR_REVIEW', 'PSYCHOTEST',
    'INTERVIEW_HR', 'INTERVIEW_USER', 'FINAL_SELECTION', 'OFFERING',
    'NEGOTIATION', 'OFFERING_ACCEPTED', 'MCU_PROCESS', 'MCU_REVIEW',
    'TICKET', 'ONBOARDING', 'HIRED'
  ]
  
  const index = stageOrder.indexOf(currentStage)
  if (index === -1) return 0
  
  return Math.round((index / (stageOrder.length - 1)) * 100)
}
