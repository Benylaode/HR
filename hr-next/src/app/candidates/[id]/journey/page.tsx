'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import JourneyTimeline from '@/components/recruitment/JourneyTimeline'
import { 
  Loader2, ChevronLeft, Upload, Download, Send, User as UserIcon,
  Briefcase, TrendingUp
} from 'lucide-react'
import { 
  getJourneyTimeline, updateStage, uploadDocument, getCandidateApplications,
  type JourneyTimeline as JourneyData
} from '@/lib/api/tracking'
import { 
  getAllowedNextStages, isRejectionStage, isTerminalStage,
  getProgressPercentage, getStageColor, RecruitmentStages
} from '@/lib/recruitment-stages'

export default function CandidateJourneyPage() {
  const params = useParams()
  const router = useRouter()
  const candidateId = params.id as string
  
  const [journey, setJourney] = useState<JourneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Stage update form
  const [selectedStage, setSelectedStage] = useState('')
  const [notes, setNotes] = useState('')
  const [actorName, setActorName] = useState('HR Admin')
  
  // Document upload form
  const [docType, setDocType] = useState<'offering' | 'ticket' | 'mcu'>('offering')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [uploadNotes, setUploadNotes] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)
  
  // WhatsApp link
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null)
  
  useEffect(() => {
    fetchJourney()
  }, [candidateId])

    const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("hr_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
  
  const fetchJourney = async () => {
    try {
      // Step 1: Fetch candidate to get application_id
      const candidateData = await getCandidateApplications(candidateId)
      console.log('Candidate data:', candidateData)
      
      // Check if candidate has any job applications
      if (!candidateData.applications || candidateData.applications.length === 0) {
        console.log('No applications found')
        setJourney(null)
        return
      }
      
      // Step 2: Use first application to fetch journey
      const applicationId = candidateData.applications[0].id
      console.log('Using application_id:', applicationId)
      
      const data = await getJourneyTimeline(applicationId)
      console.log('Journey data:', data)
      setJourney(data)
    } catch (error: any) {
      console.error('Error fetching journey:', error)
      
      // If no application found, show friendly UI instead of alert
      setJourney(null)
    } finally {
      setLoading(false)
    }
  }
  
  const handleStageUpdate = async () => {
    if (!journey || !selectedStage) {
      alert('⚠️ Please select a stage')
      return
    }
    
    if (isRejectionStage(selectedStage) && !notes.trim()) {
      alert('⚠️ Notes/reason is required for rejection stages')
      return
    }
    
    setActionLoading(true)
    try {
      // Get application ID from journey metadata or need to fetch it
      if (!journey?.application_id) {
        alert('⚠️ Cannot find application ID')
        return
      }
      
      const result = await updateStage({
        application_id: journey.application_id,
        new_stage: selectedStage,
        notes: notes.trim(),
        actor_name: actorName
      })
      
      alert(`✅ ${result.message}`)
      
      if (result.whatsapp_link) {
        setWhatsappLink(result.whatsapp_link)
      }
      
      // Reset form
      setSelectedStage('')
      setNotes('')
      
      // Refresh journey
      await fetchJourney()
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setActionLoading(false)
    }
  }
  
  const handleDocumentUpload = async () => {
    if (!docFile) {
      alert('⚠️ Please select a file')
      return
    }
    
    setUploadLoading(true)
    try {
      if (!journey?.application_id) {
        alert('⚠️ Cannot find application ID')
        return
      }
      
      const result = await uploadDocument(journey.application_id, docType, docFile, uploadNotes)
      
      alert(`✅ ${result.message}`)
      
      if (result.whatsapp_link) {
        setWhatsappLink(result.whatsapp_link)
      }
      
      // Reset form
      setDocFile(null)
      setUploadNotes('')
      
      // Refresh journey
      await fetchJourney()
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setUploadLoading(false)
    }
  }
  
  const copyWhatsAppLink = () => {
    if (whatsappLink) {
      navigator.clipboard.writeText(whatsappLink)
      alert('✅ WhatsApp link copied to clipboard!')
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar />
        <div className="lg:ml-64 min-h-screen flex flex-col">
          <Header title="Journey Loading..." subtitle="" />
          <main className="flex-1 flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-[var(--primary)]" size={48} />
          </main>
          <Footer />
        </div>
      </div>
    )
  }
  
  if (!journey) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar />
        <div className="lg:ml-64 min-h-screen flex flex-col">
          <Header title="Journey Not Available" subtitle="" />
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="text-orange-600" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No Recruitment Journey Yet</h2>
              <p className="text-slate-600 mb-6">
                Kandidat ini belum memiliki <strong>job application</strong> aktif. 
                Recruitment journey hanya tersedia setelah kandidat di-assign ke job position.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-bold text-blue-900 mb-2">📋 Langkah selanjutnya:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Buka halaman Candidates</li>
                  <li>Assign kandidat ke job position yang sesuai</li>
                  <li>Journey tracking akan otomatis tersedia</li>
                </ol>
              </div>
              
              <button 
                onClick={() => router.push('/candidates')} 
                className="mt-4 px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-700)] font-semibold shadow-md transition-all"
              >
                Back to Candidates
              </button>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    )
  }
  
  const allowedNext = getAllowedNextStages(journey.current_stage)
  const isTerminal = isTerminalStage(journey.current_stage)
  const progress = getProgressPercentage(journey.current_stage)
  
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header 
          title="Recruitment Journey"
          subtitle={`${journey.candidate_name} - ${journey.job_title}`}
        />
        
        <main className="p-4 md:p-8 flex-1">
          {/* Back Button */}
          <button
            onClick={() => router.push('/candidates')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-medium"
          >
            <ChevronLeft size={20} />
            Back to Candidates
          </button>
          
          {/* Candidate Header */}
          <div className="card-static bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-2xl font-bold">
                {journey.candidate_name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900">{journey.candidate_name}</h2>
                <p className="text-slate-600 flex items-center gap-2">
                  <Briefcase size={16} />
                  {journey.job_title}
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-slate-700">Overall Progress</span>
                <span className="text-sm font-bold text-[var(--primary)]">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-[var(--primary)] to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            {/* Current Stage Badge */}
            <div className="mt-4">
              <span className={`inline-block px-4 py-2 rounded-lg font-bold text-sm border-2 ${getStageColor(journey.current_stage)}`}>
                Current: {RecruitmentStages[journey.current_stage as keyof typeof RecruitmentStages]}
              </span>
            </div>
          </div>
          
          {/* Modern Horizontal Layout - Timeline + Actions */}
          <div className="flex gap-6">
            {/* Main Timeline - 60% width */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="text-white" size={22} />
                    </div>
                    Journey Timeline
                  </h2>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">Current Stage</p>
                    <p className="text-sm font-bold text-teal-600">
                      {RecruitmentStages[journey.current_stage as keyof typeof RecruitmentStages]}
                    </p>
                  </div>
                </div>
                
                <JourneyTimeline 
                  currentStage={journey.current_stage}
                  history={journey.history}
                />
              </div>
            </div>
            
            {/* Compact Actions Panel - 40% width */}
            <div className="w-96 space-y-4 flex-shrink-0">
              {/* Stage Update Card */}
              {!isTerminal && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border-2 border-blue-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Next Stage</h3>
                      <p className="text-xs text-slate-600">Move candidate forward</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Select Stage</label>
                      <select
                        value={selectedStage}
                        onChange={(e) => setSelectedStage(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 font-medium text-sm"
                      >
                        <option value="">Choose stage...</option>
                        {allowedNext.map(stage => (
                          <option key={stage} value={stage}>
                            {RecruitmentStages[stage as keyof typeof RecruitmentStages]}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                        Notes {isRejectionStage(selectedStage) && <span className="text-red-500">*</span>}
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm resize-none"
                        placeholder={isRejectionStage(selectedStage) ? 'Reason required for rejection' : 'Optional notes...'}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Actor</label>
                      <input
                        type="text"
                        value={actorName}
                        onChange={(e) => setActorName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                        placeholder="e.g. Sarah (HR)"
                      />
                    </div>
                    
                    <button
                      onClick={handleStageUpdate}
                      disabled={actionLoading || !selectedStage}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl py-3.5 font-bold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                    >
                      {actionLoading && <Loader2 className="animate-spin" size={18} />}
                      {actionLoading ? 'Updating...' : 'Update Stage'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Document Upload Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Upload size={16} className="text-orange-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Upload Document</h3>
                </div>
                
                <div className="space-y-3">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="offering">Offering Letter</option>
                    <option value="ticket">Flight Ticket</option>
                    <option value="mcu">MCU Results</option>
                  </select>
                  
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  {docFile && (
                    <p className="text-xs text-slate-600 truncate">📎 {docFile.name}</p>
                  )}
                  
                  <input
                    type="text"
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    placeholder="Optional notes..."
                  />
                  
                  <button
                    onClick={handleDocumentUpload}
                    disabled={uploadLoading || !docFile}
                    className="w-full bg-orange-500 text-white rounded-lg py-2.5 font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {uploadLoading && <Loader2 className="animate-spin" size={16} />}
                    <Upload size={16} />
                    {uploadLoading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
                
                {/* Uploaded Docs */}
                {journey.metadata && Object.keys(journey.metadata).some(k => k.endsWith('_url')) && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                    <p className="text-xs font-bold text-slate-700">Uploaded:</p>
                    {Object.entries(journey.metadata).filter(([k]) => k.endsWith('_url')).map(([key, url]) => (
                      <a
                        key={key}
                        href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Download size={12} />
                        {key.replace('_url', '').toUpperCase()}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              
              {/* WhatsApp Card */}
              {whatsappLink && (
                <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Send size={16} className="text-green-700" />
                    <h4 className="font-bold text-green-900 text-sm">WhatsApp Ready</h4>
                  </div>
                  <button
                    onClick={copyWhatsAppLink}
                    className="w-full bg-green-600 text-white rounded-lg py-2 font-semibold hover:bg-green-700 text-sm mb-2"
                  >
                    Copy Link
                  </button>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-white text-green-600 border-2 border-green-600 rounded-lg py-2 font-semibold hover:bg-green-50 text-sm text-center"
                  >
                    Open WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}
