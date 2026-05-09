// File: hr-next/src/lib/evaluationConclusions.ts

// ============================================================================
// 1. KESIMPULAN PER PARAMETER KOMPETENSI (BEI) - Sesuai "Final Evaluation"
// ============================================================================
export const getCompetencyConclusion = (category: string, percentage: number): string => {
  if (percentage === 0) return "Belum ada data penilaian dari Assesor untuk kompetensi ini.";

  if (percentage >= 90) {
    switch(category) {
      case "Communication Skill": return "Mampu menyampaikan informasi secara sangat jelas, persuasif, dan terstruktur, serta efektif dalam berbagai situasi termasuk komunikasi lintas level dan kondisi kompleks.";
      case "Teamwork Skill": return "Menjadi penggerak dalam tim, mampu membangun kolaborasi yang kuat, serta menciptakan sinergi antar individu maupun lintas fungsi.";
      case "Problem Solving": return "Menunjukkan kemampuan analitis yang sangat kuat dalam menyelesaikan masalah kompleks serta menghasilkan solusi yang strategis dan berdampak.";
      case "Adaptability": return "Sangat adaptif dan proaktif dalam menghadapi perubahan, serta mampu berkembang dengan cepat dalam berbagai situasi.";
      case "Integrity": return "Menunjukkan integritas yang tinggi secara konsisten serta menjadi contoh dalam menjunjung nilai dan etika kerja.";
      case "Safety Awareness": return "Menjadi role model dalam penerapan keselamatan kerja serta aktif berkontribusi dalam menciptakan budaya safety di lingkungan kerja.";
      default: return "Kompetensi sangat luar biasa.";
    }
  }
  if (percentage >= 80) {
    switch(category) {
      case "Communication Skill": return "Mampu menyampaikan informasi secara jelas, sistematis, dan efektif, serta menjalin komunikasi yang baik lintas departemen maupun level organisasi.";
      case "Teamwork Skill": return "Berperan aktif dalam tim, mampu berkolaborasi dengan baik, serta memberikan kontribusi dalam mencapai tujuan bersama.";
      case "Problem Solving": return "Mampu menganalisis permasalahan secara sistematis, menemukan akar masalah, dan memberikan solusi yang tepat dan relevan.";
      case "Adaptability": return "Cepat menyesuaikan diri terhadap perubahan, mampu belajar secara mandiri, serta menunjukkan fleksibilitas dalam menghadapi tantangan baru.";
      case "Integrity": return "Menunjukkan konsistensi dalam menjaga integritas, serta mampu mengambil sikap yang tepat dalam situasi yang membutuhkan ketegasan.";
      case "Safety Awareness": return "Memiliki kepedulian terhadap keselamatan kerja, serta secara aktif mengidentifikasi potensi bahaya dan melakukan tindakan pencegahan.";
      default: return "Kompetensi di atas ekspektasi.";
    }
  }
  if (percentage >= 70) {
    switch(category) {
      case "Communication Skill": return "Mampu menyampaikan informasi dengan cukup jelas dan terstruktur dalam situasi kerja sehari-hari, serta dapat menjalin komunikasi yang baik dengan rekan kerja.";
      case "Teamwork Skill": return "Mampu bekerja sama dengan tim dan berkontribusi dalam penyelesaian tugas bersama, serta menunjukkan sikap kooperatif dalam lingkungan kerja.";
      case "Problem Solving": return "Mampu mengidentifikasi masalah dan memberikan solusi yang relevan untuk kasus umum dengan pendekatan yang cukup logis.";
      case "Adaptability": return "Mampu beradaptasi dengan perubahan serta mempelajari hal baru dengan cukup baik dalam lingkungan kerja yang dinamis.";
      case "Integrity": return "Menunjukkan sikap jujur dan patuh terhadap aturan dalam pelaksanaan pekerjaan sehari-hari.";
      case "Safety Awareness": return "Memahami dan mengikuti prosedur keselamatan kerja serta mampu mengenali potensi bahaya dalam lingkup dasar.";
      default: return "Kompetensi sesuai ekspektasi.";
    }
  }
  if (percentage >= 50) {
    switch(category) {
      case "Communication Skill": return "Mampu menyampaikan informasi dasar, namun penyampaian masih belum konsisten dan kurang terstruktur. Kemampuan dalam menangani miskomunikasi dan komunikasi lintas fungsi masih terbatas.";
      case "Teamwork Skill": return "Terlibat dalam kerja tim, namun kontribusi yang diberikan masih terbatas dan belum menunjukkan peran aktif dalam kolaborasi maupun dukungan terhadap tim.";
      case "Problem Solving": return "Mampu menangani permasalahan sederhana, namun pendekatan yang digunakan belum sistematis dan belum menunjukkan analisis yang mendalam.";
      case "Adaptability": return "Mulai mampu menyesuaikan diri terhadap perubahan, namun masih membutuhkan waktu dan arahan dalam menghadapi situasi baru.";
      case "Integrity": return "Memahami pentingnya aturan dan etika kerja, namun belum terlihat konsistensi dalam penerapannya, khususnya dalam situasi yang menantang.";
      case "Safety Awareness": return "Memiliki pemahaman dasar terkait keselamatan kerja, namun belum menunjukkan inisiatif dalam mengidentifikasi dan mencegah potensi risiko.";
      default: return "Kompetensi di bawah ekspektasi.";
    }
  }
  
  // < 50%
  switch(category) {
    case "Communication Skill": return "Belum mampu menyampaikan informasi secara jelas dan terstruktur. Penjelasan pengalaman masih terbatas serta belum menunjukkan kemampuan dalam menangani miskomunikasi maupun komunikasi lintas tim atau level.";
    case "Teamwork Skill": return "Belum menunjukkan kemampuan bekerja sama secara efektif dalam tim. Kontribusi dalam kerja tim masih sangat terbatas dan belum terlihat peran dalam mendukung anggota tim lain.";
    case "Problem Solving": return "Belum mampu mengidentifikasi permasalahan secara tepat serta belum menunjukkan pendekatan yang sistematis dalam menemukan solusi.";
    case "Adaptability": return "Masih mengalami kesulitan dalam menyesuaikan diri terhadap perubahan dan belum menunjukkan kesiapan dalam menghadapi dinamika pekerjaan.";
    case "Integrity": return "Belum terlihat contoh nyata terkait penerapan nilai integritas, baik dalam kepatuhan terhadap aturan maupun dalam pengambilan keputusan.";
    case "Safety Awareness": return "Belum menunjukkan kesadaran terhadap pentingnya keselamatan kerja serta belum mampu mengidentifikasi potensi risiko.";
    default: return "Belum mampu memenuhi standar kompetensi dasar.";
  }
};

