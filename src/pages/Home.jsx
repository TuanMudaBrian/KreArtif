import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import DetailModal from "../components/DetailModal";

// --- IMPORT FIREBASE ---
import { db, auth } from "../firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";

const categories = [
  "Semua Karya",
  "Lukisan",
  "Digital Art",
  "Fotografi",
  "Ilustrasi",
];

const Home = ({ searchQuery, data, isLoggedIn, onRequireLogin }) => {
  // --- STATE ---
  const [artworks, setArtworks] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Semua Karya");
  const [selectedId, setSelectedId] = useState(null);

  // --- EFFECT: SINKRONISASI DATA ---
  useEffect(() => {
    if (data) {
      // Mapping data Firebase
      const realData = data.map((item) => {
        const currentUserId = auth.currentUser?.uid;
        const isLikedByMe = item.likes
          ? item.likes.includes(currentUserId)
          : false;

        return {
          ...item,
          isLiked: isLikedByMe,
          comments: item.comments || [],
          views: item.views || 0,
        };
      });

      // --- LOGIKA FILTER BULANAN ---
      // Agar karya muncul, kita tampilkan SEMUA yang statusnya approved.
      // Jika ingin filter bulan ini aktif, gunakan kode ini:

      const today = new Date();
      const currentMonthShort = today.toLocaleString("id-ID", {
        month: "short",
      });
      const currentYear = today.getFullYear();

      const thisMonthData = realData.filter(
        (art) =>
          art.date &&
          art.date.includes(currentMonthShort) &&
          art.date.includes(String(currentYear))
      );
      setArtworks(thisMonthData);

      // SAAT INI: Tampilkan Semua Approved (Agar hasil upload Anda terlihat)
      setArtworks(realData);
    }
  }, [data, isLoggedIn]);

  const selectedArtwork = artworks.find((art) => art.id === selectedId);

  // --- LOGIKA FILTER KATEGORI & PENCARIAN ---
  const filteredArtworks = artworks.filter((art) => {
    const matchCategory =
      activeCategory === "Semua Karya" || art.category === activeCategory;
    const searchLower = searchQuery ? searchQuery.toLowerCase() : "";
    const matchSearch =
      art.title.toLowerCase().includes(searchLower) ||
      art.author.toLowerCase().includes(searchLower);

    return matchCategory && matchSearch;
  });

  // --- FUNGSI INTERAKSI ---
  const handleOpenDetail = async (art) => {
    setSelectedId(art.id);
    if (art.id) {
      try {
        const artRef = doc(db, "artworks", art.id);
        await updateDoc(artRef, { views: increment(1) });
      } catch (error) {
        console.error("Gagal update views:", error);
      }
    }
  };

  const toggleLike = async (id) => {
    if (!isLoggedIn) {
      onRequireLogin("Silakan login untuk menyukai karya!");
      return;
    }
    const currentUserId = auth.currentUser?.uid;
    if (id && currentUserId) {
      const artRef = doc(db, "artworks", id);
      const art = artworks.find((a) => a.id === id);
      try {
        if (art.isLiked)
          await updateDoc(artRef, { likes: arrayRemove(currentUserId) });
        else await updateDoc(artRef, { likes: arrayUnion(currentUserId) });
      } catch (error) {
        console.error("Gagal like:", error);
      }
    }
  };

  const addComment = async (artworkId, commentText) => {
    if (!isLoggedIn) {
      onRequireLogin("Login dulu jika ingin berkomentar");
      return;
    }
    const user = auth.currentUser;
    const newComment = {
      id: Date.now().toString(),
      user: user.displayName || "User",
      initial: (user.displayName || "U").charAt(0).toUpperCase(),
      text: commentText,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };
    if (artworkId) {
      try {
        const artRef = doc(db, "artworks", artworkId);
        await updateDoc(artRef, { comments: arrayUnion(newComment) });
      } catch (error) {
        console.error("Gagal komen:", error);
      }
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">
      {/* Filter Kategori */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition border
              ${
                activeCategory === cat
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* --- GRID GALLERY --- */}
      {filteredArtworks.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {filteredArtworks.map((art) => (
            <div
              key={art.id}
              onClick={() => handleOpenDetail(art)}
              className="break-inside-avoid mb-6 group relative rounded-2xl overflow-hidden border border-gray-200 transition hover:-translate-y-1 cursor-pointer bg-white shadow-sm hover:shadow-md"
            >
              <div className="relative w-full">
                <img
                  src={art.image}
                  alt={art.title}
                  className="w-full h-auto block"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none"></div>

                {/* Tombol Like */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(art.id);
                  }}
                  className="absolute top-4 right-4 bg-white/90 p-2.5 rounded-full shadow-sm hover:bg-white transition cursor-pointer z-10 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300"
                >
                  <Heart
                    size={18}
                    className={`transition ${
                      art.isLiked
                        ? "text-red-500 fill-red-500"
                        : "text-gray-900"
                    }`}
                  />
                </button>

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 w-full p-5 opacity-0 group-hover:opacity-100 transition duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <h3 className="font-bold text-lg text-white mb-0.5 truncate drop-shadow-md">
                    {art.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-[10px] text-white font-bold">
                      {art.author ? art.author.charAt(0) : "U"}
                    </div>
                    <p className="text-xs font-medium text-gray-200 drop-shadow-sm truncate pr-2">
                      {art.author}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // --- TAMPILAN EVENT SELANJUTNYA (KOSONG) ---
        <div className="flex flex-col items-center justify-center py-32 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 animate-fade-in">
          <div className="text-5xl mb-4">🎨</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Tunggu Kami Di Event KreArtif Selanjutnya
          </h3>
          <p className="text-gray-500 text-sm max-w-md leading-relaxed">
            Saat ini belum ada karya yang ditampilkan. Jadilah yang pertama
            mengunggah karya pada event KreArtif selanjutnya. See ya! 👋
          </p>
        </div>
      )}

      <DetailModal
        artwork={selectedArtwork}
        onClose={() => setSelectedId(null)}
        onToggleLike={toggleLike}
        onAddComment={addComment}
      />
    </main>
  );
};

export default Home;
