import React, { useState, useEffect } from "react";
import { Info, CheckCircle, XCircle, Loader } from "lucide-react";

// --- IMPORT FIREBASE ---
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  // Hapus orderBy dari import karena kita sort manual
} from "firebase/firestore";

// --- IMPORT KOMPONEN ---
import Navbar from "./components/Navbar";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";

// --- IMPORT HALAMAN ---
import Home from "./pages/Home";
import UploadPage from "./pages/Upload";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

function App() {
  // --- 1. STATE MANAGEMENT ---
  const [currentPage, setCurrentPage] = useState("home");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("user");
  const [appLoading, setAppLoading] = useState(true);

  const [homeArtworks, setHomeArtworks] = useState([]);
  const [pendingArtworks, setPendingArtworks] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Selamat Datang",
      message: "Mulai jelajahi karya seni terbaik!",
      type: "info",
      date: "Baru saja",
      isRead: false,
    },
  ]);

  // --- 2. FUNGSI NOTIFIKASI ---
  const showNotification = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // --- 3. EFFECT: AUTH LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        if (user.email === "admin@kreartif.com") {
          setUserRole("admin");
        } else {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().role === "admin") {
              setUserRole("admin");
            } else {
              setUserRole("user");
            }
          } catch (err) {
            setUserRole("user");
          }
        }
      } else {
        setIsLoggedIn(false);
        setUserRole("user");
        if (["admin", "upload", "profile"].includes(currentPage)) {
          setCurrentPage("home");
        }
      }
      setAppLoading(false);
    });
    return () => unsubscribe();
  }, [currentPage]);

  // --- 4. EFFECT: DATA LISTENER (DIPERBAIKI) ---
  useEffect(() => {
    // A. Listener Home (Approved) - TANPA ORDERBY DI QUERY
    const qHome = query(
      collection(db, "artworks"),
      where("status", "==", "approved")
    );

    const unsubHome = onSnapshot(qHome, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Sorting Manual (Terbaru di atas)
      data.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setHomeArtworks(data);
    });

    // B. Listener Admin (Pending) - TANPA ORDERBY DI QUERY
    const qPending = query(
      collection(db, "artworks"),
      where("status", "==", "pending")
    );

    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Sorting Manual
      data.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setPendingArtworks(data);
    });

    return () => {
      unsubHome();
      unsubPending();
    };
  }, []);

  // --- 5. HANDLERS ---
  const openRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };
  const openLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const handleLoginSuccess = (role) => {
    setIsLoginOpen(false);
    if (role === "admin") {
      setCurrentPage("admin");
      showNotification("Selamat Datang, Admin!", "success");
    } else {
      showNotification("Login Berhasil!", "success");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification("Anda telah logout.", "info");
    } catch (error) {
      console.error(error);
    }
  };

  const handleNavigate = (targetPage) => {
    const protectedPages = ["upload", "profile"];
    if (protectedPages.includes(targetPage) && !isLoggedIn) {
      showNotification("Silakan login untuk mengakses fitur ini!", "error");
      setIsLoginOpen(true);
      return;
    }
    setCurrentPage(targetPage);
    if (targetPage !== "home") setSearchQuery("");
  };

  const requireLoginAction = (message) => {
    const alertMsg = message || "Silakan login untuk mengakses fitur ini!";
    showNotification(alertMsg, "error");
    setIsLoginOpen(true);
  };

  // --- 6. LOGIKA DATA ---
  const handleUserUpload = () => {
    setCurrentPage("home");
    showNotification("Upload Berhasil! Menunggu verifikasi Admin.", "success");
  };

  const handleAdminApprove = async (id) => {
    try {
      const artRef = doc(db, "artworks", id);
      await updateDoc(artRef, { status: "approved" });
    } catch (error) {
      console.error(error);
      showNotification("Gagal menyetujui.", "error");
    }
  };

  const handleAdminReject = async (id) => {
    try {
      const artRef = doc(db, "artworks", id);
      await updateDoc(artRef, { status: "rejected" });
    } catch (error) {
      console.error(error);
      showNotification("Gagal menolak.", "error");
    }
  };

  // --- 7. RENDER ---
  if (appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader className="animate-spin text-gray-400" size={40} />
      </div>
    );
  }

  const renderPage = () => {
    if (currentPage === "admin") {
      if (userRole !== "admin")
        return (
          <Home
            searchQuery={searchQuery}
            data={homeArtworks}
            isLoggedIn={isLoggedIn}
            onRequireLogin={requireLoginAction}
          />
        );
      return (
        <Admin
          onLogout={handleLogout}
          pendingData={pendingArtworks}
          onApprove={handleAdminApprove}
          onReject={handleAdminReject}
        />
      );
    }
    switch (currentPage) {
      case "home":
        return (
          <Home
            searchQuery={searchQuery}
            data={homeArtworks}
            isLoggedIn={isLoggedIn}
            onRequireLogin={requireLoginAction}
          />
        );
      case "upload":
        return <UploadPage onUploadSubmit={handleUserUpload} />;
      case "profile":
        return <Profile onNavigate={handleNavigate} />;
      default:
        return (
          <Home
            searchQuery={searchQuery}
            data={homeArtworks}
            isLoggedIn={isLoggedIn}
            onRequireLogin={requireLoginAction}
          />
        );
    }
  };

  const getToastStyle = (type) =>
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-500"
      : "bg-gray-800";
  const getToastIcon = (type) =>
    type === "success" ? (
      <CheckCircle size={20} />
    ) : type === "error" ? (
      <XCircle size={20} />
    ) : (
      <Info size={20} />
    );

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans relative">
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] animate-bounce-in">
          <div
            className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-white/20 text-white ${getToastStyle(
              toast.type
            )}`}
          >
            {getToastIcon(toast.type)}
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {currentPage !== "admin" && (
        <Navbar
          onLoginClick={() => setIsLoginOpen(true)}
          onNavigate={handleNavigate}
          activePage={currentPage}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          notifications={notifications}
          onReadNotifications={markNotificationsAsRead}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
        />
      )}

      {renderPage()}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={openRegister}
        onLoginSuccess={handleLoginSuccess}
      />
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={openLogin}
        showToast={showNotification}
      />
    </div>
  );
}

export default App;
