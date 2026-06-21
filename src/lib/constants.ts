import { CheckCircle2, LucideIcon } from 'lucide-react'

// Konstanta untuk menghapus barang hilang secara otomatis setelah 14 hari
export const AUTO_DELETE_DAYS = 14

// Warna kategori untuk label dan badge
export const CATEGORY_COLORS: Record<string, string> = {
  Elektronik: 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30',
  Dokumen: 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30',
  Aksesoris: 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30',
  Lainnya: 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/30',
}

// Konfigurasi status item (warna, label, dan ikon)
export const STATUS_CONFIG: Record<string, { label: string; color: string; icon?: LucideIcon }> = {
  ACTIVE: { label: 'Aktif', color: 'text-green-600 dark:text-green-400 bg-green-500/20 border-green-500/30', icon: CheckCircle2 },
  CLAIMED: { label: 'Diklaim', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/20 border-amber-500/30', icon: CheckCircle2 },
  RESOLVED: { label: 'Selesai', color: 'text-slate-600 dark:text-slate-400 bg-slate-500/20 border-slate-500/30', icon: CheckCircle2 },
}

// Daftar kategori yang tersedia untuk pencarian dan filter
export const CATEGORIES = ['Semua', 'Elektronik', 'Dokumen', 'Aksesoris', 'Lainnya']

// Daftar tipe laporan untuk filter
export const ITEM_TYPES = [
  { label: 'Semua', value: '' },
  { label: 'Hilang', value: 'LOST' },
  { label: 'Temuan', value: 'FOUND' },
]
