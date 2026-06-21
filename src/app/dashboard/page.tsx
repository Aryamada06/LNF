'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { LayoutDashboard, Plus, MapPin, Clock, Pencil, Trash2, Loader2, PackageSearch, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Item, ItemStatus } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

import { STATUS_CONFIG, AUTO_DELETE_DAYS } from '@/lib/constants'

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'ACTIVE': return STATUS_CONFIG.ACTIVE
    case 'CLAIMED': return STATUS_CONFIG.CLAIMED
    default: return STATUS_CONFIG.RESOLVED
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null)

  const [actionLoading, setActionLoading] = useState(false)

  const fetchItems = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const now = Date.now()
      // Mengubah rentang waktu auto-delete (misal 14 hari) menjadi milidetik
      const maxDaysMs = AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000
      
      // Mencari barang yang sudah melewati batas waktu (semua status)
      const itemsToDelete = data.filter(
        (item) => (now - new Date(item.created_at).getTime()) > maxDaysMs
      )
      
      if (itemsToDelete.length > 0) {
        const idsToDelete = itemsToDelete.map(i => i.id)
        
        // Jalankan penghapusan di background tanpa await agar dashboard cepat tampil
        supabase.from('items').delete().in('id', idsToDelete).then(() => {
          // Hapus juga gambar di storage jika ada
          for (const item of itemsToDelete) {
            if (item.image_url) {
              const urls = item.image_url.split(',')
              for (const url of urls) {
                const path = url.split('/item-images/')[1]
                if (path) supabase.storage.from('item-images').remove([path])
              }
            }
          }
        })
        
        // Perbarui data lokal agar langsung hilang tanpa perlu reload halaman
        const remainingItems = data.filter(item => !idsToDelete.includes(item.id))
        setItems(remainingItems as Item[])
      } else {
        setItems(data as Item[])
      }
    }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchItems() }, [])

  // Fungsi untuk menghapus item secara manual
  const handleDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(true)

    // Hapus gambar dari Supabase storage terlebih dahulu jika ada
    if (deleteTarget.image_url) {
      const urls = deleteTarget.image_url.split(',')
      for (const url of urls) {
        const path = url.split('/item-images/')[1]
        if (path) await supabase.storage.from('item-images').remove([path])
      }
    }

    // Kemudian hapus datanya dari database
    const { error } = await supabase.from('items').delete().eq('id', deleteTarget.id)
    setActionLoading(false)

    if (error) {
      toast.error('Gagal menghapus', { description: error.message })
    } else {
      toast.success('Laporan berhasil dihapus')
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }



  const stats = {
    total: items.length,
    active: items.filter(i => i.status === 'ACTIVE').length,
    resolved: items.filter(i => i.status === 'RESOLVED').length,
    lost: items.filter(i => i.type === 'LOST').length,
    found: items.filter(i => i.type === 'FOUND').length,
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary mb-3 hover:bg-primary/20 transition-colors cursor-pointer">
              <ArrowLeft className="h-3.5 w-3.5" />
              {"Kembali ke Beranda"}
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">{"Laporan Saya"}</h1>
          <p className="text-muted-foreground mt-1">{"Kelola semua laporan barang yang kamu buat"}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Laporan', value: stats.total, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Sedang Aktif', value: stats.active, color: 'text-green-600 dark:text-green-400' },
          { label: 'Barang Hilang', value: stats.lost, color: 'text-red-600 dark:text-red-400' },
          { label: 'Barang Temuan', value: stats.found, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm flex flex-col justify-center">
            <div className={`text-3xl font-black ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-xs font-semibold text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Items List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-card border border-border rounded-3xl shadow-sm">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary border border-border">
            <PackageSearch className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">{"Belum ada laporan"}</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">{"Mulai dengan membuat laporan pertamamu untuk barang yang hilang atau ditemukan."}</p>
          <Link href="/items/new">
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-0 rounded-xl h-11 px-6 font-semibold">
              <Plus className="h-4 w-4" /> {"Buat Laporan"}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-md transition-all duration-200"
            >
              {/* Thumbnail */}
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-xl overflow-hidden bg-secondary border border-border">
                {item.image_url ? (
                  <Image src={item.image_url.split(',')[0]} alt={item.title} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <PackageSearch className="h-8 w-8 opacity-50" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-1.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    item.type === 'LOST' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {item.type === 'LOST' ? 'HILANG' : 'TEMUAN'}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${getStatusConfig(item.status).color}`}>
                    {getStatusConfig(item.status).label}
                  </span>
                </div>
                <Link href={`/items/${item.id}`}>
                  <h3 className="font-bold text-lg text-foreground hover:text-primary transition-colors truncate">{item.title}</h3>
                </Link>
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: localeId })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/items/${item.id}/edit`)}
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(item)}
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-background border-border text-foreground rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-destructive text-xl font-bold">{"Hapus Laporan?"}</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              {"Aksi ini tidak bisa dibatalkan. Laporan"} <span className="text-foreground font-semibold">{deleteTarget?.title}</span> {"akan dihapus permanen."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl font-semibold border-input bg-background hover:bg-secondary text-foreground">{"Batal"}</Button>
            <Button onClick={handleDelete} disabled={actionLoading} className="rounded-xl font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground border-0">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4 mr-2" />{"Hapus Permanen"}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
