import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  User,
  LogOut,
  Bell,
  CheckCircle, // Icon Sukses
  XCircle, // Icon Gagal/Ditolak
  Info, // Icon Info
} from "lucide-react";

// --- IMPORT FIREBASE ---
import { auth, db } from "../firebase"; // Pastikan path firebase benar
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

const Navbar = ({
  onLoginClick,
  onNavigate,
  activePage,
  isLoggedIn,
  onLogout,
  // Kita tidak perlu lagi props 'notifications' dari parent
  // karena Navbar akan mengambil datanya sendiri agar lebih mandiri
  searchQuery,
  onSearch,
}) => {
  // --- STATE ---
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]); // State lokal untuk notifikasi
  const notifRef = useRef(null);

  // Ambil Nama User
  const userName = auth.currentUser?.displayName || "User";

  // --- EFFECT: REAL-TIME NOTIFIKASI ---
  useEffect(() => {
    const user = auth.currentUser;

    if (user && isLoggedIn) {
      // Referensi ke: users -> [UID] -> notifications
      const notifRef = collection(db, "users", user.uid, "notifications");

      // Urutkan dari yang terbaru
      const q = query(notifRef, orderBy("createdAt", "desc"));

      // Listener Real-time
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notifs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setNotifications(notifs);
        },
        (error) => {
          console.error("Gagal ambil notifikasi:", error);
        }
      );

      return () => unsubscribe();
    } else {
      setNotifications([]);
    }
  }, [isLoggedIn]); // Jalankan ulang jika status login berubah

  // Hitung notifikasi belum dibaca
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // --- HELPER: MARK AS READ ---
  const handleMarkAsRead = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Cari notifikasi yang belum dibaca dan update statusnya di Firebase
    const unreadNotifs = notifications.filter((n) => !n.isRead);

    unreadNotifs.forEach(async (notif) => {
      try {
        const docRef = doc(db, "users", user.uid, "notifications", notif.id);
        await updateDoc(docRef, { isRead: true });
      } catch (e) {
        console.error("Error update read status:", e);
      }
    });
  };

  // --- UI LOGIC ---
  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle Notifikasi
  const toggleNotif = () => {
    if (!showNotif && unreadCount > 0) {
      handleMarkAsRead(); // Tandai sudah dibaca saat dibuka
    }
    setShowNotif(!showNotif);
  };

  const getLinkClass = (pageName) => {
    const baseClass = "transition cursor-pointer";
    if (activePage === pageName) return `${baseClass} text-black font-bold`;
    return `${baseClass} text-gray-500 hover:text-black`;
  };

  // --- RENDER ICON BERDASARKAN TIPE ---
  const renderIcon = (type) => {
    if (type === "success" || type === "approved") {
      return <CheckCircle size={18} className="text-green-600" />;
    }
    if (type === "failure" || type === "rejected" || type === "error") {
      return <XCircle size={18} className="text-red-500" />;
    }
    return <Info size={18} className="text-blue-500" />;
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white sticky top-0 z-50 border-b border-gray-100 transition-all">
      {/* --- KIRI --- */}
      <div className="flex items-center gap-10">
        <div
          onClick={() => onNavigate("home")}
          className="text-2xl font-bold text-black tracking-tight cursor-pointer"
        >
          KreArtif
        </div>

        <ul className="hidden md:flex gap-8 text-sm font-medium">
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("home");
              }}
              className={getLinkClass("home")}
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("upload");
              }}
              className={getLinkClass("upload")}
            >
              Unggah Karya
            </a>
          </li>
          {isLoggedIn && (
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("profile");
                }}
                className={getLinkClass("profile")}
              >
                Profile
              </a>
            </li>
          )}
        </ul>
      </div>

      {/* --- KANAN --- */}
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Cari karya seni..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="bg-gray-100 text-sm rounded-lg py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
          />
        </div>

        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            {/* --- ICON NOTIFIKASI --- */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={toggleNotif}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition relative outline-none"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>

              {/* --- DROPDOWN NOTIFIKASI --- */}
              {showNotif && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h4 className="font-bold text-sm text-gray-900">
                      Notifikasi
                    </h4>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} Baru
                      </span>
                    )}
                  </div>

                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${
                            !notif.isRead ? "bg-blue-50/30" : ""
                          }`}
                        >
                          <div className="flex gap-3 items-start">
                            {/* Icon Status */}
                            <div className="mt-1 shrink-0 bg-white p-1 rounded-full shadow-sm border border-gray-100">
                              {renderIcon(notif.type)}
                            </div>

                            {/* Konten Text */}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm ${
                                  !notif.isRead
                                    ? "font-bold text-gray-900"
                                    : "font-medium text-gray-800"
                                }`}
                              >
                                {notif.title || "Info Baru"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed break-words">
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-2">
                                {notif.createdAt?.toDate
                                  ? notif.createdAt
                                      .toDate()
                                      .toLocaleString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                  : notif.date || "Baru saja"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                        <Bell size={24} className="mb-2 opacity-20" />
                        <span>Belum ada notifikasi.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* --- PROFIL --- */}
            <button
              onClick={() => onNavigate("profile")}
              className={`flex items-center gap-2 border px-2 pr-4 py-1.5 rounded-full transition cursor-pointer 
                 ${
                   activePage === "profile"
                     ? "border-black bg-gray-50"
                     : "border-gray-200 hover:bg-gray-50"
                 }`}
            >
              <div className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center overflow-hidden">
                {/* Jika user punya foto profil, tampilkan. Jika tidak, pakai icon default */}
                {auth.currentUser?.photoURL ? (
                  <img
                    src={auth.currentUser.photoURL}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={14} />
                )}
              </div>
              <span className="text-sm font-semibold text-gray-700 truncate max-w-[100px]">
                {userName}
              </span>
            </button>

            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
              title="Keluar"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="border border-gray-300 px-5 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-black transition cursor-pointer active:scale-95"
          >
            Log In
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
