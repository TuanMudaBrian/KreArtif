import React, { useState } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CreditCard,
  Loader,
} from "lucide-react";

// --- IMPORT FIREBASE ---
import { auth, db } from "../firebase"; // Sesuaikan path jika perlu
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
} from "firebase/firestore";

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin, showToast }) => {
  // --- STATE VISIBILITAS PASSWORD ---
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- STATE FORM DATA ---
  const [formData, setFormData] = useState({
    fullName: "",
    nim: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // --- STATE LOADING ---
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Handle Perubahan Input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // --- FUNGSI REGISTER KE FIREBASE ---
  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Validasi Password
    if (formData.password !== formData.confirmPassword) {
      showToast("Password dan Konfirmasi Password tidak cocok!", "error");
      return;
    }

    if (formData.password.length < 6) {
      showToast("Password minimal 6 karakter!", "error");
      return;
    }

    setLoading(true); // Mulai Loading

    try {
      // 2. Buat User di Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // 3. Update Profile (Nama Lengkap) di Auth
      await updateProfile(user, {
        displayName: formData.fullName,
      });

      // 4. Simpan Data Tambahan (NIM, Role) ke Firestore Database
      // Kita buat collection 'users', dengan ID dokumen sama dengan UID user
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: formData.fullName,
        nim: formData.nim,
        email: formData.email,
        role: "user", // Default role
        createdAt: serverTimestamp(),
      });

      // 5. KIRIM NOTIFIKASI SELAMAT DATANG
      // Simpan ke sub-koleksi 'notifications' di dalam dokumen user
      await addDoc(collection(db, "users", user.uid, "notifications"), {
        title: "Selamat Datang!",
        message: `Halo ${formData.fullName}, selamat bergabung di KreArtif. Mulailah mengunggah karyamu!`,
        type: "info", // Tipe icon biru
        isRead: false,
        date: "Baru saja", // Atau gunakan new Date().toLocaleDateString()
        createdAt: serverTimestamp(),
      });

      // 6. Sukses
      showToast("Registrasi Berhasil! Silakan login sekarang.", "success");

      // Reset Form
      setFormData({
        fullName: "",
        nim: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Pindah ke Login
      onSwitchToLogin();
    } catch (error) {
      console.error("Register Error:", error);

      // Handle Error Code Firebase
      let errorMessage = "Terjadi kesalahan saat registrasi.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email sudah terdaftar. Silakan login.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Format email tidak valid.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password terlalu lemah.";
      }

      showToast(errorMessage, "error");
    } finally {
      setLoading(false); // Matikan Loading
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[900px] max-h-[90vh] rounded-2xl shadow-2xl grid md:grid-cols-2 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-gray-100 transition z-20 shadow-sm"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* --- BAGIAN KIRI --- */}
        <div className="hidden md:block relative h-full">
          <img
            src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop"
            alt="Register Art"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-teal-900/90 to-black/40 flex flex-col justify-end p-10 text-white">
            <h2 className="text-3xl font-bold mb-3">
              Mulai Perjalanan Seni Anda
            </h2>
            <p className="text-gray-200 text-sm leading-relaxed opacity-90">
              Bergabunglah dengan komunitas seniman dan pecinta seni di
              KreArtif.
            </p>
          </div>
        </div>

        {/* --- BAGIAN KANAN: FORM --- */}
        <div className="p-8 md:p-10 h-full overflow-y-auto flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Daftar</h2>
            <p className="text-gray-500 text-sm mt-1">
              Buat akun KreArtif Anda
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Nama Lengkap */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Nama Lengkap
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  required
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block pl-9 p-2.5 outline-none"
                />
              </div>
            </div>

            {/* NIM */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                NIM
              </label>
              <div className="relative">
                <CreditCard
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  required
                  type="text" // NIM biasanya angka tapi diperlakukan string agar aman (misal ada 0 di depan)
                  name="nim"
                  value={formData.nim}
                  onChange={handleChange}
                  placeholder="Masukkan NIM"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block pl-9 p-2.5 outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama@email.com"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block pl-9 p-2.5 outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block pl-9 pr-9 p-2.5 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ulangi password"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block pl-9 pr-9 p-2.5 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-start pt-2">
              <input
                required
                id="terms"
                type="checkbox"
                className="w-4 h-4 border border-gray-300 rounded mt-1"
              />
              <label
                htmlFor="terms"
                className="ml-2 text-xs text-gray-500 leading-tight"
              >
                Saya setuju dengan{" "}
                <a href="#" className="font-bold hover:underline text-gray-900">
                  Syarat & Ketentuan
                </a>{" "}
                dan{" "}
                <a href="#" className="font-bold hover:underline text-gray-900">
                  Kebijakan Privasi
                </a>
              </label>
            </div>

            {/* Tombol Submit dengan Loading State */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-bold rounded-lg text-sm px-5 py-3 text-center transition-all mt-4 flex justify-center items-center gap-2
                ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gray-900 hover:bg-black"
                }
              `}
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" /> Mendaftar...
                </>
              ) : (
                "Daftar Sekarang"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Sudah punya akun?{" "}
              <button
                onClick={onSwitchToLogin}
                className="font-bold text-gray-900 hover:underline ml-1"
              >
                Masuk sekarang
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
