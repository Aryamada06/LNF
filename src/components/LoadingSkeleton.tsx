import { Card, CardContent } from '@/components/ui/card'

// Komponen skeleton ini digunakan untuk menampilkan efek loading (tulang punggung) saat data sedang diambil dari server
export function ItemCardSkeleton() {
  return (
    <Card className="overflow-hidden bg-card border-border animate-pulse">
      <div className="aspect-[4/3] bg-secondary" />
      <CardContent className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-secondary" />
          <div className="h-5 w-20 rounded-full bg-secondary" />
        </div>
        <div className="h-5 w-3/4 rounded bg-secondary" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-secondary" />
          <div className="h-3 w-2/3 rounded bg-secondary" />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <div className="h-3 w-3 rounded-full bg-secondary" />
          <div className="h-3 w-1/3 rounded bg-secondary" />
        </div>
      </CardContent>
    </Card>
  )
}

// Komponen untuk membungkus skeleton dalam bentuk grid (tabel baris/kolom)
export function LoadingSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  )
}
