"use client";

import { useEffect, useState, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TestReportPDF from '@/components/test/TestReportPDF';
import { healAllSubmissions } from "@/utils/kraepelinHealer";
import CandidateFinalReport from '@/components/recruitment/CandidateFinalReport';
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Download,
  Mail, 
  Phone, 
  Eye, 
  Edit, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Briefcase,
  Filter,
  X,
  MapPin,
  Save,
  GraduationCap,
  User,
  Award,       
  Activity,    
  BrainCircuit,
  PieChart,    
  FileText,
  ClipboardList,
  CreditCard,
  Zap,
  Shield
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

interface Karyawan {
  id: string;
  nik_ktp?: string; // Menyimpan Nomor Karyawan
  fullName: string;
  email: string;
  whatsapp: string;
  positionApplied: string;
  employee_status: string;
  test_status: string;
  created_at: string;
}

interface KaryawanDetail extends Karyawan {
  gender?: string;
  religion?: string;
  birthPlace?: string;
  birthDate?: string;
  driverLicense?: string;
  address?: string;
  city?: string;
  province?: string;
  education?: string;
  university?: string;
  major?: string;
  gpa?: string;
  socialMedia?: string;
  lastCompany?: string;
  lastPosition?: string;
  lastPositionLevel?: string;
  lastCompanyField?: string;
  totalExperience?: string;
  experienceDescription?: string;
}

const DetailModal = memo(({ 
  karyawan, 
  onClose 
}: { 
  karyawan: KaryawanDetail | null; 
  onClose: () => void;
}) => {
  if (!karyawan) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-700 border-green-200";
      case "Pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Resigned": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-xl border border-[var(--secondary-100)] flex flex-col transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-lg font-bold text-[var(--primary)]">
              {(karyawan.fullName || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-[var(--primary-900)]">{karyawan.fullName || "Nama Tidak Ada"}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(karyawan.employee_status || "Pending")}`}>
                  {karyawan.employee_status || "Pending"}
                </span>
              </div>
              <p className="text-sm text-[var(--secondary)]">{karyawan.positionApplied || "Posisi Belum Ditentukan"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--secondary-100)] rounded-full transition-colors">
            <X size={20} className="text-[var(--secondary-400)]" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 space-y-6">
          <div className="bg-white p-4 rounded-xl border border-[var(--secondary-200)] shadow-sm">
            <h3 className="text-sm font-bold text-[var(--primary)] mb-4 border-b pb-2 flex items-center gap-2">
              <User size={16} /> Kontak Utama
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-[var(--secondary-400)]" />
                <span className="text-[var(--primary-900)] font-medium">{karyawan.email || "-"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-[var(--secondary-400)]" />
                <span className="text-[var(--primary-900)] font-medium">{karyawan.whatsapp || "-"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[var(--secondary-200)] shadow-sm">
            <h3 className="text-sm font-bold text-[var(--primary)] mb-4 border-b pb-2 flex items-center gap-2">
              <MapPin size={16} /> Data Pribadi & Alamat
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
              <div className="col-span-2 md:col-span-3">
                <p className="text-xs text-[var(--secondary-500)] mb-1">Nomor Karyawan</p>
                <p className="font-semibold text-[var(--primary-900)] flex items-center gap-2">
                  <CreditCard size={14} className="text-[var(--primary)]" />
                  {karyawan.nik_ktp || "-"}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-[var(--secondary-500)] mb-1">Jenis Kelamin</p>
                <p className="font-semibold text-[var(--primary-900)]">{karyawan.gender || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--secondary-500)] mb-1">Agama</p>
                <p className="font-semibold text-[var(--primary-900)]">{karyawan.religion || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--secondary-500)] mb-1">SIM</p>
                <p className="font-semibold text-[var(--primary-900)]">{karyawan.driverLicense || "-"}</p>
              </div>
              <div className="col-span-2 md:col-span-3">
                <p className="text-xs text-[var(--secondary-500)] mb-1">Tempat, Tanggal Lahir</p>
                <p className="font-semibold text-[var(--primary-900)]">
                  {karyawan.birthPlace || "-"}, {karyawan.birthDate ? new Date(karyawan.birthDate).toLocaleDateString('id-ID') : "-"}
                </p>
              </div>
              <div className="col-span-2 md:col-span-3">
                <p className="text-xs text-[var(--secondary-500)] mb-1">Alamat Lengkap</p>
                <p className="font-semibold text-[var(--primary-900)]">{karyawan.address || "-"}</p>
                <p className="text-xs text-[var(--secondary-600)] mt-0.5">
                  {karyawan.city ? `${karyawan.city}, ` : ""}{karyawan.province || ""}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[var(--secondary-200)] shadow-sm">
            <h3 className="text-sm font-bold text-[var(--primary)] mb-4 border-b pb-2 flex items-center gap-2">
              <GraduationCap size={16} /> Pendidikan Terakhir
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="col-span-2 md:col-span-2">
                <p className="text-xs text-[var(--secondary-500)] mb-1">Institusi / Universitas</p>
                <p className="font-semibold text-[var(--primary-900)]">{karyawan.university || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--secondary-500)] mb-1">Jenjang & Jurusan</p>
                <p className="font-semibold text-[var(--primary-900)]">{karyawan.education || "-"} {karyawan.major ? `- ${karyawan.major}` : ""}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--secondary-500)] mb-1">IPK</p>
                <p className="font-semibold text-[var(--primary-900)]">{karyawan.gpa || "-"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[var(--secondary-200)] shadow-sm">
            <h3 className="text-sm font-bold text-[var(--primary)] mb-4 border-b pb-2 flex items-center gap-2">
              <Briefcase size={16} /> Pengalaman Kerja Terakhir
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-[var(--secondary-500)] mb-1">Perusahaan Terakhir</p>
                <p className="font-semibold text-[var(--primary-900)]">{karyawan.lastCompany || "-"}</p>
                <p className="text-xs text-[var(--secondary-600)] mt-0.5">{karyawan.lastCompanyField || ""}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--secondary-500)] mb-1">Jabatan & Level</p>
                <p className="font-semibold text-[var(--primary-900)]">{karyawan.lastPosition || "-"}</p>
                <p className="text-xs text-[var(--secondary-600)] mt-0.5">{karyawan.lastPositionLevel || ""}</p>
              </div>
              <div className="col-span-1 md:col-span-2 border-t border-gray-100 pt-3 mt-1">
                <p className="text-xs text-[var(--secondary-500)] mb-1">Total Pengalaman: <span className="font-semibold text-[var(--primary-900)]">{karyawan.totalExperience || "-"}</span></p>
                <p className="text-sm text-[var(--secondary-700)] mt-2 italic whitespace-pre-wrap">
                  {karyawan.experienceDescription ? `"${karyawan.experienceDescription}"` : "Tidak ada deskripsi pengalaman."}
                </p>
              </div>
            </div>
          </div>

        </div>

        <div className="px-6 py-4 border-t border-[var(--secondary-100)] flex justify-end bg-[var(--background)] flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-[var(--secondary-600)] hover:text-[var(--primary-700)] hover:bg-[var(--secondary-100)] rounded-lg transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
});
DetailModal.displayName = 'DetailModal';

