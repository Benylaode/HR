// File: hr-next/src/lib/evaluationQuestions.ts

// ==========================================
// 1. DATA KOMPETENSI (KANDIDAT EKSTERNAL / DEFAULT)
// ==========================================
export const CANDIDATE_COMPETENCY_CATEGORIES = [
  {
    category: "Communication Skill",
    bobot: "20%",
    questions: [
      { id: "cand_comp_1", question: "Ceritakan pengalaman Anda saat harus menjelaskan hal teknis kepada orang awam. Bagaimana cara Anda?", indikator: "Mampu menyederhanakan bahasa & memastikan pemahaman" },
      { id: "cand_comp_2", question: "Bagaimana Anda menangani situasi ketika ada kesalahpahaman dengan rekan kerja atau atasan?", indikator: "Klarifikasi masalah & inisiatif komunikasi" },
      { id: "cand_comp_3", question: "Ceritakan pengalaman Anda meyakinkan orang lain yang memiliki pendapat berbeda dengan Anda.", indikator: "Persuasif, logis & menghargai lawan bicara" }
    ]
  },
  {
    category: "Teamwork Skill",
    bobot: "20%",
    questions: [
      { id: "cand_comp_4", question: "Ceritakan pengalaman Anda bekerja dalam tim dengan latar belakang anggota yang sangat berbeda.", indikator: "Toleransi & mampu membaur" },
      { id: "cand_comp_5", question: "Pernahkah Anda harus mengerjakan tugas anggota tim lain yang tidak selesai? Bagaimana sikap Anda?", indikator: "Inisiatif & fokus pada target bersama" },
      { id: "cand_comp_6", question: "Bagaimana cara Anda memotivasi anggota tim yang sedang tidak bersemangat?", indikator: "Empati & dorongan positif" }
    ]
  },
  {
    category: "Problem Solving",
    bobot: "20%",
    questions: [
      { id: "cand_comp_7", question: "Ceritakan masalah paling rumit yang pernah Anda hadapi di pekerjaan sebelumnya. Bagaimana solusinya?", indikator: "Analisa akar masalah & solusi efektif" },
      { id: "cand_comp_8", question: "Pernahkah Anda harus mengambil keputusan cepat tanpa panduan yang jelas? Jelaskan prosesnya.", indikator: "Pengambilan keputusan logis & berani ambil risiko terukur" },
      { id: "cand_comp_9", question: "Apa yang Anda lakukan saat rencana yang Anda susun gagal di tengah jalan?", indikator: "Plan B (Mitigasi) & evaluasi" }
    ]
  },
  {
    category: "Adaptability",
    bobot: "20%",
    questions: [
      { id: "cand_comp_10", question: "Ceritakan pengalaman Anda saat harus beradaptasi dengan tool/teknologi baru dalam waktu singkat.", indikator: "Kecepatan belajar (Learning Agility)" },
      { id: "cand_comp_11", question: "Pernahkah atasan Anda mengubah target pekerjaan secara mendadak? Bagaimana respon Anda?", indikator: "Fleksibel & tetap tenang di bawah tekanan" },
      { id: "cand_comp_12", question: "Bagaimana Anda menghadapi lingkungan kerja yang ritmenya jauh lebih cepat dari sebelumnya?", indikator: "Manajemen waktu & prioritas" }
    ]
  },
  {
    category: "Integrity",
    bobot: "20%",
    questions: [
      { id: "cand_comp_13", question: "Ceritakan saat Anda menyadari Anda membuat kesalahan besar. Apa yang Anda lakukan?", indikator: "Mengakui kesalahan & bertanggung jawab" },
      { id: "cand_comp_14", question: "Pernahkah Anda diminta melakukan sesuatu yang bertentangan dengan aturan oleh atasan?", indikator: "Teguh pada prinsip & etika kerja" },
      { id: "cand_comp_15", question: "Bagaimana cara Anda menjaga kerahasiaan data perusahaan sebelumnya?", indikator: "Kepatuhan & loyalitas" }
    ]
  }
];

