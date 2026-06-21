'use no memo'
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Loader2, ImagePlus, MapPin, FileText, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

// Skema validasi form menggunakan Zod
const formSchema = z.object({
  title: z.string().min(3, 'Nama barang minimal 3 karakter').max(100),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter').max(500),
  category: z.enum(['Elektronik', 'Dokumen', 'Aksesoris', 'Lainnya']),
  type: z.enum(['LOST', 'FOUND']),
  location: z.string().min(3, 'Lokasi minimal 3 karakter').max(100),
})

type FormData = z.infer<typeof formSchema>

export default function NewItemPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: 'LOST', category: 'Lainnya' },
  })

  const selectedType = watch('type')

  // Fungsi yang dijalankan saat user memilih gambar
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    // Validasi ukuran gambar maksimal 5MB
    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024)
    if (validFiles.length < files.length) {
      toast.error('Beberapa file ditolak karena ukurannya > 5MB')
    }

    // Maksimal 3 gambar yang bisa diunggah
    const totalFiles = [...imageFiles, ...validFiles].slice(0, 3)
    setImageFiles(totalFiles)
    
    // Menghapus preview lama untuk mencegah kebocoran memori (memory leak)
    imagePreviews.forEach(p => URL.revokeObjectURL(p))
    
    const newPreviews = totalFiles.map(f => URL.createObjectURL(f))
    setImagePreviews(newPreviews)
  }

  // Fungsi untuk menghapus gambar yang sudah dipilih
  const removeImage = (index: number) => {
    const newFiles = [...imageFiles]
    const newPreviews = [...imagePreviews]
    
    const previewUrl = newPreviews.at(index)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    newFiles.splice(index, 1)
    newPreviews.splice(index, 1)
    
    setImageFiles(newFiles)
    setImagePreviews(newPreviews)
    
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Fungsi yang dijalankan saat form disubmit
  const onSubmit = async (data: FormData) => {
    try {
      // Mengecek apakah user sudah login
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Kamu harus login terlebih dahulu')
        router.push('/auth/login')
        return
      }

      setUploading(true)

      // Upload gambar ke Supabase Storage (jika ada)
      const imageUrls: string[] = []
      
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('item-images')
            .upload(fileName, file, { upsert: false })

          if (uploadError) {
            throw new Error(`Gagal upload gambar: ${uploadError.message}`)
          }
          
          if (!uploadData) {
            throw new Error('Upload berhasil tapi tidak ada data yang dikembalikan.')
          }

          const { data: { publicUrl } } = supabase.storage
            .from('item-images')
            .getPublicUrl(uploadData.path)

          imageUrls.push(publicUrl)
        }
      }
      
      // Menggabungkan beberapa URL gambar menjadi satu string yang dipisahkan koma
      const finalImageUrl = imageUrls.length > 0 ? imageUrls.join(',') : null

      // Menyimpan data laporan barang ke database
      const { error } = await supabase.from('items').insert({
        ...data,
        image_url: finalImageUrl,
        user_id: user.id,
        status: 'ACTIVE',
      })

      if (error) {
        throw new Error(`Gagal menyimpan laporan: ${error.message}`)
      }

      toast.success('Laporan berhasil dibuat!')
      router.push('/')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error('Terjadi kesalahan', { description: err.message || 'Error tidak diketahui' })
    } finally {
      setUploading(false)
    }
  }

  const isLoading = isSubmitting || uploading

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary mb-3">
          <FileText className="h-3.5 w-3.5" />
          Buat Laporan Baru
        </div>
        <h1 className="text-3xl font-bold text-foreground">{"Laporkan Barang"}</h1>
        <p className="text-muted-foreground mt-1">{"Isi detail barang yang hilang atau kamu temukan"}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Type Selector */}
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">{"Tipe Laporan *"}</Label>
          <div className="grid grid-cols-2 gap-3">
            {(['LOST', 'FOUND'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setValue('type', type)}
                className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-semibold transition-all duration-200 ${
                  selectedType === type
                    ? type === 'LOST'
                      ? 'border-red-500/60 bg-red-500/10 text-red-600 dark:text-red-400 shadow-lg shadow-red-500/10'
                      : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10'
                    : 'border-input bg-background text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <AlertCircle className="h-4 w-4" />
                {type === 'LOST' ? '🔴 Barang Hilang' : '🟢 Barang Temuan'}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-foreground font-semibold">{"Nama Barang *"}</Label>
          <Input
            id="title"
            name={register('title').name}
            onChange={register('title').onChange}
            onBlur={register('title').onBlur}
            ref={register('title').ref}
            placeholder="Contoh: Dompet kulit coklat"
            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-11"
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-foreground font-semibold">{"Deskripsi / Ciri-ciri *"}</Label>
          <Textarea
            id="description"
            name={register('description').name}
            onChange={register('description').onChange}
            onBlur={register('description').onBlur}
            ref={register('description').ref}
            placeholder="Deskripsikan ciri-ciri barang secara detail (warna, merek, isi, dll)"
            rows={4}
            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary resize-none"
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        {/* Category & Location row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-foreground font-semibold">{"Kategori *"}</Label>
            <Select defaultValue="Lainnya" onValueChange={(val) => setValue('category', val as FormData['category'])}>
              <SelectTrigger className="bg-background border-input text-foreground h-11 focus:ring-primary">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {['Elektronik', 'Dokumen', 'Aksesoris', 'Lainnya'].map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-foreground focus:bg-secondary focus:text-foreground">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-foreground font-semibold">{"Lokasi Kejadian *"}</Label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                name={register('location').name}
                onChange={register('location').onChange}
                onBlur={register('location').onBlur}
                ref={register('location').ref}
                placeholder="Contoh: Kantin, Gedung A Lt.2"
                className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-11"
              />
            </div>
            {errors.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">{"Foto Barang (Maks 3 Gambar, Opsional)"}</Label>
          
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden border border-border aspect-square">
                  <Image src={preview} alt={`Preview ${idx + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-red-500/80 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {imagePreviews.length < 3 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-input bg-background hover:bg-secondary/50 hover:border-primary/50 transition-all duration-200 p-8 flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground"
            >
              <ImagePlus className="h-8 w-8 opacity-50" />
              <div className="text-center">
                <p className="text-sm font-medium">{"Klik untuk tambah foto ("}{imagePreviews.length}/3)</p>
                <p className="text-xs opacity-60 mt-0.5">{"PNG, JPG, WEBP · Maks 5MB per foto"}</p>
              </div>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* Submit */}
        <div className="pt-2 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 border-input bg-background hover:bg-secondary text-foreground"
          >
            {"Batal"}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Menyimpan...</>
            ) : (
              'Buat Laporan'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
