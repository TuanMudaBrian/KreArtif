import React, { useState } from "react";
import { Upload, X, Loader, Image as ImageIcon } from "lucide-react";

// --- IMPORT FIREBASE (Hanya Auth & Firestore) ---
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Menerima prop 'onUploadSubmit' (Untuk trigger notifikasi di App.jsx)
const UploadPage = ({ onUploadSubmit }) => {
  // ==========================================
  // KONFIGURASI CLOUDINARY (SUDAH DIISI)
  // ==========================================
  const CLOUD_NAME = "djt8ackaq";
  const UPLOAD_PRESET = "kreartif_upload";
  // ==========================================

  // --- STATE ---
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null); // File asli untuk diupload
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // State Form
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
  });

  // --- HANDLERS ---

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle File Input
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  // Handle Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  // --- FUNGSI UPLOAD GAMBAR KE CLOUDINARY ---
  const uploadToCloudinary = async (fileToUpload) => {
    const data = new FormData();
    data.append("file", fileToUpload);
    data.append("upload_preset", UPLOAD_PRESET);
    data.append("cloud_name", CLOUD_NAME);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: data,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error?.message || "Gagal upload gambar ke Cloudinary"
        );
      }

      return result.secure_url; // Kembalikan URL gambar yang sukses diupload
    } catch (error) {
      console.error("Cloudinary Error:", error);
      throw error;
    }
  };

  // --- HANDLE SUBMIT UTAMA ---
  const handleUpload = async (e) => {
    e.preventDefault();

    // 1. Validasi
    if (!file) return alert("Mohon pilih gambar karya seni Anda!");
    if (!formData.title || !formData.category || !formData.description)
      return alert("Mohon lengkapi semua data!");

    const currentUser = auth.currentUser;
    if (!currentUser) return alert("Anda harus login untuk mengunggah karya.");

    setLoading(true);

    try {
      // 2. Upload Gambar ke Cloudinary
      const imageUrl = await uploadToCloudinary(file);

      // 3. Simpan Data ke Firestore (Database)
      await addDoc(collection(db, "artworks"), {
        // Data Form
        title: formData.title,
        category: formData.category,
        description: formData.description,
        image: imageUrl, // URL dari Cloudinary

        // Info Penulis
        author: currentUser.displayName || "Seniman KreArtif",
        authorId: currentUser.uid,

        // Metadata Sistem
        status: "pending", // Status awal pending (masuk Admin)
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),

        // Fitur Interaksi
        likes: [],
        comments: [],
      });

      // 4. Notifikasi UI
      if (onUploadSubmit) onUploadSubmit(); // Trigger notifikasi di App.jsx

      // 5. Reset Form
      setFile(null);
      setPreview(null);
      setFormData({ title: "", category: "", description: "" });
    } catch (error) {
      console.error("Upload Process Error:", error);
      alert("Gagal mengunggah karya: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8 animate-fade-in">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Unggah Karya Seni
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm">
            Bagikan karya terbaik Anda dengan komunitas KreArtif.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* --- KOLOM KIRI: PREVIEW --- */}
          <div className="lg:col-span-3">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">
                Preview Karya
              </h3>

              <div
                className={`border-2 border-dashed rounded-xl h-[500px] flex flex-col items-center justify-center relative transition-all overflow-hidden
                  ${
                    dragActive
                      ? "border-black bg-gray-50"
                      : "border-gray-300 bg-white"
                  }
                  ${preview ? "border-none p-0" : ""}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {preview ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-contain bg-gray-50 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreview(null);
                        setFile(null);
                      }}
                      className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-red-50 text-gray-600 hover:text-red-500 transition cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Upload size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-medium mb-1">
                      Drag & Drop karya di sini
                    </p>
                    <p className="text-gray-400 text-sm mb-6">
                      atau klik untuk memilih file
                    </p>
                    <label className="cursor-pointer">
                      <span className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition">
                        Pilih File
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-6 text-center">
                      Format: PNG, JPG, JPEG <br /> Ukuran maksimal: 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* --- KOLOM KANAN: FORM --- */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
              <h3 className="font-bold text-gray-900 mb-6 text-sm">
                Informasi Karya
              </h3>

              <form
                onSubmit={handleUpload}
                className="flex-1 flex flex-col gap-5"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    Judul Karya <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Contoh: Sunset di Pantai Selatan"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-3 outline-none"
                  >
                    <option value="">Pilih kategori karya</option>
                    <option value="Lukisan">Lukisan</option>
                    <option value="Digital Art">Digital Art</option>
                    <option value="Fotografi">Fotografi</option>
                    <option value="Ilustrasi">Ilustrasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    Deskripsi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="6"
                    placeholder="Ceritakan tentang karya Anda..."
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-3 outline-none resize-none"
                  ></textarea>
                  <div className="text-right mt-1">
                    <span className="text-xs text-gray-400">
                      {formData.description.length}/500 karakter
                    </span>
                  </div>
                </div>

                <div className="flex-1"></div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full text-white font-bold rounded-lg text-sm px-5 py-3.5 text-center transition flex items-center justify-center gap-2 ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gray-900 hover:bg-black"
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader size={18} className="animate-spin" />{" "}
                        Mengunggah...
                      </>
                    ) : (
                      <>
                        <Upload size={18} /> Unggah Karya
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-3">
                    Dengan mengunggah, Anda menyetujui syarat dan ketentuan
                    KreArtif
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
