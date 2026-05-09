// File: hr-next/src/utils/papiScoring.ts

// Fungsi untuk mengekstrak hanya huruf pertama (A-Z) dari string apapun
export const extractPapiLetter = (trait: string): string => {
  if (!trait) return '';
  // Ambil karakter pertama, hilangkan spasi, dan jadikan huruf besar
  const letter = trait.trim().charAt(0).toUpperCase();
  return letter;
};

export const getPapiInterpretation = (trait: string, score: number | string): string => {
  const numScore = Number(score);
  
  // VALIDASI MUTLAK: Skor PAPI Kostick HANYA berkisar dari 0 sampai 9.
  if (isNaN(numScore) || numScore < 0 || numScore > 9) {
    return "Error: Skor tidak valid (PAPI Kostick hanya memiliki skala 0 - 9). Harap cek perhitungan jawaban di Backend.";
  }

  // FOKUS HANYA PADA HURUF PERTAMA SESUAI KLASIFIKASI EXCEL
  const t = extractPapiLetter(trait);

  switch (t) {
    case 'A':
      if (numScore <= 5) return "Ketidakpastian tujuan, tidak ada usaha lebih";
      if (numScore >= 6 && numScore <= 9) return "Tujuan jelas, kebutuhan sukses dan ambisi tinggi";
      break;
    case 'B':
      if (numScore <= 3) return "Selektif";
      if (numScore >= 4 && numScore <= 5) return "Butuh diterima, tapi tidak mudah dipengaruhi kelompok";
      if (numScore >= 6 && numScore <= 9) return "Butuh disukai dan diakui, mudah dipengaruhi";
      break;
    case 'C':
      if (numScore <= 2) return "Tidak teratur";
      if (numScore >= 3 && numScore <= 5) return "Teratur tetapi tergolong fleksibel";
      if (numScore >= 6 && numScore <= 9) return "Keteraturan tinggi cenderung kaku";
      break;
    case 'D':
      if (numScore <= 3) return "Menyadari kebutuhan akan kecermatan, tetapi tidak berminat bekerja detail";
      if (numScore >= 4 && numScore <= 9) return "Minat tinggi untuk bekerja secara detail";
      break;
    case 'E':
      if (numScore <= 1) return "Terlalu cepat bereaksi, tidak normatif, ekspresi berlebihan";
      if (numScore >= 2 && numScore <= 3) return "Agen bola terka";
      if (numScore >= 4 && numScore <= 6) return "Punya pendekatan emosional seimbang, mampu mengendalikan";
      if (numScore >= 7 && numScore <= 9) return "Sangat normatif, kebutuhan pengendalian diri yang berlebihan, kecenderungan defensif";
      break;
    case 'F':
      if (numScore <= 1) return "Cenderung egois, kemungkinan bisa memberontak";
      if (numScore >= 2 && numScore <= 3) return "Mandiri";
      if (numScore >= 4 && numScore <= 5) return "Setia terhadap otoritas";
      if (numScore >= 6 && numScore <= 9) return "Bersikap setia dan membantu, kemungkinan bantuannya bersifat politis";
      break;
    case 'G':
      if (numScore <= 4) return "Bekerja untuk kesenangan saja, bukan hasil optimal";
      if (numScore >= 5 && numScore <= 9) return "Kemauan bekerja keras tinggi";
      break;
    case 'I':
      if (numScore <= 2) return "Ragu - menolak mengambil keputusan";
      if (numScore >= 3 && numScore <= 4) return "Berhati hati membuat keputusan";
      if (numScore >= 5 && numScore <= 7) return "Lancar dan mudah mengambil keputusan";
      if (numScore >= 8 && numScore <= 9) return "Tidak ragu dalam mengambil keputusan, cenderung terburu-buru";
      break;
    case 'K':
      if (numScore <= 2) return "Menghindari masalah, menolak, mengelak adanya masalah";
      if (numScore >= 3 && numScore <= 4) return "Suka lingkungan yang tenang, menghindari konflik, biasanya menunda penyelesaian konflik";
      if (numScore === 5) return "Keras kepala";
      if (numScore >= 6 && numScore <= 7) return "Menyalurkan agresi personal ke dalam pekerjaan, drive dan persaingan";
      if (numScore >= 8 && numScore <= 9) return "Agresif yang cenderung defensive";
      break;
    case 'L':
      if (numScore <= 4) return "Cenderung tidak secara aktif menggunakan orang lain dalam bekerja";
      if (numScore >= 5 && numScore <= 9) return "Sangat tinggi dimana seseorang memproyeksikan dirinya sebagai pemimpin, ia mencoba menggunakan orang lain untuk mencapai tujuannya";
      break;
    case 'N':
      if (numScore <= 2) return "Komitmen rendah, tapi ada kemungkinan dapat memegang banyak pekerjaan dalam satu waktu";
      if (numScore >= 3 && numScore <= 4) return "Delegator";
      if (numScore >= 5 && numScore <= 6) return "Cukup bertanggung jawab pada pekerjaan";
      if (numScore >= 7 && numScore <= 9) return "Tekun, tanggung jawab tinggi";
      break;
    case 'O':
      if (numScore <= 2) return "Tidak suka hubungan perorangan";
      if (numScore >= 3 && numScore <= 4) return "Sadar akan hubungan perorangan, tapi tidak terlalu tergantung";
      if (numScore >= 5 && numScore <= 9) return "Sangat tergantung, butuh penerimaan diri";
      break;
    case 'P':
      if (numScore <= 4) return "Menurunya keinginan untuk bertanggung jawab pada pekerjaan dan tindakan orang lain";
      if (numScore >= 5 && numScore <= 9) return "Tingkat kebutuhan untuk menerima tanggung jawab orang lain, menjadi orang yang bertanggung jawab";
      break;
    case 'R':
      if (numScore <= 4) return "Bersifat praktis";
      if (numScore >= 5 && numScore <= 9) return "Nilai pendirian tergolong tinggi";
      break;
    case 'S':
      if (numScore <= 5) return "Perhatian rendah terhadap hubungan sosial, kurang percaya pada orang lain";
      if (numScore >= 6 && numScore <= 9) return "Kepercayaan tinggi dalam berhubungan sosial, suka interaksi sosial";
      break;
    case 'T':
      if (numScore <= 3) return "Melakukan segala sesuatu menurut kemauan dan kecepatannya sendiri";
      if (numScore >= 4 && numScore <= 9) return "Tergolong aktif secara internal dan mental";
      break;
    case 'V':
      if (numScore <= 4) return "Cenderung pasif";
      if (numScore >= 5 && numScore <= 9) return "Aktif secara fisik, cenderung sportif";
      break;
    case 'W':
      if (numScore <= 3) return "Berorientasi pada tujuan, mandiri";
      if (numScore >= 4 && numScore <= 5) return "Kebutuhan akan pengarahan dan harapan yang dirumuskan untuknya";
      if (numScore >= 6 && numScore <= 9) return "Meningkatnya orientasi terhadap tugas dan membutuhkan instruksi yang jelas";
      break;
    case 'X':
      if (numScore <= 1) return "Cenderung pemalu";
      if (numScore >= 2 && numScore <= 3) return "Rendah hati, tulus";
      if (numScore >= 4 && numScore <= 5) return "Memiliki pola perilaku yang unik";
      if (numScore >= 6 && numScore <= 9) return "Benar-benar membutuhkan perhatian";
      break;
    case 'Z':
      if (numScore <= 2) return "Tidak suka berubah, tradisional";
      if (numScore >= 3 && numScore <= 4) return "Merenehkan atau mengacuhkan apabila dipaksa berubah";
      if (numScore >= 5 && numScore <= 6) return "Mudah menyesuaikan diri";
      if (numScore === 7) return "Membuat perubahan tertentu, berfikir jauh kedepan";
      if (numScore >= 8 && numScore <= 9) return "Mudah gelisah, frustasi, karena segala sesuatu tidak berjalan dengan cepat, mudah berubah-ubah";
      break;
    default:
      return "Data interpretasi belum diatur.";
  }
  return "Data interpretasi belum diatur.";
};

export const getPapiTraitName = (trait: string): string => {
  const t = extractPapiLetter(trait);
  const meanings: Record<string, string> = {
    'G': 'Peran Pekerja Keras', 'L': 'Peran Kepemimpinan', 'I': 'Peran Pembuat Keputusan', 
    'T': 'Peran Sibuk/Kecepatan', 'V': 'Peran Penuh Semangat', 'S': 'Peran Hubungan Sosial',
    'R': 'Peran Teoritis/Pemikir', 'D': 'Peran Bekerja Detail', 'C': 'Peran Terorganisir',
    'E': 'Peran Pengendalian Emosi', 'N': 'Kebutuhan Menyelesaikan Tugas', 'A': 'Kebutuhan Berprestasi',
    'P': 'Kebutuhan Mengontrol Orang Lain', 'X': 'Kebutuhan Diperhatikan', 'B': 'Kebutuhan Diterima Kelompok',
    'O': 'Kebutuhan Kedekatan', 'Z': 'Kebutuhan Berubah', 'K': 'Kebutuhan Agresif/Keras Kepala',
    'F': 'Kebutuhan Mendukung Atasan', 'W': 'Kebutuhan Aturan/Arahan'
  };
  return meanings[t] || `Aspek ${trait}`;
};