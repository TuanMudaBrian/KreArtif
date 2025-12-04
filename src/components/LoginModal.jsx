import React, { useState } from "react";
import { X, Mail, Lock, Eye, EyeOff, Facebook, Loader } from "lucide-react";

// --- IMPORT FIREBASE ---
import { auth, db } from "../firebase"; // Sesuaikan path firebase.js
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const LoginModal = ({
  isOpen,
  onClose,
  onSwitchToRegister,
  onLoginSuccess,
}) => {
  // State Input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // State UI
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Login ke Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2. Cek Role di Firestore (Opsional: Jika Anda menyimpan role di database)
      // Jika tidak menggunakan role di database, bisa skip langkah ini dan langsung anggap user biasa
      // atau gunakan logika hardcode email admin seperti sebelumnya.

      let role = "user"; // Default role

      // Cek Hardcode Admin (Cara Cepat & Aman untuk Prototype)
      if (email === "admin@kreartif.com") {
        role = "admin";
      } else {
        // Cek Database (Cara Ideal untuk Production)
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === "admin") role = "admin";
        }
      }

      // 3. Panggil Fungsi Sukses di App.jsx
      onLoginSuccess(role);

      // Reset Form
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Login Error:", error);

      // Handle Pesan Error
      let errorMessage = "Login Gagal. Periksa kembali email dan password.";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        errorMessage = "Email atau password salah.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Terlalu banyak percobaan. Coba lagi nanti.";
      }

      // Tampilkan Alert (Atau gunakan ShowToast jika dipassing propsnya)
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[900px] rounded-2xl overflow-hidden shadow-2xl grid md:grid-cols-2 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition z-10"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* --- BAGIAN KIRI --- */}
        <div className="hidden md:block relative h-full">
          <img
            src="https://images.unsplash.com/photo-1561214115-f2f134cc4912?q=80&w=1000&auto=format&fit=crop"
            alt="Art Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-10 text-white">
            <h2 className="text-3xl font-bold mb-3">Selamat Datang</h2>
            <p className="text-gray-200 text-sm leading-relaxed opacity-90">
              Platform pameran seni digital yang menghubungkan seniman dengan
              pecinta seni.
            </p>
          </div>
        </div>

        {/* --- BAGIAN KANAN --- */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Masuk</h2>
            <p className="text-gray-500 text-sm mt-1">
              Masuk ke akun KreArtif Anda
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  required
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block pl-10 p-3 outline-none transition"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block pl-10 pr-10 p-3 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 border border-gray-300 rounded text-black focus:ring-0"
                />
                <span className="ml-2 text-gray-500">Ingat saya</span>
              </label>
              <a href="#" className="font-medium text-gray-900 hover:underline">
                Lupa password?
              </a>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-bold rounded-lg text-sm px-5 py-3 text-center transition-all flex justify-center items-center gap-2
                ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gray-900 hover:bg-black"
                }
              `}
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" /> Masuk...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Social Login */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                atau masuk dengan
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700">
              <svg
                className="w-4 h-4"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 18 19"
              >
                <path
                  fillRule="evenodd"
                  d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.464 8.464 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9V8h8.34c.066.543.095 1.09.088 1.636-.086 5.053-3.463 8.449-8.4 8.449l-.186-.002Z"
                  clipRule="evenodd"
                />
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700">
              <Facebook size={18} className="text-blue-600" />
              Facebook
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Belum punya akun?{" "}
            <button
              onClick={onSwitchToRegister}
              className="font-bold text-gray-900 hover:underline ml-1"
            >
              Daftar sekarang
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