// ==========================================
// 2. DATA KOMPETENSI (KARYAWAN INTERNAL / SESUAI EXCEL)
// ==========================================
export const EMPLOYEE_COMPETENCY_CATEGORIES = [
  {
    category: "Communication Skill",
    bobot: "15%",
    questions: [
      { id: "emp_comp_1", question: "Ceritakan saat Anda harus menyampaikan perubahan kebijakan/prosedur kepada tim yang menolak. Bagaimana Anda memastikan pesan dipahami dan dijalankan?", indikator: "Struktur penyampaian jelas (alur logis)" },
      { id: "emp_comp_2", question: "Pernahkah terjadi miskomunikasi antar divisi? Apa yang Anda lakukan untuk memperbaikinya?", indikator: "Mengidentifikasi sumber masalah & Perbaikan komunikasi" },
      { id: "emp_comp_3", question: "Ceritakan pengalaman Anda menjelaskan hal kompleks ke Management hingga mereka bisa mengambil keputusan", indikator: "Menyesuaikan gaya komunikasi" }
    ]
  },
  {
    category: "Teamwork Skill",
    bobot: "10%",
    questions: [
      { id: "emp_comp_4", question: "Ceritakan saat tim Anda gagal mencapai target. Apa kontribusi spesifik Anda dalam memperbaikinya?", indikator: "Mencari solusi win-win serta bersikap Objektif & netral" },
      { id: "emp_comp_5", question: "Pernah bekerja dengan anggota tim yang sulit atau tidak perform? Bagaimana Anda mengelolanya tanpa merusak hubungan kerja?", indikator: "Inisiatif membantu & Koordinasi efektif" }
    ]
  },
  {
    category: "Problem Solving",
    bobot: "25%",
    questions: [
      { id: "emp_comp_6", question: "Ceritakan satu masalah operasional yang Anda tangani end-to-end. Jelaskan bagaimana Anda menjalankan Plan–Do–Check–Act (PDCA)", indikator: "Struktur berpikir jelas & Solusi relevan" },
      { id: "emp_comp_7", question: "Saat solusi tidak mencapai target, bagaimana Anda melakukan evaluasi (Check) dan menentukan perbaikan (Act)?", indikator: "Identifikasi root cause & melakukan pendekatan logis" },
      { id: "emp_comp_8", question: "Bagaimana Anda memastikan solusi menjadi standar dan mencegah masalah terulang kembali?", indikator: "Menggunakan data valid & Analisa evidence-based" }
    ]
  },
  {
    category: "Adaptability",
    bobot: "10%",
    questions: [
      { id: "emp_comp_9", question: "Ceritakan saat prioritas kerja berubah mendadak. Bagaimana Anda mengatur ulang pekerjaan?", indikator: "Tetap produktif & Respon Cepat" },
      { id: "emp_comp_10", question: "Pernah ditempatkan di lingkungan/proses baru? Bagaimana Anda beradaptasi dengan cepat?", indikator: "Inisiatif belajar & Implementasi langsung" },
      { id: "emp_comp_11", question: "Bagaimana Anda menjaga performa saat terjadi perubahan kebijakan internal?", indikator: "Growth mindset & Proaktif" }
    ]
  },
  {
    category: "Integrity",
    bobot: "30%",
    questions: [
      { id: "emp_comp_12", question: "Ceritakan saat Anda menemukan praktik kerja yang tidak sesuai SOP. Apa tindakan Anda?", indikator: "Tegas, Berani & Profesional" },
      { id: "emp_comp_13", question: "Pernahkah Anda berada dalam dilema antara target dan kepatuhan aturan? Apa keputusan Anda?", indikator: "Tidak terpengaruh, Teguh prinsip & Etis" },
      { id: "emp_comp_14", question: "Bagaimana Anda memastikan tetap bekerja sesuai aturan di tengah tekanan?", indikator: "Transparansi, Konsistensi, & Dampak positif" }
    ]
  },
  {
    category: "Safety Awareness",
    bobot: "10%",
    questions: [
      { id: "emp_comp_15", question: "Ceritakan saat Anda menemukan potensi risiko kerja. Apa tindakan konkret Anda?", indikator: "Hazard awareness, Observasi tajam & Preventif" },
      { id: "emp_comp_16", question: "Bagaimana Anda memastikan tim menjalankan standar keselamatan secara konsisten?", indikator: "Tindakan cepat, Proaktif & Dampak nyata" }
    ]
  }
];

