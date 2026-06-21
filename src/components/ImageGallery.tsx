'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageModal } from './ImageModal'
import { Tag } from 'lucide-react'

interface ImageGalleryProps {
  imageUrls: string[]
  title: string
  isLost: boolean
}

// Komponen untuk menampilkan galeri gambar barang (mendukung beberapa gambar)
export function ImageGallery({ imageUrls, title, isLost }: ImageGalleryProps) {
  // State untuk menyimpan index gambar yang sedang ditampilkan besar
  const [currentIndex, setCurrentIndex] = useState(0)

  // Jika tidak ada gambar, tampilkan kotak kosong dengan icon Tag
  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-secondary border border-border">
        <div className="flex h-full items-center justify-center text-muted-foreground/50">
          <Tag className="h-20 w-20 opacity-20" />
        </div>
        <div className="absolute top-4 left-4 pointer-events-none">
          <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold border ${
            isLost
              ? 'bg-red-500/90 text-white border-red-400/50 shadow-xl shadow-red-500/25'
              : 'bg-emerald-500/90 text-white border-emerald-400/50 shadow-xl shadow-emerald-500/25'
          }`}>
            {isLost ? '🔴 HILANG' : '🟢 TEMUAN'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-secondary border border-border">
        <ImageModal imageUrl={imageUrls.at(currentIndex) || ''} alt={`${title} - image ${currentIndex + 1}`}>
          <Image
            src={imageUrls.at(currentIndex) || ''}
            alt={`${title} - image ${currentIndex + 1}`}
            fill
            className="object-cover"
            priority
          />
        </ImageModal>
        {/* Type badge overlay */}
        <div className="absolute top-4 left-4 pointer-events-none z-10">
          <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold border ${
            isLost
              ? 'bg-red-500/90 text-white border-red-400/50 shadow-xl shadow-red-500/25'
              : 'bg-emerald-500/90 text-white border-emerald-400/50 shadow-xl shadow-emerald-500/25'
          }`}>
            {isLost ? '🔴 HILANG' : '🟢 TEMUAN'}
          </span>
        </div>
      </div>

      {/* Thumbnails (Gambar Kecil di bawah gambar utama) */}
      {imageUrls.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {imageUrls.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                currentIndex === idx ? 'border-primary shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <Image src={url} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
