"use client";

import { useEffect, useState } from "react";

type Manpower = {
  id: number;
  position_title: string;
  level: string;
  grade: string;
  department: string;
};

interface HireModalProps {
  candidateId: string;
  candidateName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function HireCandidateModal({ candidateId, candidateName, isOpen, onClose, onSuccess }: HireModalProps) {
  const [manpowerList, setManpowerList] = useState<Manpower[]>([]);
  const [selectedManpower, setSelectedManpower] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadVacantManpower();
    }
  }, [isOpen]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const loadVacantManpower = async () => {
    try {
    const res = await fetch(`${API_URL}/employees`, {
        method: "GET",
        headers: {
        "Content-Type": "application/json",}
    });
    if (!res.ok) {
        throw new Error("Gagal mengambil data");
    }
    const data = await res.json();
      setManpowerList(data);
    } catch (error) {
      console.error("Gagal mengambil data manpower kosong:", error);
    }
  };


  const handleHire = async () => {
    if (!selectedManpower) {
      alert("Pilih slot Manpower terlebih dahulu!");
      return;
    }

    setIsLoading(true);
    try {
      // Endpoint Flask Anda untuk update stage trackin

    try {
    const res = await fetch(`${API_URL}/api/update-stage`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        application_id: candidateId,
        new_stage: "Hired",
        manpower_id: selectedManpower,
        notes: "Diterima dan dialokasikan ke Manpower Plan",
        actor_name: "HR Admin",
        }),
    });

    if (!res.ok) {
        throw new Error("Gagal update stage");
    }

    const data = await res.json();
    console.log("Success:", data);

    } catch (error) {
    console.error("Error:", error);
    }

      alert("Kandidat berhasil diterima dan menempati slot Manpower!");
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || "Terjadi kesalahan saat menyimpan");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold mb-2">Terima Kandidat</h3>
        <p className="text-gray-600 mb-4 text-sm">
          Anda akan menerima <b>{candidateName}</b>. Silakan pilih formasi kosong yang akan ditempati.
        </p>
        
        <select 
          value={selectedManpower} 
          onChange={(e) => setSelectedManpower(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none mb-6"
        >
          <option value="">-- Pilih Posisi Kosong --</option>
          {manpowerList.map((slot) => (
             <option key={slot.id} value={slot.id}>
               {slot.position_title} ({slot.level}) - Dept: {slot.department}
             </option>
          ))}
        </select>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Batal
          </button>
          <button 
            onClick={handleHire} 
            disabled={isLoading}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Menyimpan..." : "Konfirmasi & Terima"}
          </button>
        </div>
      </div>
    </div>
  );
}