// ==========================================
// 3. DATA VALUE BEHAVIOR (Berlaku untuk keduanya)
// ==========================================
export const BEHAVIOR_QUESTIONS = [
  { id: "behav_1", value: "Growth", sub: "Rasa ingin Berkembang", indikator: "Aktif berpartisipasi memunculkan ide ide untuk menumbuhkan produktivitas" },
  { id: "behav_2", value: "Growth", sub: "Evaluasi diri", indikator: "Melakukan evaluasi, memberikan rekomendasi perbaikan dan mengimplementasikannya" },
  { id: "behav_3", value: "Respect", sub: "Rasa Hormat", indikator: "Menghargai keberagaman dalam tim kerja, dan mampu bekerjasama meraih target-target melampaui standar kinerja." },
  { id: "behav_4", value: "Respect", sub: "Menghargai pendapat", indikator: "Mampu memberikan dan menerima umpan balik secara terbuka dan penuh penghargaan." },
  { id: "behav_5", value: "Accountability", sub: "Akuntabilitas", indikator: "Selalu focus dalam mencari solusi dari pada terpaku dalam permasalahan." },
  { id: "behav_6", value: "Collaboration", sub: "Kolaborasi", indikator: "Menempatkan prioritas yang lebih tinggi pada tujuan tim dan organisasi daripada tujuan kami sendiri." },
  { id: "behav_7", value: "Collaboration", sub: "Komunikasi", indikator: "Aktif menjalin koordinasi dan komunikasi dengan baik antar anggota tim maupun lintas department" },
  { id: "behav_8", value: "Excellent", sub: "Keunggulan", indikator: "Menawarkan saran-saran yang sesuai serta mengambil tindakan yang relevan Ketika menghadapi situasi yang tidak diharapkan." },
  { id: "behav_9", value: "Excellent", sub: "Kepedulian", indikator: "Perduli biaya dan memastikan sumberdaya dipakai secara efisien dan pemborosan berkurang." },
  { id: "behav_10", value: "Safety", sub: "Proaktif", indikator: "Secara proaktif mengidentifikasi dan melaporkan adanya bahaya atau masalah sebelum terjadi kecelakaan." },
  { id: "behav_11", value: "Safety", sub: "Keamanan", indikator: "Memimpin budaya aman dengan menunjukkan perilaku selamat, menyediakan intruksi yang jelas, serta memastikan ketaatan terhadap control dan prosedur yang berlaku." },
  { id: "behav_12", value: "Safety", sub: "Regulasi", indikator: "Mentaati standard dan prosedur yang ada, sambil selalu mencari cara yang lebih baik." },
  { id: "behav_13", value: "Sustainability", sub: "Keberlanjutan", indikator: "Berusaha keras untuk mengurangi jejak karbon dan dampak lingkungan dari apa yang telah di lakukan melalui konsumsi listrik, bahan bakar fosil, perlengkapan kantor dan bahan kimia secara hati-hati serta metode kerja yang efektif dan efisien." },
  { id: "behav_14", value: "Sustainability", sub: "Keberlanjutan", indikator: "Mengakui hak asasi manusia dan menghormati orang lain selain itu dapat mempromosikan nilai-nilai serta berkontribusi secara aktif untuk kesejahteraan seluruh pemangku kepentingan." }
];