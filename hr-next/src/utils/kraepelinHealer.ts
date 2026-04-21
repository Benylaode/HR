/**
 * Utility untuk memperbaiki dan melengkapi data hasil tes Kraepelin (Auto-Healing).
 * Fungsi ini memastikan data lama yang belum memiliki nilai 'hanker' (Ketahanan) 
 * dapat dihitung secara real-time dari data mentah (raw_answers).
 */

export const healKraepelinSubmission = (sub: any) => {
  // 1. Parsing Score jika masih berupa string JSON dari database
  let scores = sub.scores;
  if (typeof scores === 'string') {
    try {
      scores = JSON.parse(scores);
    } catch (e) {
      scores = {};
    }
  }

  // Hanya proses jika jenis tes adalah Kraepelin
  if (sub.test_type !== 'kraepelin' || !scores) {
    return { ...sub, scores };
  }

  // 2. MAPPING KUNCI (Sinkronisasi Key Backend Lama ke UI Baru)
  if (!scores.panker && scores.kecepatan) scores.panker = scores.kecepatan;
  if (!scores.totalErrors && scores.salah) scores.totalErrors = scores.salah;
  if (!scores.gradeAccuracy && scores.ketelitian) scores.gradeAccuracy = scores.ketelitian;
  if (!scores.gradeSpeed && scores.grade_speed) scores.gradeSpeed = scores.grade_speed;

  // 3. LOGIKA HEALING HANKER (KETAHANAN)
  const isHankerEmpty = !scores.hanker || scores.hanker === '-';
  
  if (isHankerEmpty && sub.raw_answers) {
    try {
      // Normalisasi raw_answers (bisa berupa String JSON, Object, atau Array)
      let raw = typeof sub.raw_answers === 'string' ? JSON.parse(sub.raw_answers) : sub.raw_answers;
      
      let rawDataArray: any[] = [];
      if (Array.isArray(raw)) {
        rawDataArray = raw;
      } else if (raw && typeof raw === 'object') {
        // Jika formatnya objek {"0": 15, "1": 12}, urutkan berdasarkan key
        rawDataArray = Object.keys(raw)
          .sort((a, b) => Number(a) - Number(b))
          .map(k => raw[k]);
      }

      // Ekstrak nilai Benar (y_values)
      const y_values = rawDataArray.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return Number(item.correct || item.benar || 0);
        }
        return Number(item || 0);
      }).filter(v => !isNaN(v));

      // Rumus Regresi Linear: b = (NΣxy - ΣxΣy) / (NΣx² - (Σx)²)
      if (y_values.length > 1) {
        const N = y_values.length;
        let sx = 0, sy = 0, sx2 = 0, sxy = 0;
        
        for (let i = 0; i < N; i++) {
          const x = i + 1;
          const y = y_values[i];
          sx += x; sy += y; sx2 += (x * x); sxy += (x * y);
        }

        const denom = (N * sx2) - (sx * sx);
        const b = denom !== 0 ? ((N * sxy) - (sx * sy)) / denom : 0;
        
        // Nilai Hanker (Multiplier standar 50)
        const hankerVal = Number((b * 50).toFixed(3));
        scores.hanker = hankerVal;

        // Tentukan Kategori Berdasarkan Norma Sarjana
        if (!scores.gradeEndurance || scores.gradeEndurance === '-') {
          if (hankerVal > 2.496) scores.gradeEndurance = "Baik Sekali";
          else if (hankerVal >= 1.015) scores.gradeEndurance = "Baik";
          else if (hankerVal >= -0.468) scores.gradeEndurance = "Sedang";
          else if (hankerVal >= -1.95) scores.gradeEndurance = "Kurang";
          else scores.gradeEndurance = "Kurang Sekali";
        }
      }
    } catch (err) {
      console.error("Gagal melakukan auto-healing Kraepelin:", err);
    }
  }

  // 4. CLEANUP INTERPRETASI (Hapus teks "Stabilitas" yang redundan jika ada)
  if (scores.interpretation && scores.interpretation.includes("Stabilitas:")) {
    scores.interpretation = scores.interpretation.replace(/Stabilitas:.*?,/g, "").trim();
  }

  return { ...sub, scores };
};

/**
 * Fungsi pembungkus untuk memproses banyak submission sekaligus
 */
export const healAllSubmissions = (submissions: any[]) => {
  if (!Array.isArray(submissions)) return [];
  return submissions.map(sub => healKraepelinSubmission(sub));
};