// ============================================================================
// 2. KESIMPULAN PER PARAMETER VALUE BEHAVIOUR - Sesuai "Final Evaluation"
// ============================================================================
export const getValueConclusion = (value: string, percentage: number): string => {
  if (percentage === 0) return "Belum ada data penilaian dari Assesor untuk perilaku ini.";

  if (percentage >= 90) {
    switch(value) {
      case "Growth": return "Secara konsisten menunjukkan dorongan kuat untuk berkembang, mampu menginisiasi perbaikan, serta berkontribusi dalam peningkatan kinerja secara signifikan.";
      case "Respect": return "Menjadi contoh dalam menghargai perbedaan, membangun hubungan kerja yang sehat, serta menciptakan lingkungan kerja yang saling menghargai.";
      case "Accountability": return "Menunjukkan ownership yang sangat kuat terhadap pekerjaan, memastikan hasil kerja berkualitas tinggi serta bertanggung jawab atas setiap hasil yang dicapai.";
      case "Collaboration": return "Menjadi penggerak kolaborasi, mampu menyatukan berbagai pihak, serta menciptakan sinergi yang berdampak positif bagi organisasi.";
      case "Excellent": return "Secara konsisten menunjukkan standar kerja yang tinggi, mampu memberikan solusi yang bernilai tambah, serta mendorong peningkatan kualitas kerja secara berkelanjutan.";
      case "Safety": return "Menjadi role model dalam penerapan keselamatan kerja, aktif dalam membangun budaya safety, serta mendorong pencegahan risiko secara menyeluruh.";
      case "Sustainability": return "Menunjukkan komitmen kuat terhadap keberlanjutan, baik dari sisi lingkungan maupun sosial, serta berkontribusi aktif dalam menciptakan dampak positif jangka panjang.";
      default: return "Perilaku sangat mencerminkan nilai perusahaan.";
    }
  }
  if (percentage >= 80) {
    switch(value) {
      case "Growth": return "Secara aktif menunjukkan inisiatif dalam pengembangan diri dan peningkatan kinerja, serta mampu melakukan evaluasi dan perbaikan secara berkelanjutan.";
      case "Respect": return "Menunjukkan sikap terbuka, menghargai perbedaan, serta mampu membangun hubungan kerja yang positif dan konstruktif.";
      case "Accountability": return "Memiliki tanggung jawab yang kuat terhadap pekerjaan, memastikan penyelesaian tugas secara menyeluruh dengan kualitas yang baik.";
      case "Collaboration": return "Berperan aktif dalam tim, mampu berkolaborasi lintas fungsi, serta mendukung pencapaian tujuan organisasi.";
      case "Excellent": return "Menunjukkan komitmen terhadap kualitas, mampu memberikan solusi yang tepat, serta berupaya meningkatkan efisiensi dalam pekerjaan.";
      case "Safety": return "Memiliki kesadaran tinggi terhadap keselamatan kerja dan secara aktif mengidentifikasi serta mencegah potensi risiko.";
      case "Sustainability": return "Menunjukkan kepedulian terhadap dampak lingkungan dan sosial serta mulai berkontribusi dalam praktik kerja yang lebih berkelanjutan.";
      default: return "Perilaku selaras dengan nilai perusahaan.";
    }
  }
  if (percentage >= 70) {
    switch(value) {
      case "Growth": return "Menunjukkan keinginan untuk berkembang serta mulai berinisiatif dalam meningkatkan kualitas kerja. Mampu melakukan evaluasi dasar terhadap hasil pekerjaan.";
      case "Respect": return "Menunjukkan sikap menghargai rekan kerja serta mampu bekerja sama dalam lingkungan yang beragam.";
      case "Accountability": return "Menyelesaikan pekerjaan dengan cukup baik dan menunjukkan tanggung jawab terhadap tugas yang diberikan.";
      case "Collaboration": return "Mampu bekerja sama dengan tim dan berkontribusi dalam pencapaian tujuan bersama.";
      case "Excellent": return "Menunjukkan upaya dalam menjaga kualitas hasil kerja serta memberikan respons yang cukup baik terhadap situasi kerja.";
      case "Safety": return "Memahami dan mengikuti prosedur keselamatan kerja serta mampu mengenali potensi risiko dasar.";
      case "Sustainability": return "Menunjukkan kesadaran terhadap efisiensi kerja dan dampak lingkungan dalam lingkup dasar.";
      default: return "Perilaku cukup memenuhi nilai perusahaan.";
    }
  }
  if (percentage >= 50) {
    switch(value) {
      case "Growth": return "Mulai menunjukkan keinginan untuk berkembang, namun inisiatif yang dilakukan masih terbatas dan belum konsisten. Evaluasi terhadap pekerjaan belum dilakukan secara mendalam.";
      case "Respect": return "Mampu menjaga hubungan kerja yang cukup baik, namun belum sepenuhnya menunjukkan keterbukaan dalam menerima maupun memberikan pandangan yang berbeda.";
      case "Accountability": return "Menyelesaikan tugas yang diberikan, namun belum secara konsisten memastikan kualitas dan kelengkapan hasil kerja.";
      case "Collaboration": return "Terlibat dalam kerja tim, namun kontribusi masih terbatas dan belum menunjukkan peran aktif dalam mendukung tim atau lintas fungsi.";
      case "Excellent": return "Mulai menunjukkan upaya dalam memberikan hasil kerja yang baik, namun belum terlihat dorongan untuk meningkatkan kualitas atau efisiensi secara signifikan.";
      case "Safety": return "Memahami dasar keselamatan kerja, namun belum menunjukkan sikap proaktif dalam mengidentifikasi maupun mencegah risiko.";
      case "Sustainability": return "Mulai memiliki kesadaran terhadap dampak kerja, namun belum diikuti dengan tindakan nyata yang konsisten.";
      default: return "Perilaku dasar mulai terlihat namun butuh konsistensi.";
    }
  }

  // < 50%
  switch(value) {
    case "Growth": return "Belum terlihat dorongan untuk berkembang secara aktif. Kandidat cenderung menjalankan tugas secara pasif tanpa menunjukkan inisiatif untuk meningkatkan kualitas kerja maupun melakukan evaluasi terhadap hasil yang telah dicapai.";
    case "Respect": return "Interaksi kerja belum mencerminkan penghargaan terhadap perbedaan maupun sudut pandang orang lain. Respons yang diberikan belum menunjukkan kemampuan membangun hubungan kerja yang positif.";
    case "Accountability": return "Belum menunjukkan kepemilikan terhadap pekerjaan secara menyeluruh. Penyelesaian tugas cenderung terbatas dan belum menunjukkan tanggung jawab dalam memastikan hasil kerja yang optimal.";
    case "Collaboration": return "Kontribusi dalam kerja tim masih sangat terbatas. Belum terlihat upaya aktif dalam mendukung tujuan bersama maupun menjalin koordinasi yang efektif.";
    case "Excellent": return "Belum menunjukkan upaya untuk mencapai hasil kerja yang lebih baik. Respons terhadap situasi kerja masih reaktif dan belum mencerminkan upaya perbaikan atau efisiensi.";
    case "Safety": return "Kesadaran terhadap keselamatan kerja belum terlihat. Tidak menunjukkan kemampuan dalam mengidentifikasi risiko maupun kepatuhan terhadap prosedur keselamatan.";
    case "Sustainability": return "Belum menunjukkan kepedulian terhadap dampak pekerjaan, baik dari sisi lingkungan maupun sosial. Pendekatan kerja masih terbatas pada penyelesaian tugas tanpa mempertimbangkan keberlanjutan.";
    default: return "Perilaku tidak selaras dengan ekspektasi perusahaan.";
  }
};

