import React from "react";
import { X, User, Calendar, Tag, AlertCircle, CheckCircle } from "lucide-react";

const DetailAdminModal = ({ artwork, onClose }) => {
  if (!artwork) return null;

  // Cek apakah ini karya ditolak (punya properti reason)
  const isRejected = artwork.reason ? true : false;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      {/* Container Modal */}
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden relative flex flex-col md:flex-row h-[90vh] md:h-auto">
        {/* Tombol Close Mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition md:hidden"
        >
          <X size={20} />
        </button>

        {/* --- KIRI: GAMBAR --- */}
        <div className="w-full md:w-[45%] bg-gray-50 p-6 flex flex-col h-full overflow-y-auto justify-center items-center relative">
          {/* Badge Status di atas Gambar */}
          <div className="absolute top-6 left-6 z-10">
            {isRejected ? (
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 flex items-center gap-1 shadow-sm">
                <AlertCircle size={14} /> Ditolak
              </span>
            ) : (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1 shadow-sm">
                <CheckCircle size={14} /> Diterima
              </span>
            )}
          </div>

          <div className="rounded-lg overflow-hidden shadow-md border border-gray-200 bg-white">
            <img
              src={artwork.image}
              alt={artwork.title}
              className="w-full h-auto object-contain max-h-[400px]"
            />
          </div>
        </div>

        {/* --- KANAN: INFORMASI --- */}
        <div className="w-full md:w-[55%] p-8 flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="hidden md:flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Detail Karya</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition bg-gray-100 p-2 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          {/* Info Utama */}
          <div className="space-y-6">
            {/* Judul & Artis */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {artwork.title}
              </h1>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <User size={16} className="text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {artwork.author}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Calendar size={16} className="text-gray-400" />
                  <span>{artwork.date}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Tag size={16} className="text-gray-400" />
                  <span>{artwork.category}</span>
                </div>
              </div>
            </div>

            {/* Jika Ditolak, Tampilkan Alasan */}
            {isRejected && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle
                  className="text-red-600 mt-0.5 shrink-0"
                  size={20}
                />
                <div>
                  <h4 className="text-sm font-bold text-red-800 mb-1">
                    Alasan Penolakan
                  </h4>
                  <p className="text-sm text-red-700 leading-relaxed">
                    {artwork.reason}
                  </p>
                </div>
              </div>
            )}

            {/* Deskripsi */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">
                Deskripsi
              </label>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {artwork.description ||
                  "Tidak ada deskripsi yang tersedia untuk karya ini."}
              </p>
            </div>
          </div>

          <div className="flex-1"></div>

          {/* Footer Action */}
          <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold transition shadow-md"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailAdminModal;
