import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PackageSearch, ArrowLeft } from 'lucide-react'

// Halaman custom 404 (Not Found) yang ditampilkan ketika URL tidak ditemukan
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-secondary border border-border">
        <PackageSearch className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-3xl font-extrabold text-foreground mb-4">{"Halaman Tidak Ditemukan"}</h2>
      <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
        {"Maaf, halaman yang kamu cari tidak ada atau barang tersebut sudah dihapus dari sistem."}
      </p>
      <Link href="/">
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-2xl h-12 px-6">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Button>
      </Link>
    </div>
  )
}
