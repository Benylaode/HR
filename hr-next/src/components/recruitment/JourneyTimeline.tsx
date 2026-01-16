'use client'

import { memo } from 'react'
import { Check, Clock, Circle } from 'lucide-react'
import { RecruitmentStages } from '@/lib/recruitment-stages'
import type { JourneyLog } from '@/lib/api/tracking'

interface JourneyTimelineProps {
  currentStage: string
  history: JourneyLog[]
}

const RECRUITMENT_FLOW = [
  'CV_SCREENING', 'AI_SCREENING', 'RANKING', 'HR_REVIEW', 'PSYCHOTEST',
  'INTERVIEW_HR', 'INTERVIEW_USER', 'FINAL_SELECTION', 'OFFERING',
  'NEGOTIATION', 'OFFERING_ACCEPTED', 'MCU_PROCESS', 'MCU_REVIEW',
  'TICKET', 'ONBOARDING', 'HIRED'
]

const REJECTION_STAGES = ['REJECTED', 'MCU_FAILED', 'OFFERING_DECLINED']

// Map backend stage values to enum keys
const STAGE_VALUE_TO_KEY: Record<string, string> = {
  'CV Screening': 'CV_SCREENING',
  'AI Screening': 'AI_SCREENING',
  'Ranking': 'RANKING',
  'HR Review': 'HR_REVIEW',
  'Psychotest': 'PSYCHOTEST',
  'Interview HR': 'INTERVIEW_HR',
  'Interview User': 'INTERVIEW_USER',
  'Final Selection': 'FINAL_SELECTION',
  'Offering': 'OFFERING',
  'Negotiation': 'NEGOTIATION',
  'Offer Accepted': 'OFFERING_ACCEPTED',
  'Medical Check Up': 'MCU_PROCESS',
  'SCM Clinic Team Review': 'MCU_REVIEW',
  'MCU Failed': 'MCU_FAILED',
  'Flight Ticket': 'TICKET',
  'Onboarding': 'ONBOARDING',
  'Hired': 'HIRED',
  'Rejected': 'REJECTED',
  'Offering Declined': 'OFFERING_DECLINED'
}

export default memo(function JourneyTimeline({ currentStage, history }: JourneyTimelineProps) {
  // Normalize current stage to enum key
  const normalizedCurrentStage = STAGE_VALUE_TO_KEY[currentStage] || currentStage
  
  const completedStages = new Set(history.map(log => STAGE_VALUE_TO_KEY[log.new_stage] || log.new_stage))
  const currentStageIndex = RECRUITMENT_FLOW.findIndex(s => s === normalizedCurrentStage)
  
  const rejectionLogs = history.filter(log => REJECTION_STAGES.includes(log.new_stage))
  const isRejected = rejectionLogs.length > 0
  
  const getStageStatus = (stageKey: string, index: number) => {
    if (stageKey === normalizedCurrentStage) return 'current'
    if (index < currentStageIndex) return 'completed'
    if (completedStages.has(stageKey)) return 'completed'
    return 'pending'
  }
  
  return (
    <div className="space-y-1">
      {/* Modern Minimalist Timeline */}
      {RECRUITMENT_FLOW.map((stageKey, index) => {
        const status = getStageStatus(stageKey, index)
        const logEntry = history.find(log => (STAGE_VALUE_TO_KEY[log.new_stage] || log.new_stage) === stageKey)
        const isActive = stageKey === normalizedCurrentStage
        const isCompleted = status === 'completed'
        const isPending = status === 'pending'
        
        return (
          <div 
            key={stageKey} 
            className={`relative flex items-start gap-4 py-3 px-4 rounded-xl transition-all duration-300 ${
              isActive ? 'bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md scale-[1.02]' : 
              isCompleted ? 'hover:bg-slate-50' :
              ''
            }`}
          >
            {/* Vertical Line */}
            {index < RECRUITMENT_FLOW.length - 1 && (
              <div 
                className={`absolute left-[27px] top-[50px] w-0.5 h-8 transition-all duration-500 ${
                  isCompleted ? 'bg-gradient-to-b from-teal-400 to-teal-500' : 'bg-gray-200'
                }`}
              />
            )}
            
            {/* Status Indicator */}
            <div className="relative z-10 flex-shrink-0 mt-0.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                isCompleted
                  ? 'bg-gradient-to-br from-teal-400 to-teal-600 shadow-teal-200'
                  : isActive
                  ? 'bg-white border-2 border-blue-500 ring-4 ring-blue-100 shadow-blue-200'
                  : 'bg-gray-100 border border-gray-200'
              }`}>
                {isCompleted && <Check size={16} className="text-white" strokeWidth={3} />}
                {isActive && (
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping absolute" />
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  </div>
                )}
                {isPending && <Circle size={12} className="text-gray-300" strokeWidth={2} />}
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <h3 className={`font-bold text-sm transition-all duration-300 ${
                  isActive 
                    ? 'text-blue-600' 
                    : isCompleted 
                    ? 'text-slate-800' 
                    : 'text-slate-400'
                }`}>
                  {RecruitmentStages[stageKey as keyof typeof RecruitmentStages]}
                </h3>
                
                {isActive && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-sm">
                    <Clock size={12} />
                    Active
                  </span>
                )}
                
                {isCompleted && !isActive && (
                  <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                    ✓ Done
                  </span>
                )}
              </div>
              
              {/* Log Details */}
              {logEntry && (
                <div className="space-y-1.5">
                  {logEntry.notes && (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {logEntry.notes}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500 font-medium">{logEntry.actor_name || 'System'}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-slate-400">
                      {new Date(logEntry.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
      
      {/*Rejection Alert */}
      {isRejected && (
        <div className="mt-6 p-5 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-lg font-bold">✕</span>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-red-900 mb-1">Application Rejected</h4>
              {rejectionLogs.map((log, idx) => (
                <div key={idx} className="mt-3 space-y-1.5">
                  <p className="text-sm font-semibold text-red-800">
                    {RecruitmentStages[log.new_stage as keyof typeof RecruitmentStages]}
                  </p>
                  {log.notes && (
                    <p className="text-xs text-red-700 italic leading-relaxed">"{log.notes}"</p>
                  )}
                  <p className="text-xs text-red-600">
                    {log.actor_name} • {new Date(log.timestamp).toLocaleDateString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
