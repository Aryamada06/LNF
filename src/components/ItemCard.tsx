import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Clock, Tag } from 'lucide-react'
import type { ItemWithProfile } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { CATEGORY_COLORS, STATUS_CONFIG } from '@/lib/constants'

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Elektronik': return CATEGORY_COLORS.Elektronik
    case 'Dokumen': return CATEGORY_COLORS.Dokumen
    case 'Aksesoris': return CATEGORY_COLORS.Aksesoris
    default: return CATEGORY_COLORS.Lainnya
  }
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'ACTIVE': return STATUS_CONFIG.ACTIVE
    case 'CLAIMED': return STATUS_CONFIG.CLAIMED
    default: return STATUS_CONFIG.RESOLVED
  }
}

// Definisi props untuk komponen ItemCard
interface ItemCardProps {
  item: ItemWithProfile
}

// Komponen ItemCard digunakan untuk menampilkan ringkasan satu barang dalam bentuk kartu
export default function ItemCard({ item }: ItemCardProps) {
  const isLost = item.type === 'LOST'
  
  // Format waktu dari format tanggal komputer menjadi bahasa manusia, contoh: "2 jam yang lalu"
  const timeAgo = formatDistanceToNow(new Date(item.created_at), {
    addSuffix: true,
    locale: localeId,
  })

  return (
    <Link href={`/items/${item.id}`} className="group block focus:outline-none focus:ring-4 focus:ring-gray-200 rounded-3xl">
      <Card className="overflow-hidden bg-card border border-border rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 group-hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary border-b border-border">
          {item.image_url ? (
            <Image
              src={item.image_url.split(',')[0]}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Tag className="mx-auto h-12 w-12 mb-2 opacity-50" aria-hidden="true" />
                <p className="text-xs font-semibold">{"Tidak ada foto"}</p>
              </div>
            </div>
          )}
          {/* Type Badge overlay */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-bold border shadow-sm ${
              isLost
                ? 'bg-red-50 text-red-700 border-red-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}>
              {isLost ? 'HILANG' : 'TEMUAN'}
            </span>
          </div>
          {/* Status Badge */}
          {item.status !== 'ACTIVE' && (
            <div className="absolute top-3 right-3">
              <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold border shadow-sm ${getStatusConfig(item.status).color}`}>
                {getStatusConfig(item.status).label}
              </span>
            </div>
          )}
        </div>

        <CardContent className="p-5 space-y-3">
          {/* Category */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border ${getCategoryColor(item.category)}`}>
              {item.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200">
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-medium">
            {item.description}
          </p>

          {/* Meta */}
          <div className="space-y-2 pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0 opacity-70" aria-hidden="true" />
              <span className="truncate">{item.location}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0 opacity-70" aria-hidden="true" />
              <span>{timeAgo}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