const EditModal = memo(({ 
  karyawan, 
  onClose,
  onSave 
}: { 
  karyawan: KaryawanDetail | null; 
  onClose: () => void;
  onSave: (data: Partial<KaryawanDetail>) => Promise<void>;
}) => {
  const [formData, setFormData] = useState({
    nik_ktp: "", 
    fullName: "", email: "", whatsapp: "", positionApplied: "", employee_status: "",
    gender: "", religion: "", birthPlace: "", birthDate: "", driverLicense: "",
    address: "", city: "", province: "",
    education: "", university: "", major: "", gpa: "", socialMedia: "",
    lastCompany: "", lastPosition: "", lastPositionLevel: "", lastCompanyField: "", totalExperience: "", experienceDescription: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (karyawan) {
      setFormData({
        nik_ktp: karyawan.nik_ktp || "", 
        fullName: karyawan.fullName || "",
        email: karyawan.email || "",
        whatsapp: karyawan.whatsapp || "",
        positionApplied: karyawan.positionApplied || "",
        employee_status: karyawan.employee_status || "Pending",
        gender: karyawan.gender || "",
        religion: karyawan.religion || "",
        birthPlace: karyawan.birthPlace || "",
        birthDate: karyawan.birthDate ? karyawan.birthDate.split('T')[0] : "",
        driverLicense: karyawan.driverLicense || "",
        address: karyawan.address || "",
        city: karyawan.city || "",
        province: karyawan.province || "",
        education: karyawan.education || "",
        university: karyawan.university || "",
        major: karyawan.major || "",
        gpa: karyawan.gpa || "",
        socialMedia: karyawan.socialMedia ? (typeof karyawan.socialMedia === 'string' ? karyawan.socialMedia : JSON.stringify(karyawan.socialMedia)) : "",
        lastCompany: karyawan.lastCompany || "",
        lastPosition: karyawan.lastPosition || "",
        lastPositionLevel: karyawan.lastPositionLevel || "",
        lastCompanyField: karyawan.lastCompanyField || "",
        totalExperience: karyawan.totalExperience || "",
        experienceDescription: karyawan.experienceDescription || ""
      });
    }
  }, [karyawan]);

  if (!karyawan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi Regex Khusus Karyawan: Harus Kombinasi Huruf dan Angka
    const hasLetterAndNumber = /^(?=.*[a-zA-Z])(?=.*\d)/.test(formData.nik_ktp);
    if (!hasLetterAndNumber) {
      return toast.error("Gagal: Nomor Karyawan wajib berupa kombinasi huruf dan angka!");
    }

    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const inputClass = "w-full px-3 py-2.5 bg-white border border-[var(--secondary-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none transition-colors text-[var(--primary-900)]";
  const labelClass = "text-xs font-semibold text-[var(--secondary-500)] uppercase tracking-wide mb-1.5 block";
  const sectionTitleClass = "text-sm font-bold text-[var(--primary)] border-b border-[var(--secondary-100)] pb-2 mb-4 mt-6";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl border border-[var(--secondary-100)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary-50)] flex items-center justify-center">
              <Edit size={18} className="text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--primary-900)]">Edit Detail Karyawan</h2>
              <p className="text-xs text-[var(--secondary)]">{karyawan.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--secondary-100)] rounded-full transition-colors">
            <X size={20} className="text-[var(--secondary-400)]" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
          <form id="editEmployeeForm" onSubmit={handleSubmit} className="space-y-2">
            
            <h3 className="text-sm font-bold text-[var(--primary)] border-b border-[var(--secondary-100)] pb-2 mb-4 mt-0">Info Utama & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className={labelClass}>Status Karyawan</label>
                <select value={formData.employee_status} onChange={(e) => setFormData({ ...formData, employee_status: e.target.value })} className={inputClass}>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Resigned">Resigned</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Nama Lengkap *</label>
                <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Posisi (Jabatan)</label>
                <input type="text" value={formData.positionApplied} onChange={(e) => setFormData({ ...formData, positionApplied: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>WhatsApp</label>
                <input type="text" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} className={inputClass} />
              </div>
            </div>

            <h3 className={sectionTitleClass}>Data Pribadi & Alamat</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* UBAHAN FORM NOMOR KARYAWAN */}
              <div className="col-span-1 md:col-span-3">
                <label className={labelClass}>Nomor Karyawan *</label>
                <input 
                  type="text" 
                  value={formData.nik_ktp} 
                  onChange={(e) => setFormData({ ...formData, nik_ktp: e.target.value })} 
                  className={inputClass} 
                  placeholder="Contoh: EMP2026123"
                  pattern="(?=.*[a-zA-Z])(?=.*\d).+"
                  title="Nomor Karyawan wajib berupa kombinasi huruf dan angka"
                  required 
                />
                <p className="text-[10px] text-blue-500 mt-1">Wajib kombinasi huruf dan angka.</p>
              </div>

              <div>
                <label className={labelClass}>Jenis Kelamin</label>
                <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className={inputClass}>
                  <option value="">Pilih</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Agama</label>
                <input type="text" value={formData.religion} onChange={(e) => setFormData({ ...formData, religion: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>SIM</label>
                <input type="text" value={formData.driverLicense} onChange={(e) => setFormData({ ...formData, driverLicense: e.target.value })} placeholder="Cth: SIM A, SIM C" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tempat Lahir</label>
                <input type="text" value={formData.birthPlace} onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tanggal Lahir</label>
                <input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} className={inputClass} />
              </div>
              <div className="col-span-1 md:col-span-3">
                <label className={labelClass}>Alamat Lengkap</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={`${inputClass} resize-none h-20`} />
              </div>
              <div className="md:col-span-1">
                <label className={labelClass}>Kota</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Provinsi</label>
                <input type="text" value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })} className={inputClass} />
              </div>
            </div>

            <h3 className={sectionTitleClass}>Pendidikan Terakhir</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Jenjang Pendidikan</label>
                <input type="text" value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })} placeholder="Cth: S1, D3, SMA" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nama Institusi / Universitas</label>
                <input type="text" value={formData.university} onChange={(e) => setFormData({ ...formData, university: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Jurusan</label>
                <input type="text" value={formData.major} onChange={(e) => setFormData({ ...formData, major: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>IPK / Nilai Akhir</label>
                <input type="text" value={formData.gpa} onChange={(e) => setFormData({ ...formData, gpa: e.target.value })} placeholder="Cth: 3.85" className={inputClass} />
              </div>
            </div>

            <h3 className={sectionTitleClass}>Pengalaman Kerja Terakhir</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Perusahaan Terakhir</label>
                <input type="text" value={formData.lastCompany} onChange={(e) => setFormData({ ...formData, lastCompany: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Bidang Perusahaan</label>
                <input type="text" value={formData.lastCompanyField} onChange={(e) => setFormData({ ...formData, lastCompanyField: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Jabatan Terakhir</label>
                <input type="text" value={formData.lastPosition} onChange={(e) => setFormData({ ...formData, lastPosition: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Level Jabatan</label>
                <input type="text" value={formData.lastPositionLevel} onChange={(e) => setFormData({ ...formData, lastPositionLevel: e.target.value })} placeholder="Cth: Staff, Manager" className={inputClass} />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className={labelClass}>Total Pengalaman Kerja</label>
                <input type="text" value={formData.totalExperience} onChange={(e) => setFormData({ ...formData, totalExperience: e.target.value })} placeholder="Cth: 2 Tahun 5 Bulan" className={inputClass} />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className={labelClass}>Deskripsi Pengalaman</label>
                <textarea value={formData.experienceDescription} onChange={(e) => setFormData({ ...formData, experienceDescription: e.target.value })} className={`${inputClass} resize-none h-24`} placeholder="Jelaskan secara singkat tugas dan tanggung jawab..." />
              </div>
            </div>
            
          </form>
        </div>

        <div className="px-6 py-4 border-t border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)] flex-shrink-0">
          <p className="text-[10px] text-[var(--secondary-500)] font-medium">Data akan langsung disinkronkan dengan database pusat.</p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--secondary-600)] hover:text-[var(--primary-900)] hover:bg-[var(--secondary-100)] rounded-lg transition-colors">
              Batal
            </button>
            <button type="submit" form="editEmployeeForm" disabled={saving} className="px-4 py-2.5 bg-[var(--primary)] text-white text-sm font-bold rounded-lg hover:bg-[var(--primary-700)] transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
EditModal.displayName = 'EditModal';

const TestResultModal = memo(({ 
  karyawan, 
  submissions,
  onClose 
}: { 
  karyawan: Karyawan | null; 
  submissions: any[];
  onClose: () => void;
}) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!karyawan) return null;

  // Filter khusus karyawan internal
  const empSubs = submissions.filter(s => (s.candidate_id === karyawan.id || s.employee_id === karyawan.id) && (s.participant_type === "Employee" || s.participant_type === "Karyawan"));
  
  const cfit = empSubs.find(s => s.test_type === "cfit");
  const kraepelin = empSubs.find(s => s.test_type === "kraepelin");
  const papi = empSubs.find(s => s.test_type === "papi");

  // PARSING JSON STRING KE OBJECT UNTUK MENGHINDARI ERROR
  const safeParse = (data: any) => {
    if (!data) return {};
    if (typeof data === 'string') {
      try { return JSON.parse(data); } catch (e) { return {}; }
    }
    return data;
  };

  const cfitScores = safeParse(cfit?.scores);
  const kraepelinScores = safeParse(kraepelin?.scores);
  const papiScores = safeParse(papi?.scores);

  // Translasi untuk memastikan bahasa Inggris
  const translateGrade = (label: string | undefined) => {
    if (!label || label === '-') return '-';
    const lower = label.toLowerCase();
    if (lower.includes('baik sekali')) return 'Above';
    if (lower.includes('baik')) return 'High';
    if (lower.includes('sedang')) return 'Average';
    if (lower.includes('kurang sekali')) return 'Below';
    if (lower.includes('kurang')) return 'Low';
    return label; 
  };

  const labelCepat = translateGrade(kraepelinScores?.gradeSpeed);
  const labelTeliti = translateGrade(kraepelinScores?.gradeAccuracy);
  const labelTahan = translateGrade(kraepelinScores?.gradeEndurance);

  // Logika pewarnaan otomatis 
  const getBadgeClass = (grade: string | undefined) => {
    if (!grade) return "";
    const lowerGrade = grade.toLowerCase();
    return (lowerGrade === 'low' || lowerGrade === 'below' || lowerGrade.includes('kurang')) 
        ? "bg-red-50 text-red-700 border-red-100" 
        : "text-teal-700 bg-teal-50 border-teal-100";
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const opt = {
        margin: 0,
        filename: `Hasil_Psikotes_${karyawan.fullName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      await html2pdf().set(opt as any).from(pdfRef.current).save();
    } catch (error) {
      console.error("Gagal mencetak PDF:", error);
      alert("Terjadi kesalahan saat mengunduh PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const pdfData = {
    candidate_name: karyawan.fullName,
    participant_type: 'Employee',
    id: karyawan.id,
    scores: { cfit: cfitScores, kraepelin: kraepelinScores, papi: papiScores }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl border border-[var(--secondary-100)] flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        <div className="px-6 py-5 border-b border-[var(--secondary-100)] flex justify-between items-center bg-[var(--background)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <FileText size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--primary-900)]">Hasil Tes Asesmen Lengkap</h2>
              <p className="text-xs text-[var(--secondary)]">{karyawan.fullName} - {karyawan.positionApplied}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--secondary-100)] rounded-full transition-colors">
            <X size={20} className="text-[var(--secondary-400)]" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-[var(--secondary-200)] shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-5 border-b pb-3 flex items-center gap-2">
                <BrainCircuit className="text-blue-500" size={20}/> Tes Kecerdasan (CFIT)
            </h3>
            {cfit ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-5 rounded-xl text-center border border-blue-100 relative overflow-hidden">
                        <p className="text-xs text-blue-600 font-extrabold uppercase tracking-wider">Skor IQ</p>
                        <p className="text-3xl font-black text-blue-900 mt-2">{cfitScores.iq || 0}</p>
                    </div>
                    <div className="bg-green-50 p-5 rounded-xl text-center border border-green-100 relative overflow-hidden">
                        <p className="text-xs text-green-600 font-extrabold uppercase tracking-wider">Klasifikasi</p>
                        <p className="text-lg font-black text-green-900 mt-4">{cfitScores.classification || "-"}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-xl text-center border border-slate-200 relative overflow-hidden">
                        <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">Jawaban Benar</p>
                        <p className="text-3xl font-black text-slate-800 mt-2">{cfitScores.raw_score || 0}</p>
                    </div>
                </div>
            ) : <p className="text-sm text-gray-500 italic">Belum ada data atau Karyawan belum menyelesaikan tes CFIT.</p>}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[var(--secondary-200)] shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-5 border-b pb-3 flex items-center gap-2">
                <Activity className="text-orange-500" size={20}/> Tes Kraepelin (Koran)
            </h3>
            {kraepelin ? (
                <div className="space-y-4">
                    {kraepelinScores.interpretation && (
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                            <p className="text-xs text-blue-600 font-extrabold uppercase tracking-wider mb-1">Interpretasi Umum</p>
                            <p className="text-sm text-blue-900 italic">"{kraepelinScores.interpretation}"</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div className="bg-amber-50 border border-amber-100 p-5 rounded-xl">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Zap className="w-4 h-4 text-amber-600"/><span className="text-[11px] font-bold uppercase text-gray-500">Speed (Kecepatan)</span>
                            </div>
                            <p className="font-black text-3xl text-amber-900">{kraepelinScores.panker ?? kraepelinScores.kecepatan ?? "-"}</p>
                            <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded w-fit mx-auto border ${getBadgeClass(labelCepat)}`}>
                                {labelCepat}
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-100 p-5 rounded-xl">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-red-600"/><span className="text-[11px] font-bold uppercase text-gray-500">Accuracy (Ketelitian)</span>
                            </div>
                            <p className="font-black text-3xl text-red-900">{kraepelinScores.totalErrors ?? kraepelinScores.salah ?? "-"}</p>
                            <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded w-fit mx-auto border ${getBadgeClass(labelTeliti)}`}>
                                {labelTeliti}
                            </div>
                        </div>

                        <div className="bg-purple-50 border border-purple-100 p-5 rounded-xl">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-purple-600"/><span className="text-[11px] font-bold uppercase text-gray-500">Endurance (Ketahanan)</span>
                            </div>
                            <p className="font-black text-3xl text-purple-900">{kraepelinScores.hanker ?? "-"}</p>
                            <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded w-fit mx-auto border ${getBadgeClass(labelTahan)}`}>
                                {labelTahan}
                            </div>
                        </div>
                    </div>
                </div>
            ) : <p className="text-sm text-gray-500 italic">Belum ada data atau Karyawan belum menyelesaikan tes Kraepelin.</p>}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[var(--secondary-200)] shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-5 border-b pb-3 flex items-center gap-2">
                <PieChart className="text-purple-500" size={20}/> Tes Kepribadian (PAPI Kostick)
            </h3>
            {papi && Object.keys(papiScores).length > 0 ? (
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
                    {Object.entries(papiScores).map(([key, value]) => (
                        <div key={key} className="bg-purple-50 p-3 rounded-xl text-center border border-purple-100 shadow-sm">
                            <p className="text-xs font-black text-purple-900">{key}</p>
                            <p className="text-lg font-bold text-purple-700 mt-1">{String(value)}</p>
                        </div>
                    ))}
                </div>
            ) : <p className="text-sm text-gray-500 italic">Belum ada data atau Karyawan belum menyelesaikan tes PAPI.</p>}
          </div>

        </div>

        <div className="px-6 py-4 border-t border-[var(--secondary-100)] flex justify-end gap-3 bg-[var(--background)] flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Tutup
          </button>
          <button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className={`px-5 py-2.5 text-sm font-bold text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm ${isGeneratingPDF ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            <Download size={16} /> {isGeneratingPDF ? 'Memproses PDF...' : 'Download Sertifikat'}
          </button>
        </div>
      </div>
      
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm' }}>
        <TestReportPDF ref={pdfRef} data={pdfData as any} />
      </div>

    </div>
  );
});
TestResultModal.displayName = 'TestResultModal';


export default function KaryawanPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [detailModal, setDetailModal] = useState<KaryawanDetail | null>(null);
  const [editModal, setEditModal] = useState<KaryawanDetail | null>(null);
  const [testResultModal, setTestResultModal] = useState<Karyawan | null>(null); 
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // STATE REPORT & EVALUATIONS
  const [reportModal, setReportModal] = useState<Karyawan | null>(null); 
  const [reportEvaluations, setReportEvaluations] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // REFS UNTUK PDF DOWNLOAD
  const finalReportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingReportPDF, setIsGeneratingReportPDF] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("hr_user");
    if (!userData) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(userData));
    fetchKaryawanList();
    fetchSubmissions();
  }, [router]);

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem("hr_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchKaryawanList = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/employees`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Gagal mengambil data karyawan");
      setKaryawanList(await res.json());
      setError(null); 
    } catch (err) {
      setError("Gagal menghubungkan ke server.");
      toast.error("Gagal memuat daftar karyawan."); 
    } finally {
      setLoading(false);
    }
  };

const fetchSubmissions = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/management/submissions`, { 
      headers: { "Authorization": `Bearer ${localStorage.getItem("hr_token")}` } 
    });
    
    if (res.ok) {
      const rawData = await res.json();
      const subsArray = Array.isArray(rawData) ? rawData : (rawData.data || []);

      // MENGGUNAKAN UTILS: Otomatis menghitung Hanker & mapping key lama
      const processedData = healAllSubmissions(subsArray);
      
      setSubmissions(processedData);
    }
  } catch (e) {
    console.error("Gagal memproses data submissions:", e);
  }
};

  const fetchKaryawanDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/employees/${id}`, { headers: getAuthHeaders() });
      if (res.ok) {
        return await res.json();
      }
      toast.error("Gagal memuat detail karyawan.");
      return null;
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
      return null;
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    const detail = await fetchKaryawanDetail(id);
    if (detail) setDetailModal(detail);
  };

  const handleEdit = async (id: string) => {
    const detail = await fetchKaryawanDetail(id);
    if (detail) setEditModal(detail);
  };

  const handleSaveEdit = async (data: Partial<KaryawanDetail>) => {
    if (!editModal) return;
    
    const updateTask = async () => {
      const res = await fetch(`${API_BASE_URL}/employees/${editModal.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Gagal memperbarui data.");
      }
      
      setEditModal(null);
      fetchKaryawanList();
      return "Data karyawan berhasil diperbarui!";
    };

    toast.promise(updateTask(), {
      loading: 'Menyimpan perubahan...',
      success: (msg) => msg,
      error: (err) => err.message || 'Terjadi kesalahan sistem.',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data karyawan ini?")) return;

    const deleteTask = async () => {
      const res = await fetch(`${API_BASE_URL}/employees/${id}`, { 
        method: "DELETE", 
        headers: getAuthHeaders() 
      });
      
      if (!res.ok) {
        throw new Error("Gagal menghapus data dari server.");
      }
      
      setKaryawanList(prev => prev.filter(c => c.id !== id));
      return "Data karyawan berhasil dihapus.";
    };

    toast.promise(deleteTask(), {
      loading: 'Menghapus data...',
      success: (msg) => msg,
      error: (err) => err.message || 'Terjadi kesalahan saat menghapus.',
    });
  };

  const handleOpenReport = async (karyawan: Karyawan) => {
    setReportModal(karyawan);
    setLoadingReport(true);
    try {
      const res = await fetch(`${API_BASE_URL}/management/evaluations/${karyawan.id}`, { 
        headers: getAuthHeaders() 
      });
      if (res.ok) {
        setReportEvaluations(await res.json());
      } else {
        setReportEvaluations([]);
      }
    } catch (e) {
      console.error("Gagal load data evaluasi:", e);
      setReportEvaluations([]);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleDownloadFinalReport = async () => {
    if (!finalReportRef.current) {
      toast.error("Data laporan belum siap, silakan tunggu sebentar.");
      return;
    }
    setIsGeneratingReportPDF(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const opt = {
        margin: 0, 
        filename: `Laporan_Evaluasi_${reportModal?.fullName?.replace(/\s+/g, '_') || 'Karyawan'}.pdf`,
        image: { type: 'jpeg' as const, quality: 1 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'] } 
      };
      
      await html2pdf().set(opt as any).from(finalReportRef.current).save();
    } catch (error) {
      console.error("Gagal mencetak PDF:", error);
      toast.error("Terjadi kesalahan saat mengunduh Laporan Evaluasi.");
    } finally {
      setIsGeneratingReportPDF(false);
    }
  };

  const filteredKaryawan = karyawanList.filter((k) => {
    const searchLower = (searchQuery || "").toLowerCase();
    const matchesSearch = 
      (k.fullName || "").toLowerCase().includes(searchLower) || 
      (k.email || "").toLowerCase().includes(searchLower);
    
    const currentStatus = k.employee_status || "Pending";
    const matchesStatus = statusFilter === "all" || currentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const s = status || "Pending";
    switch (s) {
      case "Active": return "badge badge-success";
      case "Pending": return "badge badge-warning";
      case "Resigned": return "badge badge-danger";
      default: return "badge badge-secondary";
    }
  };

  const getTestBadge = (status: string) => {
    if (status === "Completed") return "badge badge-success";
    if (status === "Active") return "badge badge-primary";
    return "badge badge-secondary text-[var(--secondary-400)]";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header 
          title="Karyawan Internal" 
          subtitle="Manajemen data karyawan dan hasil asesmen internal"
        />
        <main className="p-4 md:p-8 flex-1">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="w-full md:w-auto">
              <h2 className="text-xl md:text-2xl font-bold text-[var(--primary-900)]">Database Karyawan</h2>
              <p className="text-xs md:text-sm text-[var(--secondary)] mt-1">Total {karyawanList.length} karyawan terdaftar</p>
            </div>
            <button 
              onClick={() => router.push('/apply')} 
              className="w-full md:w-auto bg-[var(--primary)] text-white px-5 py-3 md:py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[var(--primary-700)] hover:shadow-lg hover:shadow-teal-500/20 transition-all active:scale-95 text-sm"
            >
              <Plus size={18} /> Input Karyawan Baru
            </button>
          </div>

          <div className="card-static bg-white p-4 rounded-xl border border-[var(--secondary-200)] mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="relative flex-1 w-full">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary-400)]" />
                <input
                  type="text"
                  placeholder="Cari nama atau email karyawan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row md:items-center gap-3 w-full md:w-auto">
                <div className="w-full md:w-auto flex items-center gap-2">
                  <Filter size={18} className="text-[var(--secondary-400)] hidden md:block" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full md:w-48 px-4 py-2.5 border border-[var(--secondary-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white cursor-pointer text-sm text-[var(--secondary-700)] appearance-none"
                  >
                    <option value="all">Semua Status</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 mb-6 text-red-700 animation-shake">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {loadingDetail && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
              <Loader2 className="w-10 h-10 animate-spin text-white" />
            </div>
          )}

          <div className="bg-transparent md:bg-white md:rounded-2xl md:border md:border-[var(--secondary-200)] md:overflow-hidden md:shadow-sm">
            {loading ? (
              <div className="p-20 text-center text-[var(--secondary)]">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[var(--primary)]" />
                <p className="font-medium">Memuat data karyawan...</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--secondary-50)] border-b border-[var(--secondary-100)]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Karyawan</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Posisi / Jabatan</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Test Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Tanggal Didaftarkan</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Hasil</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-[var(--secondary)] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--secondary-50)]">
                      {filteredKaryawan.map((karyawan) => (
                        <tr key={karyawan.id} className="hover:bg-[var(--primary-50)]/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-[var(--primary-700)] font-bold text-sm">
                                {(karyawan.fullName || "?").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-[var(--primary-900)] group-hover:text-[var(--primary)] transition-colors">{karyawan.fullName || "Unknown"}</p>
                                <div className="flex items-center gap-2 text-xs text-[var(--secondary)]">
                                  <Mail size={12} />
                                  <span className="truncate max-w-[150px]">{karyawan.email || "-"}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-[var(--primary-900)] flex items-center gap-1">
                                <Briefcase size={14} className="text-[var(--secondary-400)]"/> {karyawan.positionApplied || "Unassigned"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`${getStatusBadge(karyawan.employee_status)} rounded-full px-2.5 py-1 text-xs font-semibold`}>
                              {karyawan.employee_status || "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTestBadge(karyawan.test_status)}`}>
                              {karyawan.test_status || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--secondary)]">
                            {karyawan.created_at ? new Date(karyawan.created_at).toLocaleDateString("id-ID", {
                              day: 'numeric', month: 'short', year: 'numeric'
                            }) : "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => setTestResultModal(karyawan)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                title="Hasil Psikotes"
                              >
                                <Award size={14}/> Psikotes
                              </button>
                              <button 
                                onClick={() => handleOpenReport(karyawan)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                title="Laporan Evaluasi Akhir"
                              >
                                <ClipboardList size={14}/> Evaluasi
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleViewDetail(karyawan.id)}
                                className="p-2 text-[var(--secondary-400)] hover:text-[var(--primary)] hover:bg-[var(--primary-50)] rounded-lg transition-colors" 
                                title="Lihat Detail"
                              >
                                <Eye size={18} />
                              </button>
                              <button 
                                onClick={() => handleEdit(karyawan.id)}
                                className="p-2 text-[var(--secondary-400)] hover:text-[var(--success)] hover:bg-green-50 rounded-lg transition-colors" 
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={() => handleDelete(karyawan.id)}
                                className="p-2 text-[var(--secondary-400)] hover:text-[var(--danger)] hover:bg-red-50 rounded-lg transition-colors" 
                                title="Hapus"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-4">
                  {filteredKaryawan.map((karyawan) => (
                    <div key={karyawan.id} className="bg-white p-4 rounded-xl border border-[var(--secondary-200)] shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[var(--primary-100)] flex items-center justify-center text-[var(--primary-700)] font-bold text-lg">
                             {(karyawan.fullName || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-[var(--primary-900)] text-base">{karyawan.fullName || "Unknown"}</h3>
                            <p className="text-xs text-[var(--secondary)]">{karyawan.email || "-"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                         <div>
                            <p className="text-[10px] text-[var(--secondary-400)] uppercase">Posisi</p>
                            <p className="font-medium text-[var(--primary-900)] truncate">{karyawan.positionApplied || "Unassigned"}</p>
                         </div>
                         <div>
                            <p className="text-[10px] text-[var(--secondary-400)] uppercase">Joined</p>
                            <p className="font-medium text-[var(--secondary)]">
                               {karyawan.created_at ? new Date(karyawan.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                            </p>
                         </div>
                      </div>

                      <div className="flex gap-2">
                          <span className={`${getStatusBadge(karyawan.employee_status)} rounded-lg px-3 py-1 text-xs font-semibold flex-1 text-center`}>
                              {karyawan.employee_status || "Pending"}
                          </span>
                          <span className={`rounded-lg px-3 py-1 text-xs font-semibold flex-1 text-center border border-[var(--secondary-200)] bg-[var(--secondary-50)] text-[var(--secondary-600)]`}>
                              {karyawan.test_status || "-"} Test
                          </span>
                      </div>

                      <div className="flex gap-2">
                        <button 
                            onClick={() => setTestResultModal(karyawan)} 
                            className="flex-1 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors"
                        >
                            <Award size={16} /> Psikotes
                        </button>
                        <button 
                            onClick={() => handleOpenReport(karyawan)} 
                            className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-colors"
                        >
                            <ClipboardList size={16} /> Evaluasi
                        </button>
                      </div>

                      <div className="pt-3 border-t border-[var(--secondary-50)] flex justify-between gap-2 overflow-x-auto">
                          <button 
                            onClick={() => handleViewDetail(karyawan.id)}
                            className="flex-1 py-2 px-3 bg-[var(--primary-50)] text-[var(--primary)] rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-[var(--primary-100)]"
                          >
                             <Eye size={14} /> Detail
                          </button>
                          <button 
                                onClick={() => handleEdit(karyawan.id)}
                                className="p-2 text-[var(--secondary-400)] hover:text-[var(--success)] bg-gray-50 rounded-lg" 
                              >
                                <Edit size={16} />
                          </button>
                          <button 
                                onClick={() => handleDelete(karyawan.id)}
                                className="p-2 text-[var(--secondary-400)] hover:text-[var(--danger)] bg-gray-50 rounded-lg" 
                              >
                                <Trash2 size={16} />
                          </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredKaryawan.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-[var(--secondary)]">
                    <div className="w-16 h-16 bg-[var(--secondary-50)] rounded-full flex items-center justify-center mb-4">
                       <Search size={32} className="text-[var(--secondary-400)]" />
                    </div>
                    <p className="font-bold text-[var(--primary-900)]">Tidak ada karyawan yang ditemukan</p>
                    <p className="text-sm">Coba ubah filter pencarian Anda atau tambahkan karyawan baru.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {detailModal && <DetailModal karyawan={detailModal} onClose={() => setDetailModal(null)} />}
      {editModal && <EditModal karyawan={editModal} onClose={() => setEditModal(null)} onSave={handleSaveEdit} />}
      {testResultModal && <TestResultModal karyawan={testResultModal} submissions={submissions} onClose={() => setTestResultModal(null)} />}
      
      {/* MODAL LAPORAN EVALUASI AKHIR (USER INTERFACE) */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-[var(--background)]">
              <h3 className="font-bold text-[var(--primary-900)] text-lg flex items-center gap-2">
                <ClipboardList className="text-[var(--primary)]" /> Laporan Evaluasi Kinerja: {reportModal.fullName}
              </h3>
              <button onClick={() => setReportModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 relative">
              {loadingReport ? (
                 <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-[var(--secondary)]">
                    <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)] mb-3" />
                    <p className="font-medium text-sm">Mengambil data evaluasi...</p>
                 </div>
              ) : (
              <CandidateFinalReport 
                  candidateId={reportModal.id} 
                  employeeId={reportModal.id} 
                  candidateName={reportModal.fullName}
                  candidateNik={reportModal.nik_ktp || "-"} 
                  jobPosition={reportModal.positionApplied || "Karyawan Internal"}
                  submissions={submissions.filter(s => s.candidate_id === reportModal.id || s.employee_id === reportModal.id)}
                  evaluations={reportEvaluations}
                />
              )}
            </div>

            <div className="px-6 py-4 border-t border-[var(--secondary-100)] flex justify-end gap-3 bg-[var(--background)] flex-shrink-0">
              <button onClick={() => setReportModal(null)} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Tutup
              </button>
              <button onClick={handleDownloadFinalReport} disabled={isGeneratingReportPDF} className={`px-4 py-2.5 text-sm font-bold text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm ${isGeneratingReportPDF ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-700 hover:bg-teal-800'}`}>
                <Download size={16} /> {isGeneratingReportPDF ? 'Memproses PDF...' : 'Download Laporan Evaluasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN RENDER UNTUK PDF GENERATION: 
          KUNCI PERBAIKAN: Dibungkus dengan backgroundColor #ffffff dan width 210mm absolut */}
      {reportModal && !loadingReport && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm', backgroundColor: '#ffffff' }}>
          <div ref={finalReportRef}>
                <CandidateFinalReport 
                  candidateId={reportModal.id} 
                  employeeId={reportModal.id} 
                  candidateName={reportModal.fullName}
                  candidateNik={reportModal.nik_ktp || "-"} 
                  jobPosition={reportModal.positionApplied || "Karyawan Internal"}
                  submissions={submissions.filter(s => s.candidate_id === reportModal.id || s.employee_id === reportModal.id)}
                  evaluations={reportEvaluations}
                />
          </div>
        </div>
      )}

    </div>
  );
}
