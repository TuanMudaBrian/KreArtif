import React, { useState, useEffect } from "react";
import { User, Edit3, Upload, Trash2, X, Loader } from "lucide-react";
import DetailModal from "../components/DetailModal";

// --- IMPORT FIREBASE ---
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  increment, // Tambahkan increment
} from "firebase/firestore";

const Profile = ({ onNavigate }) => {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    nim: "-",
  });
  const [myArtworks, setMyArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: "", nim: "" });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // UBAH KE SELECTED ID (Agar data modal selalu realtime)
  const [selectedId, setSelectedId] = useState(null);

  // Cari data artwork berdasarkan ID yang dipilih
  const selectedArtwork = myArtworks.find((art) => art.id === selectedId);

  // --- EFFECT: AUTH LISTENER & FETCH DATA ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        // 1. Ambil Data Profil User
        const userDocRef = doc(db, "users", user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserProfile({
              name: userData.fullName || user.displayName || "User",
              nim: userData.nim || "-",
            });
          }
        });

        // 2. Ambil Karya Milik User
        const q = query(
          collection(db, "artworks"),
          where("authorId", "==", user.uid)
        );

        const unsubscribeArtworks = onSnapshot(q, (snapshot) => {
          const artworksData = snapshot.docs.map((doc) => {
            const data = doc.data();
            const isLikedByMe = data.likes
              ? data.likes.includes(user.uid)
              : false;

            return {
              id: doc.id,
              ...data,
              isLiked: isLikedByMe,
              comments: data.comments || [],
              views: data.views || 0,
            };
          });
          setMyArtworks(artworksData);
          setLoading(false);
        });

        return () => {
          unsubscribeUser();
          unsubscribeArtworks();
        };
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // --- HANDLERS ---

  // 1. BUKA DETAIL & UPDATE VIEWS (Fitur Baru)
  const handleOpenDetail = async (art) => {
    setSelectedId(art.id); // Buka modal

    if (art.id) {
      try {
        const artRef = doc(db, "artworks", art.id);
        // Tambah views +1 di database
        await updateDoc(artRef, {
          views: increment(1),
        });
      } catch (error) {
        console.error("Gagal update views:", error);
      }
    }
  };

  // 2. Edit Profile
  const handleEditClick = () => {
    setEditFormData({ name: userProfile.name, nim: userProfile.nim });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        fullName: editFormData.name,
        nim: editFormData.nim,
      });
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Gagal mengupdate profil.");
    }
  };

  // 3. Hapus Karya
  const initiateDelete = (id) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, "artworks", itemToDelete));
      setShowDeleteModal(false);
      setItemToDelete(null);
      // Jika sedang membuka modal karya yang dihapus, tutup modalnya
      if (selectedId === itemToDelete) setSelectedId(null);
    } catch (error) {
      console.error("Error deleting artwork:", error);
      alert("Gagal menghapus karya.");
    }
  };

  // 4. Like
  const toggleLike = async (id) => {
    if (!currentUser) return;
    const artRef = doc(db, "artworks", id);
    const art = myArtworks.find((a) => a.id === id);

    try {
      if (art.isLiked) {
        await updateDoc(artRef, { likes: arrayRemove(currentUser.uid) });
      } else {
        await updateDoc(artRef, { likes: arrayUnion(currentUser.uid) });
      }
    } catch (error) {
      console.error("Gagal like:", error);
    }
  };

  // 5. Komentar
  const addComment = async (artworkId, commentText) => {
    if (!currentUser) return;

    const newComment = {
      id: Date.now().toString(),
      user: userProfile.name,
      initial: (userProfile.name || "U").charAt(0).toUpperCase(),
      text: commentText,
      userId: currentUser.uid,
      createdAt: new Date().toISOString(),
    };

    try {
      const artRef = doc(db, "artworks", artworkId);
      await updateDoc(artRef, {
        comments: arrayUnion(newComment),
      });
    } catch (error) {
      console.error("Gagal kirim komentar:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8 animate-fade-in relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header Profile */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 flex flex-col items-center text-center mb-10">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <User size={40} className="text-gray-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {userProfile.name}
          </h1>
          <p className="text-sm text-gray-500 mb-2">NIM: {userProfile.nim}</p>
          <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <span className="font-semibold text-gray-900">
              {myArtworks.length} Karya
            </span>
            <span>•</span>
            <span>Seniman</span>
          </div>
          <div className="flex gap-4 w-full justify-center">
            <button
              onClick={handleEditClick}
              className="flex items-center gap-2 border border-gray-200 px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition min-w-[140px] justify-center"
            >
              <Edit3 size={16} /> Edit Profile
            </button>
            <button
              onClick={() => onNavigate("upload")}
              className="flex items-center gap-2 border border-gray-200 px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition min-w-[140px] justify-center"
            >
              <Upload size={16} /> Upload Karya
            </button>
          </div>
        </div>

        {/* Daftar Karya */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Hasil Karya</h3>
          <span className="text-sm text-gray-500">
            {myArtworks.length} karya dipublikasikan
          </span>
        </div>

        {myArtworks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myArtworks.map((item) => (
              <div
                key={item.id}
                // GANTI DARI setSelectedArtwork -> handleOpenDetail
                onClick={() => handleOpenDetail(item)}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition cursor-pointer group relative"
              >
                <div className="aspect-square overflow-hidden bg-gray-100 relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />

                  {item.status === "pending" && (
                    <div className="absolute top-3 left-3 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded shadow-sm">
                      Menunggu Verifikasi
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      initiateDelete(item.id);
                    }}
                    className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-200 z-10"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-gray-900 mb-2 truncate">
                    {item.title}
                  </h4>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{item.category}</span>
                    <span>
                      {item.createdAt?.seconds
                        ? new Date(
                            item.createdAt.seconds * 1000
                          ).toLocaleDateString()
                        : "Baru saja"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            Belum ada karya yang diunggah.
          </div>
        )}
      </div>

      {/* Modal Edit Profile */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-[500px] rounded-xl shadow-2xl p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-gray-900 text-sm focus:ring-black focus:border-black outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  NIM
                </label>
                <input
                  type="text"
                  value={editFormData.nim}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, nim: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-gray-900 text-sm focus:ring-black focus:border-black outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-5 py-2 text-sm font-bold text-white bg-black rounded-lg hover:bg-gray-800 transition shadow-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Hapus Karya
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus karya ini? Tindakan ini tidak
              dapat dibatalkan.
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
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition shadow-sm"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <DetailModal
        artwork={selectedArtwork}
        onClose={() => setSelectedId(null)}
        onToggleLike={toggleLike}
        onAddComment={addComment}
      />
    </div>
  );
};

export default Profile;
