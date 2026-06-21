'use client'

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import Image from 'next/image'
import { ReactNode } from 'react'

// Komponen ini digunakan untuk menampilkan gambar dalam ukuran penuh (modal) saat diklik
export function ImageModal({ children, imageUrl, alt }: { children: ReactNode, imageUrl: string, alt: string }) {
  // Jika tidak ada URL gambar, cukup tampilkan konten aslinya (thumbnail)
  if (!imageUrl) return <>{children}</>

  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* Tombol yang membungkus gambar thumbnail, bisa diklik untuk membuka modal */}
        <button className="relative w-full h-full cursor-zoom-in outline-none group focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
          {children}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl z-10" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-full p-1 bg-transparent border-none shadow-none h-[90vh] flex flex-col">
        <DialogTitle className="sr-only">Lihat Gambar Detail: {alt}</DialogTitle>
        <div className="relative w-full h-full flex-1">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-contain"
            priority
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
