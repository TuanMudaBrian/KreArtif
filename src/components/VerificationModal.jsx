import React from "react";
import { X, CheckCircle, XCircle, User, Calendar, Tag } from "lucide-react";

const VerificationModal = ({ artwork, onClose, onApprove, onReject }) => {
  if (!artwork) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      {/* Container Modal */}
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden relative flex flex-col md:flex-row h-[90vh] md:h-auto">
        {/* Header Mobile Only (Agar ada tombol close di HP) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition md:hidden"
        >
          <X size={20} />
        </button>

        {/* --- BAGIAN KIRI: GAMBAR & INFO USER --- */}
        <div className="w-full md:w-[45%] bg-gray-50 p-6 flex flex-col h-full overflow-y-auto">
          {/* Judul Modal (Mobile Hidden) */}
          <h2 className="text-lg font-bold text-gray-900 mb-4 md:hidden">
            Verifikasi Karya
          </h2>

          {/* Gambar Karya */}
          <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200 mb-6 bg-white">
            <img
              src={artwork.image}
              alt={artwork.title}
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Info Artist */}
          <div className="bg-white p-4 rounded-lg border border-gray-100 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <User size={16} className="text-gray-400" />
              <span>
                Artis:{" "}
                <span className="font-semibold text-gray-900">
                  {artwork.author}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar size={16} className="text-gray-400" />
              <span>
                Tanggal Upload:{" "}
                <span className="font-semibold text-gray-900">
                  {artwork.date}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Tag size={16} className="text-gray-400" />
              <span>
                Kategori:{" "}
                <span className="font-semibold text-gray-900">
                  {artwork.category}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* --- BAGIAN KANAN: FORM & AKSI --- */}
        <div className="w-full md:w-[55%] p-8 flex flex-col h-full overflow-y-auto">
          {/* Header Desktop */}
          <div className="hidden md:flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Verifikasi Karya
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form Read-Only */}
          <div className="space-y-5 mb-6">
            {/* Judul */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                Judul Karya
              </label>
              <div className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900">
                {artwork.title}
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                Deskripsi Karya
              </label>
              <div className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900 min-h-[100px] leading-relaxed">
                {/* Deskripsi dummy jika data tidak ada */}
                {artwork.description ||
                  "Lukisan pemandangan yang menggambarkan keindahan alam dengan teknik pencahayaan yang dramatis. Karya ini menonjolkan gradasi warna yang halus."}
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                Kategori Karya
              </label>
              <div className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-900">
                {artwork.category}
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Panduan Verifikasi (Kotak Biru) */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <h4 className="text-blue-800 font-bold text-sm mb-2">
              Panduan Verifikasi
            </h4>
            <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
              <li>Pastikan karya sesuai dengan kategori yang dipilih</li>
              <li>Periksa kualitas gambar dan konten karya</li>
              <li>Tolak jika melanggar kebijakan konten KreArtif</li>
              <li>Berikan alasan jelas jika menolak karya</li>
            </ul>
          </div>

          {/* Tombol Aksi */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => onReject(artwork.id)}
              className="flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-lg text-sm font-bold transition"
            >
              <XCircle size={18} /> Tolak
            </button>
            <button
              onClick={() => onApprove(artwork.id)}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg text-sm font-bold transition shadow-sm"
            >
              <CheckCircle size={18} /> Setujui
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
