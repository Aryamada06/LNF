import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ItemCard from '@/components/ItemCard'
import FilterBar from '@/components/FilterBar'
import { LoadingSkeletonGrid } from '@/components/LoadingSkeleton'
import { Plus, PackageSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { ItemWithProfile } from '@/lib/types'
import { AUTO_DELETE_DAYS } from '@/lib/constants'

// Tipe data untuk properti yang diterima oleh HomePage
interface HomePageProps {
  searchParams: Promise<{ q?: string; type?: string; category?: string }>
}

// Komponen untuk menampilkan daftar barang dalam bentuk grid (kotak-kotak)
async function ItemsGrid({ searchParams }: HomePageProps) {
  const params = await searchParams
  const supabase = await createServerSupabaseClient()

  // Membuat query dasar untuk mengambil semua barang yang ada beserta profil pembuatnya
  let query = supabase
    .from('items')
    .select('*, profiles(id, full_name, whatsapp_number, campus_id)')
    .order('created_at', { ascending: false })

  // Menambahkan filter pencarian berdasarkan kata kunci (jika ada)
  if (params.q) {
    query = query.ilike('title', `%${params.q}%`)
  }
  // Menambahkan filter pencarian berdasarkan tipe (Hilang atau Temuan)
  if (params.type && (params.type === 'LOST' || params.type === 'FOUND')) {
    query = query.eq('type', params.type)
  }
  // Menambahkan filter pencarian berdasarkan kategori
  if (params.category && params.category !== 'Semua') {
    query = query.eq('category', params.category)
  }

  // Menjalankan query ke database Supabase
  const { data: initialItems, error } = await query
  let items = initialItems

  if (items) {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now()
    const expiryMs = AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000
    const itemsToDelete: string[] = []

    // Menyaring item untuk memeriksa barang yang sudah kadaluarsa (lebih dari 14 hari)
    // Semua barang (apapun statusnya) akan dihapus otomatis jika lebih dari 14 hari
    items = items.filter(item => {
      const isExpired = (now - new Date(item.created_at).getTime()) > expiryMs
      
      if (isExpired) {
        // Masukkan ke daftar untuk dihapus dari database (baik LOST maupun FOUND)
        itemsToDelete.push(item.id)
        return false // Jangan tampilkan di halaman
      }
      return true
    })

    // PENTING: Gunakan await agar penghapusan selesai SEBELUM halaman di-render
    // Ini mencegah bug 404 saat user klik barang yang sudah terhapus di background
    if (itemsToDelete.length > 0) {
      await supabase.from('items').delete().in('id', itemsToDelete)
    }
  }

  // Jika terjadi error saat mengambil data, tampilkan pesan error
  if (error) {
    return (
      <div className="text-center py-16 text-red-400">
        <p>Gagal memuat data. Silakan coba lagi.</p>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-3xl border border-border shadow-sm">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-secondary border border-border">
          <PackageSearch className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Tidak ada barang ditemukan</h3>
        <p className="text-muted-foreground mb-8 max-w-sm font-medium">
          Coba ubah filter pencarianmu, atau jadilah yang pertama melaporkan barang.
        </p>
        <Link href="/items/new">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 gap-2 font-semibold shadow-sm rounded-2xl h-12 px-6 focus-visible:ring-4 focus-visible:ring-ring transition-all">
            <Plus className="h-5 w-5" />
            Tambah Laporan
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-0 animate-fade-in-up"
      style={{ animationDelay: '600ms' }}
    >
      {(items as ItemWithProfile[]).map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}

// Komponen halaman sambutan untuk user yang belum login
function GuestHeroPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center gap-8">
        {/* Icon */}
        <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/10">
          <PackageSearch className="h-14 w-14 text-primary" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-foreground font-bold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          Sistem Lost &amp; Found Kampus Primakara
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight">
            Temukan Kembali{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Barang Kamu.
            </span>
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl font-medium max-w-lg mx-auto">
            Platform pelaporan terpadu untuk barang hilang dan temuan di lingkungan kampus.
            Login untuk melihat semua laporan atau membuat laporan baru.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/auth/login">
            <Button size="lg" className="font-semibold rounded-2xl h-12 px-8 shadow-md text-base">
              Masuk untuk Melihat Laporan
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button size="lg" variant="outline" className="font-semibold rounded-2xl h-12 px-8 text-base">
              Daftar Akun Baru
            </Button>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
          {[
            { emoji: '🔍', title: 'Cari Barang', desc: 'Temukan barang hilang milikmu' },
            { emoji: '📢', title: 'Laporkan', desc: 'Laporkan barang yang kamu temukan' },
            { emoji: '💬', title: 'Hubungi', desc: 'Langsung via WhatsApp' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <div className="text-3xl mb-2">{f.emoji}</div>
              <div className="font-bold text-foreground text-sm">{f.title}</div>
              <div className="text-muted-foreground text-xs mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Komponen utama halaman beranda
export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createServerSupabaseClient()

  // Cek apakah user sudah login
  const { data: { user } } = await supabase.auth.getUser()

  // Jika belum login, tampilkan halaman sambutan saja (tanpa daftar barang)
  if (!user) {
    return <GuestHeroPage />
  }
  
  // Fetch stats concurrently (Mengambil data statistik secara bersamaan agar lebih cepat)
  const [
    { count: activeCount },
    { count: resolvedCount }
  ] = await Promise.all([
    supabase.from('items').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase.from('items').select('*', { count: 'exact', head: true }).in('status', ['CLAIMED', 'RESOLVED'])
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Bento Grid Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Hero Bento Card */}
        <div 
          className="md:col-span-2 bg-card rounded-[2rem] border border-border p-6 sm:p-12 shadow-sm flex flex-col justify-center relative overflow-hidden opacity-0 animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <PackageSearch className="w-64 h-64 -mr-16 -mt-16" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-xs sm:text-sm text-foreground font-bold mb-4 sm:mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-slow" aria-hidden="true" />
              Sistem Lost &amp; Found Kampus
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-foreground mb-4 sm:mb-6 leading-[1.1] tracking-tight">
              Temukan Kembali <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                Barang Kamu.
              </span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg font-medium max-w-md">
              Platform pelaporan terpadu untuk barang hilang dan temuan di lingkungan kampus.
            </p>
          </div>
        </div>

        {/* Stats Bento Cards (Stacked) */}
        <div className="md:col-span-1 grid grid-rows-2 gap-4">
          {[
            { label: 'Laporan Aktif', value: activeCount ?? 0, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
            { label: 'Sudah Kembali', value: resolvedCount ?? 0, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
          ].map((stat, i) => (
            <div 
              key={i} 
              className={`rounded-[2rem] border ${stat.border} ${stat.bg} p-4 sm:p-6 shadow-sm flex flex-col justify-center items-center text-center opacity-0 animate-fade-in-up`}
              style={{ animationDelay: (200 + (i * 100)) + 'ms' }}
            >
              <div className={`text-2xl sm:text-3xl font-black ${stat.color}`}>{stat.value}</div>
              <div className={`text-xs sm:text-sm font-bold text-foreground mt-1`}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div 
        className="mb-6 rounded-[2rem] border border-border bg-card p-4 sm:p-6 shadow-sm opacity-0 animate-fade-in-up"
        style={{ animationDelay: '500ms' }}
      >
        <Suspense>
          <FilterBar />
        </Suspense>
      </div>

      {/* Items Grid */}
      <Suspense fallback={<LoadingSkeletonGrid />}>
        <ItemsGrid searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
