import React, { useState, useEffect } from "react";
import {
  LogOut,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Info,
  AlertCircle,
  HelpCircle,
  Loader,
} from "lucide-react";

// --- IMPORT KOMPONEN MODAL ---
import VerificationModal from "../components/VerificationModal";
import DetailAdminModal from "../components/DetailAdminModal";

// --- IMPORT FIREBASE ---
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc, // WAJIB ADA: Untuk nulis notifikasi
  serverTimestamp, // WAJIB ADA: Untuk waktu notifikasi
} from "firebase/firestore";

const Admin = ({ onLogout }) => {
  // --- STATE UI ---
  const [activeTab, setActiveTab] = useState("verifikasi");
  const [loading, setLoading] = useState(true);

  // --- STATE DATA ---
  const [pendingArtworks, setPendingArtworks] = useState([]);
  const [approvedArtworks, setApprovedArtworks] = useState([]);
  const [rejectedArtworks, setRejectedArtworks] = useState([]);
  const [deletedArtworks, setDeletedArtworks] = useState([]);

  // --- STATE MODAL ---
  const [verifyingArtwork, setVerifyingArtwork] = useState(null);
  const [viewingArtwork, setViewingArtwork] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [itemToReject, setItemToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [itemToApprove, setItemToApprove] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);

  // --- EFFECT: FETCH DATA ---
  useEffect(() => {
    setLoading(true);

    // Listener Pending
    const qPending = query(
      collection(db, "artworks"),
      where("status", "==", "pending")
    );
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      setPendingArtworks(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setLoading(false);
    });

    // Listener Lainnya...
    const unsubApproved = onSnapshot(
      query(collection(db, "artworks"), where("status", "==", "approved")),
      (snap) => {
        setApprovedArtworks(
          snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    );
    const unsubRejected = onSnapshot(
      query(collection(db, "artworks"), where("status", "==", "rejected")),
      (snap) => {
        setRejectedArtworks(
          snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    );
    const unsubDeleted = onSnapshot(
      query(collection(db, "artworks"), where("status", "==", "deleted")),
      (snap) => {
        setDeletedArtworks(
          snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    );

    return () => {
      unsubPending();
      unsubApproved();
      unsubRejected();
      unsubDeleted();
    };
  }, []);

  // --- HELPER NOTIFIKASI TOAST (Untuk Admin) ---
  const showNotification = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const getRejectingItemData = () =>
    pendingArtworks.find((i) => i.id === itemToReject);

  // ============================================================
  //  FUNGSI KIRIM NOTIFIKASI KE USER (DATABASE)
  // ============================================================
  const sendUserNotification = async (userId, title, message, type) => {
    if (!userId) return; // Cegah error jika karya lama tidak punya ID User
    try {
      await addDoc(collection(db, "users", userId, "notifications"), {
        title: title,
        message: message,
        type: type, // 'success' | 'error' | 'info'
        isRead: false,
        date: "Baru saja",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Gagal kirim notif ke user:", error);
    }
  };

  // --- LOGIKA AKSI DATABASE ---

  // 1. APPROVE (TERIMA)
  const initiateApprove = (id) => {
    setItemToApprove(id);
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    try {
      // Ambil data karya DULUAN sebelum statusnya berubah
      const artwork = pendingArtworks.find((a) => a.id === itemToApprove);

      const artRef = doc(db, "artworks", itemToApprove);
      await updateDoc(artRef, { status: "approved" });

      // KIRIM NOTIFIKASI: DITERIMA
      if (artwork && artwork.authorId) {
        await sendUserNotification(
          artwork.authorId,
          "Karya Diterima 🎉",
          `Selamat! Karya Anda "${artwork.title}" telah disetujui Admin.`,
          "success"
        );
      }

      showNotification("Karya berhasil disetujui!", "success");
      setVerifyingArtwork(null);
      setShowApproveModal(false);
      setItemToApprove(null);
    } catch (error) {
      console.error("Error approving:", error);
    }
  };

  // 2. REJECT (TOLAK)
  const initiateReject = (id) => {
    setItemToReject(id);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      showNotification("Wajib mengisi alasan!", "error");
      return;
    }

    try {
      const artwork = pendingArtworks.find((a) => a.id === itemToReject);

      const artRef = doc(db, "artworks", itemToReject);
      await updateDoc(artRef, { status: "rejected", reason: rejectReason });

      // KIRIM NOTIFIKASI: DITOLAK
      if (artwork && artwork.authorId) {
        await sendUserNotification(
          artwork.authorId,
          "Karya Ditolak 😔",
          `Maaf, karya "${artwork.title}" ditolak. Alasan: ${rejectReason}`,
          "error"
        );
      }

      showNotification("Karya telah ditolak.", "success");
      setVerifyingArtwork(null);
      setShowRejectModal(false);
      setItemToReject(null);
      setRejectReason("");
    } catch (error) {
      console.error("Error rejecting:", error);
    }
  };

  // 3. DELETE (HAPUS)
  const initiateDelete = (id, listType) => {
    setItemToDelete(id);
    setDeleteType(listType);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      // Cari data artwork dari list yang sesuai
      let artwork = null;
      if (deleteType === "approved")
        artwork = approvedArtworks.find((a) => a.id === itemToDelete);
      else if (deleteType === "rejected")
        artwork = rejectedArtworks.find((a) => a.id === itemToDelete);
      else if (deleteType === "deleted")
        artwork = deletedArtworks.find((a) => a.id === itemToDelete);

      const isPermanentlyDeleting = deleteType === "deleted";

      if (isPermanentlyDeleting) {
        await deleteDoc(doc(db, "artworks", itemToDelete));
        showNotification("Data dihapus permanen.", "success");
      } else {
        const artRef = doc(db, "artworks", itemToDelete);
        await updateDoc(artRef, { status: "deleted" });

        // KIRIM NOTIFIKASI: DIHAPUS
        if (artwork && artwork.authorId) {
          await sendUserNotification(
            artwork.authorId,
            "Karya Dihapus 🗑️",
            `Karya Anda "${artwork.title}" telah dihapus oleh Admin.`,
            "error"
          );
        }
        showNotification("Karya dipindahkan ke sampah.", "success");
      }

      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeleteType(null);
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  // Statistik
  const allArtworks = [
    ...pendingArtworks,
    ...approvedArtworks,
    ...rejectedArtworks,
    ...deletedArtworks,
  ];
  const countCategory = (cat) =>
    allArtworks.filter((a) => a.category === cat).length;

  const categoryStats = [
    { label: "Lukisan", count: countCategory("Lukisan"), color: "bg-blue-500" },
    {
      label: "Digital Art",
      count: countCategory("Digital Art"),
      color: "bg-purple-500",
    },
    {
      label: "Fotografi",
      count: countCategory("Fotografi"),
      color: "bg-green-500",
    },
    {
      label: "Ilustrasi",
      count: countCategory("Ilustrasi"),
      color: "bg-orange-500",
    },
  ];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="animate-spin text-gray-400" size={32} />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans relative">
      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] animate-bounce-in">
          <div
            className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-white/20 text-white ${
              toast.type === "success" ? "bg-green-600" : "bg-red-500"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <Info size={20} />
            )}
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">
            K
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">
            KreArtif Admin
          </span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition"
        >
          <LogOut size={16} /> LogOut
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex gap-4 mb-8 border-b border-gray-200 pb-1">
          <button
            onClick={() => setActiveTab("verifikasi")}
            className={`px-6 py-2.5 rounded-t-lg text-sm font-bold transition relative top-[1px] ${
              activeTab === "verifikasi"
                ? "bg-white text-gray-900 border border-gray-200 border-b-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Verifikasi Karya
          </button>
          <button
            onClick={() => setActiveTab("kelola")}
            className={`px-6 py-2.5 rounded-t-lg text-sm font-bold transition relative top-[1px] ${
              activeTab === "kelola"
                ? "bg-white text-gray-900 border border-gray-200 border-b-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Kelola Karya
          </button>
        </div>

        {activeTab === "verifikasi" ? (
          <>
            {/* STATISTIK */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              {/* Tabel Kiri */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
                <h3 className="font-bold text-gray-800 mb-6">
                  Data Banyak Karya Berdasarkan Kategori
                </h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-200 p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div>Kategori</div>
                    <div className="text-right">Total</div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {categoryStats.map((stat, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-2 p-4 hover:bg-gray-50 transition items-center"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-3 h-3 rounded-full ${stat.color}`}
                          ></span>
                          <span className="text-sm font-semibold text-gray-700">
                            {stat.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900">
                            {stat.count}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">
                            karya
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Statistik Kanan */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
                <h3 className="font-bold text-gray-800 mb-6">
                  Status Verifikasi Hari Ini
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-green-50 border border-green-100 p-4 rounded-xl">
                    <div className="flex items-center gap-3 text-green-700">
                      <CheckCircle size={20} />
                      <span className="text-sm font-bold">Diterima</span>
                    </div>
                    <span className="text-lg font-extrabold text-green-700">
                      {approvedArtworks.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-red-50 border border-red-100 p-4 rounded-xl">
                    <div className="flex items-center gap-3 text-red-700">
                      <XCircle size={20} />
                      <span className="text-sm font-bold">Ditolak</span>
                    </div>
                    <span className="text-lg font-extrabold text-red-700">
                      {rejectedArtworks.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 border border-gray-100 p-4 rounded-xl">
                    <div className="flex items-center gap-3 text-gray-500">
                      <Trash2 size={20} />
                      <span className="text-sm font-bold">Dihapus</span>
                    </div>
                    <span className="text-lg font-extrabold text-gray-600">
                      {deletedArtworks.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* GRID PENDING */}
            <div className="flex items-center gap-3 mb-6">
              <h3 className="font-bold text-xl text-gray-900">
                Karya Menunggu Verifikasi
              </h3>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                {pendingArtworks.length} Pending
              </span>
            </div>
            {pendingArtworks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {pendingArtworks.map((art) => (
                  <div
                    key={art.id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group"
                  >
                    <div
                      className="h-56 bg-gray-100 overflow-hidden relative cursor-pointer"
                      onClick={() => setVerifyingArtwork(art)}
                    >
                      <img
                        src={art.image}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                        <div className="bg-white/90 p-3 rounded-full text-gray-900 shadow-lg transform scale-75 group-hover:scale-100 transition">
                          <Eye size={24} />
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <h4 className="font-bold text-lg text-gray-900 mb-1 truncate">
                        {art.title}
                      </h4>
                      <p className="text-xs text-gray-500 mb-4">
                        oleh{" "}
                        <span className="font-medium text-gray-700">
                          {art.author}
                        </span>
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => initiateApprove(art.id)}
                          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-bold transition shadow-sm active:scale-95"
                        >
                          <CheckCircle size={16} /> Terima
                        </button>
                        <button
                          onClick={() => initiateReject(art.id)}
                          className="flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-lg text-sm font-bold transition active:scale-95"
                        >
                          <XCircle size={16} /> Tolak
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">
                  Semua Beres!
                </h4>
                <p className="text-gray-500 text-sm">
                  Tidak ada karya yang perlu diverifikasi saat ini.
                </p>
              </div>
            )}
          </>
        ) : (
          // TAB KELOLA KARYA
          <div className="space-y-12 animate-fade-in">
            {/* 1. DITERIMA */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="text-green-600" size={24} />
                <h3 className="font-bold text-xl text-green-700">
                  Karya Diterima
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedArtworks.map((art) => (
                  <div
                    key={art.id}
                    className="bg-white border border-green-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
                  >
                    <div className="h-48 bg-gray-100 relative">
                      <img
                        src={art.image}
                        alt={art.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 mb-1">
                        {art.title}
                      </h4>
                      <p className="text-xs text-gray-500 mb-3">
                        oleh {art.author}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded bg-gray-100 text-xs font-semibold text-gray-600">
                            {art.category}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewingArtwork(art)}
                            className="flex items-center gap-1 border border-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50"
                          >
                            <Eye size={14} /> Lihat
                          </button>
                          <button
                            onClick={() => initiateDelete(art.id, "approved")}
                            className="p-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. DITOLAK */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <XCircle className="text-red-600" size={24} />
                <h3 className="font-bold text-xl text-red-700">
                  Karya Ditolak
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rejectedArtworks.map((art) => (
                  <div
                    key={art.id}
                    className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
                  >
                    <div className="h-48 bg-gray-100 relative">
                      <img
                        src={art.image}
                        alt={art.title}
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 mb-1">
                        {art.title}
                      </h4>
                      <div className="bg-red-50 border border-red-100 p-2 rounded-lg text-xs text-red-700 font-medium mb-3">
                        Alasan: {art.reason}
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="px-2 py-1 rounded bg-gray-100 text-xs font-semibold text-gray-600">
                          {art.category}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewingArtwork(art)}
                            className="flex items-center gap-1 border border-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50"
                          >
                            <Eye size={14} /> Detail
                          </button>
                          <button
                            onClick={() => initiateDelete(art.id, "rejected")}
                            className="p-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. DIHAPUS */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Trash2 className="text-gray-500" size={24} />
                <h3 className="font-bold text-xl text-gray-700">
                  Karya Dihapus
                </h3>
              </div>
              <div className="space-y-3">
                {deletedArtworks.map((art) => (
                  <div
                    key={art.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center shadow-sm"
                  >
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {art.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        oleh {art.author} • {art.category}
                      </p>
                      <p className="text-xs text-red-500 mt-1">
                        Alasan: {art.reason || "Dihapus oleh Admin"}
                      </p>
                    </div>
                    <button
                      onClick={() => initiateDelete(art.id, "deleted")}
                      className="text-xs border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                    >
                      Hapus Permanen
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <VerificationModal
        artwork={verifyingArtwork}
        onClose={() => setVerifyingArtwork(null)}
        onApprove={initiateApprove}
        onReject={initiateReject}
      />
      <DetailAdminModal
        artwork={viewingArtwork}
        onClose={() => setViewingArtwork(null)}
      />

      {showRejectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertCircle size={28} />
              <h3 className="text-lg font-bold text-gray-900">Tolak Karya?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Anda akan menolak karya{" "}
              <span className="font-bold">
                "{getRejectingItemData()?.title}"
              </span>
              . Berikan alasan:
            </p>
            <textarea
              autoFocus
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Tuliskan alasan penolakan (wajib)..."
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-6 h-32 resize-none"
            ></textarea>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim()}
                className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition shadow-sm ${
                  !rejectReason.trim()
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                Tolak Karya
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
            <div className="flex items-center gap-3 mb-4 text-green-600">
              <HelpCircle size={28} />
              <h3 className="text-lg font-bold text-gray-900">
                Setujui Karya?
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin meloloskan karya ini?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={confirmApprove}
                className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition shadow-sm"
              >
                Ya, Setujui
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
            <div className="flex items-center gap-3 mb-4 text-gray-700">
              <Trash2 size={28} />
              <h3 className="text-lg font-bold text-gray-900">Hapus Data?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Tindakan ini akan menghapus data secara permanen.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition shadow-sm"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
