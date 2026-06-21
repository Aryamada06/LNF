import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, MapPin, Clock, Tag, Phone, MessageCircle } from 'lucide-react'
import type { ItemWithProfile } from '@/lib/types'
import { formatDistanceToNow, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { Metadata } from 'next'
import { ImageGallery } from '@/components/ImageGallery'

import { CATEGORY_COLORS, STATUS_CONFIG } from '@/lib/constants'

interface PageProps {
  // Params adalah parameter dari URL (misalnya /items/123, maka id = 123)
  params: Promise<{ id: string }>
}

// Fungsi ini khusus Next.js untuk membuat metadata (judul halaman tab browser) secara dinamis
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: item } = await supabase.from('items').select('title, description').eq('id', id).single()
  return {
    title: item ? `${item.title} · Primakara LNF` : 'Item · Primakara LNF',
    description: item?.description,
  }
}

// Komponen utama untuk menampilkan detail barang
export default async function ItemDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // Mengambil data spesifik satu barang berdasarkan ID dari URL
  const { data: item, error } = await supabase
    .from('items')
    .select('*, profiles(id, full_name, whatsapp_number, campus_id, avatar_url)')
    .eq('id', id)
    .single()

  console.log("Item Details Fetch:", { id, item, error })

  if (error || !item) return notFound()

  const typedItem = item as ItemWithProfile
  const isLost = typedItem.type === 'LOST'
  const profile = typedItem.profiles

  // Mengubah format nomor WA agar diawali dengan kode negara (62) untuk link WhatsApp
  const waNumber = profile?.whatsapp_number?.replace(/\D/g, '').replace(/^0/, '62')
  
  // Membuat link langsung ke chat WhatsApp dengan template pesan
  const waLink = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo, saya melihat laporan barang "${typedItem.title}" di Primakara LNF. Apakah ini milikmu?`)}`
    : null

  // Memformat tanggal menjadi "2 hari yang lalu" atau "12 Oktober 2023, 14:00"
  const timeAgo = formatDistanceToNow(new Date(typedItem.created_at), { addSuffix: true, locale: localeId })
  const fullDate = format(new Date(typedItem.created_at), "dd MMMM yyyy, HH:mm", { locale: localeId })
  
  // Mengambil konfigurasi status dari konstanta terpusat
  const statusCfg = STATUS_CONFIG[typedItem.status]
  const StatusIcon = statusCfg?.icon

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Daftar
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Image */}
        <div className="lg:col-span-3">
          <ImageGallery 
            imageUrls={typedItem.image_url ? typedItem.image_url.split(',').filter(Boolean) : []} 
            title={typedItem.title} 
            isLost={isLost} 
          />
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status & Category */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${CATEGORY_COLORS[typedItem.category]}`}>
              <Tag className="h-3 w-3" />
              {typedItem.category}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusCfg.color}`}>
              {StatusIcon && <StatusIcon className="h-3.5 w-3.5" />}
              {statusCfg.label}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground leading-tight">{typedItem.title}</h1>

          {/* Description */}
          <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
            <p className="text-muted-foreground text-sm leading-relaxed">{typedItem.description}</p>
          </div>

          <Separator className="bg-border" />

          {/* Meta Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Lokasi</p>
                <p className="text-foreground font-medium">{typedItem.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Dilaporkan</p>
                <p className="text-foreground font-medium">{timeAgo}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{fullDate}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Pelapor Info */}
          {profile && (
            <div className="rounded-xl bg-card border border-border p-4 space-y-3 shadow-sm">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                {isLost ? 'Pemilik Barang' : 'Penemu Barang'}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-sm flex-shrink-0 overflow-hidden relative">
                  {profile.avatar_url ? (
                    <Image src={profile.avatar_url} alt={profile.full_name ?? 'Pelapor'} fill className="object-cover" />
                  ) : (
                    profile.full_name?.[0]?.toUpperCase() ?? 'U'
                  )}
                </div>
                <div>
                  <p className="text-foreground font-medium">{profile.full_name ?? 'Pengguna Anonim'}</p>
                  {profile.campus_id && (
                    <p className="text-muted-foreground text-xs">{profile.campus_id}</p>
                  )}
                </div>
              </div>

              {waLink ? (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-0 shadow-lg shadow-green-500/20 text-white font-semibold">
                    <MessageCircle className="h-4 w-4" />
                    Hubungi via WhatsApp
                  </Button>
                </a>
              ) : (
                <div className="rounded-lg bg-secondary/50 border border-border p-3 flex items-center gap-2 text-muted-foreground text-sm">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  Nomor WhatsApp belum diisi
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
