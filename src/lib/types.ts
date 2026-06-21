// Tipe data untuk kategori barang
export type Category = 'Elektronik' | 'Dokumen' | 'Aksesoris' | 'Lainnya'

// Tipe laporan: LOST (Barang Hilang) atau FOUND (Barang Temuan)
export type ItemType = 'LOST' | 'FOUND'

// Status barang: ACTIVE (Masih dicari/belum diambil), CLAIMED (Sudah diklaim tapi belum selesai), RESOLVED (Selesai/Ditemukan)
export type ItemStatus = 'ACTIVE' | 'CLAIMED' | 'RESOLVED'

// Interface (struktur data) untuk Profil Pengguna
export interface Profile {
  id: string
  full_name: string | null
  whatsapp_number: string | null
  campus_id: string | null
  avatar_url?: string | null
}

// Interface (struktur data) untuk Barang (Item) yang dilaporkan
export interface Item {
  id: string
  title: string
  description: string
  category: Category
  type: ItemType
  location: string
  image_url: string | null
  status: ItemStatus
  user_id: string
  created_at: string
  profiles?: Profile | null
}

// Interface tambahan saat kita mengambil data barang sekaligus profil pembuatnya
export interface ItemWithProfile extends Item {
  profiles: Profile | null
}
