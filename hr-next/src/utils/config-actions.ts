"use server";

import fs from "fs";
import path from "path";

// Tentukan path ke file JSON
const configPath = path.join(process.cwd(), "test-config.json");

// Fungsi untuk membaca JSON (Bisa dipanggil langsung dari FE)
export async function getTestConfig() {
  try {
    if (!fs.existsSync(configPath)) {
      return { cfit_sub1: 180, cfit_sub2: 240, cfit_sub3: 180, cfit_sub4: 150, papi: 1800 };
    }
    const fileData = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(fileData);
  } catch (error) {
    console.error("Gagal membaca config:", error);
    return null;
  }
}

// Fungsi untuk menyimpan perubahan ke JSON (Bisa dipanggil langsung dari FE)
export async function saveTestConfig(newValues: any) {
  try {
    const currentConfig = await getTestConfig() || {};
    const updatedConfig = { ...currentConfig, ...newValues };
    
    // Tulis/Timpa file JSON dengan data baru
    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), "utf-8");
    return { success: true };
  } catch (error) {
    console.error("Gagal menyimpan config:", error);
    return { success: false, error: "Gagal menyimpan ke file JSON" };
  }
}