'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

const categories = ['Semua', 'Elektronik', 'Dokumen', 'Aksesoris', 'Lainnya']
const types = [
  { label: 'Semua', value: '' },
  { label: 'Hilang', value: 'LOST' },
  { label: 'Temuan', value: 'FOUND' },
]

// Komponen FilterBar untuk mencari dan menyaring laporan barang
export default function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [activeType, setActiveType] = useState(searchParams.get('type') ?? '')
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') ?? 'Semua')

  // Fungsi untuk memperbarui URL dengan parameter pencarian/filter terbaru
  const updateParams = useCallback(
    (newQ: string, newType: string, newCategory: string) => {
      const params = new URLSearchParams()
      if (newQ) params.set('q', newQ)
      if (newType) params.set('type', newType)
      if (newCategory && newCategory !== 'Semua') params.set('category', newCategory)
      router.push(`/?${params.toString()}`)
    },
    [router]
  )

  // Debounce (tunda) pencarian saat mengetik agar tidak membuat banyak request beruntun
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams(search, activeType, activeCategory)
    }, 400)
    return () => clearTimeout(timer)
  }, [search, activeType, activeCategory, updateParams])

  // Fungsi untuk menghapus semua filter
  const clearFilters = () => {
    setSearch('')
    setActiveType('')
    setActiveCategory('Semua')
    router.push('/')
  }

  // Cek apakah ada filter yang sedang aktif
  const hasFilters = search || activeType || activeCategory !== 'Semua'

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama barang..."
          className="pl-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary h-12 rounded-2xl font-medium transition-all"
          aria-label="Cari nama barang"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-full p-0.5"
            aria-label="Hapus pencarian"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Filter:</span>
        </div>

        {/* Type Filter */}
        <div className="flex gap-1.5">
          {types.map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveType(t.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background ${
                activeType === t.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-background text-muted-foreground border-input hover:bg-secondary hover:text-foreground'
              }`}
              aria-pressed={activeType === t.value}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-border" aria-hidden="true" />

        {/* Category Filter */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-background text-muted-foreground border-input hover:bg-secondary hover:text-foreground'
              }`}
              aria-pressed={activeCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-destructive"
            aria-label="Hapus semua filter"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