// ============================================================================
// 3. KESIMPULAN AKHIR (OVERALL GRAND CONCLUSION) - Sesuai "Final Evaluation"
// ============================================================================
export const getAutoConclusion = (percentage: number): string => {
  if (percentage === 0) return "Belum ada data evaluasi yang masuk, sehingga kesimpulan akhir belum dapat digenerate oleh sistem.";

  if (percentage >= 90) {
    return "Kandidat menunjukkan kemampuan komunikasi yang sangat kuat dan mampu menjadi penghubung efektif dalam membangun kolaborasi lintas fungsi dengan tetap menjunjung tinggi rasa saling menghargai. Dalam menghadapi situasi kerja, kandidat mampu berpikir secara analitis dan strategis, serta mengambil keputusan yang tepat dengan penuh tanggung jawab. Kandidat juga menunjukkan dorongan yang tinggi untuk terus berkembang, secara aktif melakukan perbaikan, serta memberikan kontribusi yang berdampak nyata bagi tim dan organisasi. Selain itu, kandidat mencerminkan kepedulian yang tinggi terhadap kualitas, efisiensi, keselamatan kerja, serta keberlanjutan, sehingga mampu menjadi role model dalam penerapan nilai-nilai organisasi.";
  }
  if (percentage >= 80) {
    return "Kandidat menunjukkan kemampuan komunikasi yang efektif serta mampu membangun kolaborasi yang baik dalam tim maupun lintas fungsi, dengan tetap menghargai perbedaan dan menjaga hubungan kerja yang positif. Dalam menyelesaikan pekerjaan, kandidat menunjukkan tanggung jawab yang kuat dengan pendekatan yang sistematis dan berbasis analisis. Kandidat juga aktif dalam mengembangkan diri, terbuka terhadap umpan balik, serta mampu beradaptasi dengan baik terhadap perubahan. Selain itu, terlihat kepedulian terhadap kualitas, efisiensi, serta penerapan standar keselamatan dan nilai-nilai keberlanjutan dalam pekerjaan. Secara keseluruhan, kandidat mampu mengintegrasikan kompetensi dengan value behavior secara konsisten.";
  }
  if (percentage >= 70) {
    return "Kandidat mampu menjalankan komunikasi dan kerja sama secara cukup efektif, serta menunjukkan sikap terbuka dalam berinteraksi dan menerima masukan. Dalam menyelesaikan pekerjaan, kandidat telah menunjukkan tanggung jawab dan pendekatan yang cukup logis, meskipun masih terbatas pada situasi umum. Kemampuan beradaptasi dan keinginan untuk berkembang sudah mulai terlihat, didukung dengan kontribusi dalam tim yang cukup baik. Kandidat juga menunjukkan kepedulian terhadap kualitas hasil kerja dan kepatuhan terhadap standar yang berlaku, meskipun masih perlu meningkatkan konsistensi serta inisiatif dalam menciptakan nilai tambah.";
  }
  if (percentage >= 50) {
    return "Kandidat menunjukkan pemahaman dasar mengenai pekerjaan namun masih membutuhkan arahan dan pengembangan signifikan dalam hal komunikasi, kolaborasi, dan penyelesaian masalah. Inisiatif dan adaptasi terhadap perubahan masih tergolong minim.";
  }

  // < 50%
  return "Kandidat belum menunjukkan kemampuan dasar dalam menyampaikan ide maupun bekerja sama secara efektif, yang berdampak pada rendahnya kontribusi dalam tim serta tidak terlihatnya penghargaan terhadap peran dan sudut pandang orang lain. Pendekatan dalam menyelesaikan masalah belum terstruktur dan tidak mencerminkan tanggung jawab terhadap hasil kerja. Selain itu, tidak terlihat adanya dorongan untuk berkembang, inisiatif dalam memperbaiki kinerja, maupun kesadaran terhadap standar kerja, keselamatan, dan dampak pekerjaan. Secara keseluruhan, kandidat belum mampu mengintegrasikan kemampuan kerja dengan nilai-nilai yang diharapkan organisasi.";
};

// ============================================================================
// 4. MATRIKS REKOMENDASI (STATUS & KODE)
// ============================================================================
export const getRecommendationStatus = (score: number) => {
  if (score === 0) return { remarks: '-', status: 'Belum Dinilai', code: '-' };
  if (score < 50) return { remarks: 'Unacceptable', status: 'Not Recommended', code: 'Failed' };
  if (score < 70) return { remarks: 'Below Expectation', status: 'Not Recommended', code: 'NR' };
  if (score < 80) return { remarks: 'Fully Successful', status: 'Recommended', code: 'R2' }; 
  if (score < 90) return { remarks: 'Above Expectation', status: 'Recommended', code: 'R1' };
  return { remarks: 'Outstanding', status: 'Recommended', code: 'R0' };
};