// src/lib/api/tracking.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

export interface JourneyLog {
  id: number
  previous_stage: string | null
  new_stage: string
  action: string
  notes: string
  actor_name: string
  timestamp: string
}

export interface JourneyTimeline {
  application_id: string
  candidate_name: string
  job_title: string
  current_stage: string
  metadata: Record<string, any>
  history: JourneyLog[]
}

export interface UpdateStageRequest {
  application_id: string
  new_stage: string
  notes: string
  actor_name: string
  manpower_id?: string
}

export interface UpdateStageResponse {
  message: string
  current_stage: string
  whatsapp_link: string | null
  timestamp: string
}

/**
 * Helper untuk mengambil Token dari LocalStorage.
 * Dibuat HANYA untuk mengatur Authorization (TIDAK mengatur Content-Type).
 */
const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("hr_token") : null;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Fetch candidate data to get application_id
 */
export async function getCandidateApplications(candidateId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, { 
    headers: {
      "Content-Type": "application/json", // ✅ Manual di sini untuk JSON
      ...getAuthHeaders()
    } 
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch candidate data')
  }
  
  return response.json()
}

/**
 * Fetch recruitment journey timeline using application_id
 */
export async function getJourneyTimeline(applicationId: string): Promise<JourneyTimeline> {
  const url = `${API_BASE_URL}/tracing/${applicationId}`
  
  const response = await fetch(url, { 
    headers: {
      "Content-Type": "application/json", // ✅ Manual di sini untuk JSON
      ...getAuthHeaders()
    } 
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch journey timeline')
  }
  
  return response.json()
}

/**
 * Update candidate's recruitment stage
 */
export async function updateStage(data: UpdateStageRequest): Promise<UpdateStageResponse> {
  const response = await fetch(`${API_BASE_URL}/tracing/update-stage`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json", // ✅ Manual di sini untuk JSON
      ...getAuthHeaders()
    },
    body: JSON.stringify(data),
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.error || result.message || 'Failed to update stage')
  }
  
  return result
}

/**
 * Upload document for candidate (Offering, Ticket, MCU)
 */
export async function uploadDocument(
  applicationId: string,
  docType: 'offering' | 'ticket' | 'mcu',
  file: File,
  notes?: string
): Promise<{ message: string; url: string; whatsapp_link: string | null; data: any }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('application_id', applicationId)
  formData.append('doc_type', docType)
  
  if (notes) {
    formData.append('notes', notes)
  }
  
  const response = await fetch(`${API_BASE_URL}/tracing/upload-doc`, {
    method: 'POST',
    // 🚨 PENTING: JANGAN pasang "Content-Type": "application/json" di sini. 
    // Biarkan browser yang mengatur Content-Type menjadi multipart/form-data.
    headers: getAuthHeaders(),
    body: formData,
  })
  
  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.error || 'Failed to upload document')
  }
  
  return result
}