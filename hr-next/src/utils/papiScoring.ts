// File: hr-next/src/utils/papiScoring.ts

export const getPapiInterpretation = (trait: string, score: number): string => {
  const numScore = Number(score);
  const t = trait.toUpperCase();

  switch (t) {
    case 'A': // Need to Achieve
      if (numScore >= 0 && numScore <= 5) return "Ketidakpastian tujuan, tidak ada usaha lebih";
      if (numScore >= 6 && numScore <= 9) return "Tujuan jelas, kebutuhan sukses dan ambisi tinggi";
      break;
    case 'B': // Need to Belong to Groups
      if (numScore >= 0 && numScore <= 3) return "Selektif";
      if (numScore >= 4 && numScore <= 5) return "Butuh diterima, tapi tidak mudah dipengaruhi kelompok";
      if (numScore >= 6 && numScore <= 9) return "Butuh disukai dan diakui, mudah dipengaruhi";
      break;
    case 'C': // Organized Type
      if (numScore >= 0 && numScore <= 2) return "Tidak teratur";
      if (numScore >= 3 && numScore <= 5) return "Teratur tetapi tergolong fleksibel";
      if (numScore >= 6 && numScore <= 9) return "Keteraturan tinggi cenderung kaku";
      break;
    case 'D': // Interest in Working with Details
      if (numScore >= 0 && numScore <= 3) return "Menyadari kebutuhan akan kecermatan, tetapi tidak berminat bekerja detail";
      if (numScore >= 4 && numScore <= 9) return "Minat tinggi untuk bekerja secara detail";
      break;
    case 'E': // Emotional Resistant
      if (numScore < 2) return "Terlalu cepat bereaksi, tidak normatif, ekspresi berlebihan";
      if (numScore >= 2 && numScore <= 3) return "Agen bola terka"; // *Sesuaikan jika ada typo dari Excel
      if (numScore >= 4 && numScore <= 6) return "Punya pendekatan emosional seimbang, mampu mengendalikan";
      if (numScore > 6) return "Sangat normatif, kebutuhan pengendalian diri yang berlebihan, kecenderungan defensif";
      break;
    case 'F': // Need to Support Authority
      if (numScore < 2) return "Cenderung egois, kemungkinan bisa memberontak";
      if (numScore >= 2 && numScore <= 3) return "Mandiri";
      if (numScore >= 4 && numScore <= 5) return "Setia terhadap otoritas";
      if (numScore >= 6 && numScore <= 9) return "Bersikap setia dan membantu, kemungkinan bantuannya bersifat politis";
      break;
    case 'R': // Theoretical Type
      if (numScore >= 0 && numScore <= 4) return "Bersifat praktis";
      if (numScore >= 5 && numScore <= 9) return "Nilai pendirian tergolong tinggi";
      break;
    case 'S': // Social Extension
      if (numScore < 6) return "Perhatian rendah terhadap hubungan sosial, kurang percaya pada orang lain";
      if (numScore >= 6 && numScore <= 9) return "Kepercayaan tinggi dalam berhubungan sosial, suka interaksi sosial";
      break;
    case 'T': // Pace
      if (numScore < 4) return "Melakukan segala sesuatu menurut kemauan dan kecepatannya sendiri";
      if (numScore >= 4 && numScore <= 6) return "Tergolong aktif secara internal dan mental";
      if (numScore > 6) return "Sangat aktif bergerak (Sesuaikan dengan Excel)";
      break;
    case 'V': // Vigorous Type
      if (numScore < 5) return "Cenderung pasif";
      if (numScore >= 5 && numScore <= 7) return "Aktif secara fisik, cenderung sportif";
      if (numScore > 7) return "Sangat aktif secara fisik (Sesuaikan dengan Excel)";
      break;
    case 'W': // Need for Rules and Supervision
      if (numScore < 4) return "Berorientasi pada tujuan, mandiri";
      if (numScore >= 4 && numScore <= 5) return "Kebutuhan akan pengarahan dan harapan yang dirumuskan untuknya";
      if (numScore >= 6 && numScore <= 9) return "Meningkatnya orientasi terhadap tugas dan membutuhkan instruksi yang jelas";
      break;
    case 'X': // Need to be Noticed
      if (numScore < 2) return "Cenderung pemalu";
      if (numScore >= 2 && numScore <= 3) return "Rendah hati, tulus";
      if (numScore >= 4 && numScore <= 5) return "Memiliki pola perilaku yang unik";
      if (numScore >= 6 && numScore <= 9) return "Benar-benar membutuhkan perhatian";
      break;
    // ... LANJUTKAN UNTUK ASPEK LAIN (G, L, I, N, P, B, O, Z, K) MENGGUNAKAN POLA YANG SAMA SESUAI FILE EXCEL
    default:
      return "Interpretasi belum tersedia";
  }
  return "Interpretasi belum tersedia";
};

// Anda juga bisa mengekspor mapping nama aslinya jika tetap ingin menampilkannya
export const getPapiTraitName = (trait: string): string => {
    const meanings: Record<string, string> = {
      'G': 'Peran Pekerja Keras', 'L': 'Peran Kepemimpinan', 'I': 'Peran Pembuat Keputusan', 
      'T': 'Peran Sibuk/Kecepatan', 'V': 'Peran Penuh Semangat', 'S': 'Peran Hubungan Sosial',
      'R': 'Peran Teoritis/Pemikir', 'D': 'Peran Bekerja Detail', 'C': 'Peran Terorganisir',
      'E': 'Peran Pengendalian Emosi', 'N': 'Kebutuhan Menyelesaikan Tugas', 'A': 'Kebutuhan Berprestasi',
      'P': 'Kebutuhan Mengontrol Orang Lain', 'X': 'Kebutuhan Diperhatikan', 'B': 'Kebutuhan Diterima Kelompok',
      'O': 'Kebutuhan Kedekatan', 'Z': 'Kebutuhan Berubah', 'K': 'Kebutuhan Agresif/Keras Kepala',
      'F': 'Kebutuhan Mendukung Atasan', 'W': 'Kebutuhan Aturan/Arahan'
    };
    return meanings[trait.toUpperCase()] || `Aspek ${trait}`;
};