import React, { useState } from "react";
import { X, Heart, Send, User } from "lucide-react";

// Menerima props: artwork (data), onClose, onToggleLike, onAddComment
const DetailModal = ({ artwork, onClose, onToggleLike, onAddComment }) => {
  // State lokal untuk menampung teks komentar yang sedang diketik
  const [commentText, setCommentText] = useState("");

  // Jika tidak ada data artwork, jangan tampilkan apa-apa
  if (!artwork) return null;

  const comments = artwork.comments || [];

  // Ambil tahun dari string tanggal (Misal: "14 Nov 2025" -> "2025")
  // Jika format tanggal tidak standar, gunakan tahun sekarang sebagai fallback
  const year = artwork.date
    ? artwork.date.split(" ").pop()
    : new Date().getFullYear();

  // Fungsi saat tombol Kirim ditekan
  const handleSend = () => {
    // Cek jika teks kosong atau cuma spasi
    if (commentText.trim() === "") return;

    // Panggil fungsi dari Parent (Home.jsx) untuk simpan ke database
    onAddComment(artwork.id, commentText);

    // Kosongkan textarea setelah kirim
    setCommentText("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      {/* Container Modal */}
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
        {/* --- BAGIAN KIRI: GAMBAR --- */}
        <div className="w-full md:w-[55%] bg-gray-50 relative flex items-center justify-center p-6">
          {/* Tombol Close */}
          <button
            onClick={onClose}
            className="absolute top-6 left-6 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition z-10"
          >
            <X size={20} className="text-gray-600" />
          </button>

          {/* Gambar Utama */}
          <img
            src={artwork.image}
            alt={artwork.title}
            className="w-full h-full object-contain drop-shadow-lg"
          />

          {/* Tombol Like Besar di Gambar */}
          <button
            onClick={() => onToggleLike(artwork.id)}
            className="absolute bottom-6 right-6 p-3 bg-white rounded-full shadow-md hover:bg-red-50 transition group cursor-pointer"
          >
            <Heart
              size={24}
              className={`transition ${
                artwork.isLiked
                  ? "text-red-500 fill-red-500"
                  : "text-gray-400 group-hover:text-red-500"
              }`}
            />
          </button>
        </div>

        {/* --- BAGIAN KANAN: INFO & KOMENTAR --- */}
        <div className="w-full md:w-[45%] flex flex-col h-full bg-white">
          <div className="overflow-y-auto p-8 custom-scrollbar h-full">
            {/* Judul Karya */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {artwork.title}
            </h2>

            {/* Info Seniman */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {/* Tampilkan inisial jika ada, atau icon User */}
                {artwork.author ? (
                  <span className="font-bold text-gray-600">
                    {artwork.author.charAt(0)}
                  </span>
                ) : (
                  <User size={20} className="text-gray-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {artwork.author}
                </p>
                <p className="text-xs text-gray-500">Seniman</p>
              </div>
            </div>

            {/* Deskripsi */}
            <p className="text-sm text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap">
              {artwork.description || "Tidak ada deskripsi untuk karya ini."}
            </p>

            {/* Statistik Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 border-b border-gray-100 pb-8">
              <div>
                <p className="text-xs text-gray-400 mb-1">Kategori</p>
                <p className="text-sm font-semibold text-gray-900">
                  {artwork.category}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Tahun</p>
                {/* Tahun diambil dari data tanggal */}
                <p className="text-sm font-semibold text-gray-900">{year}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Suka</p>
                {/* Hitung jumlah array likes */}
                <p className="text-sm font-semibold text-gray-900">
                  {artwork.likes ? artwork.likes.length : 0} orang
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Dilihat</p>
                {/* Tampilkan data views */}
                <p className="text-sm font-semibold text-gray-900">
                  {artwork.views ? artwork.views : 0}x
                </p>
              </div>
            </div>

            {/* --- Bagian Komentar --- */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-semibold text-gray-900">
                  Komentar ({comments.length})
                </h3>
              </div>

              {/* Input Komentar */}
              <div className="flex gap-3 mb-6">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center">
                  <User size={16} className="text-gray-400" />
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={commentText} // Hubungkan dengan state
                    onChange={(e) => setCommentText(e.target.value)} // Update state saat mengetik
                    placeholder="Tulis komentar..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none h-24"
                  ></textarea>

                  {/* Tombol Kirim */}
                  <button
                    onClick={handleSend} // Panggil fungsi kirim
                    className="absolute bottom-2 right-2 bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Send size={12} /> Kirim
                  </button>
                </div>
              </div>

              {/* Daftar Komentar */}
              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <div
                      key={index} // Gunakan index sebagai key jika ID tidak unik
                      className="flex gap-3 bg-gray-50 p-3 rounded-lg animate-fade-in"
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center border border-white">
                        <span className="text-xs font-bold text-gray-600">
                          {comment.initial || "U"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          {comment.user}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic text-center py-4">
                    Belum ada komentar. Jadilah yang pertama!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
