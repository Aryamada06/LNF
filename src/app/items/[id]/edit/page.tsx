'use no memo'
'use client'

import { useState, useRef, useEffect, use } from 'react'
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

// Skema validasi form
const formSchema = z.object({
  title: z.string().min(3, 'Nama barang minimal 3 karakter').max(100),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter').max(500),
  category: z.enum(['Elektronik', 'Dokumen', 'Aksesoris', 'Lainnya']),
  type: z.enum(['LOST', 'FOUND']),
  location: z.string().min(3, 'Lokasi minimal 3 karakter').max(100),
  status: z.enum(['ACTIVE', 'CLAIMED', 'RESOLVED']),
})

type FormData = z.infer<typeof formSchema>

export default function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { id } = use(params)

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: 'LOST', category: 'Lainnya', status: 'ACTIVE' },
  })

  useEffect(() => {
    const fetchItem = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Kamu harus login terlebih dahulu')
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        toast.error('Gagal memuat data laporan')
        router.push('/dashboard')
        return
      }

      // Check owner
      if (data.user_id !== user.id) {
        toast.error('Kamu tidak memiliki akses')
        router.push('/dashboard')
        return
      }

      reset({
        title: data.title,
        description: data.description,
        category: data.category,
        type: data.type,
        location: data.location,
        status: data.status,
      })

      if (data.image_url) {
        const urls = data.image_url.split(',')
        setExistingImages(urls)
        setImagePreviews(urls)
      }
      setLoadingInitial(false)
    }

    fetchItem()
  }, [id, router, reset, supabase])

  const selectedType = watch('type')

  // Fungsi yang dipanggil saat gambar dipilih
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024)
    if (validFiles.length < files.length) {
      toast.error('Beberapa file ditolak karena ukurannya > 5MB')
    }

    const totalFiles = [...imageFiles, ...validFiles]
    const currentTotal = existingImages.length + totalFiles.length
    if (currentTotal > 3) {
      toast.error('Maksimal 3 foto diizinkan')
      totalFiles.splice(3 - existingImages.length)
    }
    
    setImageFiles(totalFiles)
    
    // Hapus blob URL lama dari memori agar tidak bocor
    imagePreviews.slice(existingImages.length).forEach(p => URL.revokeObjectURL(p))
    
    const newBlobPreviews = totalFiles.map(f => URL.createObjectURL(f))
    setImagePreviews([...existingImages, ...newBlobPreviews])
  }

  // Fungsi yang dipanggil saat menghapus gambar (baik yang baru ditambahkan maupun yang sudah ada)
  const removeImage = (index: number) => {
    const isExisting = index < existingImages.length
    
    if (isExisting) {
      const newExisting = [...existingImages]
      newExisting.splice(index, 1)
      setExistingImages(newExisting)
      
      const newPreviews = [...imagePreviews]
      newPreviews.splice(index, 1)
      setImagePreviews(newPreviews)
    } else {
      const fileIndex = index - existingImages.length
      const newFiles = [...imageFiles]
      newFiles.splice(fileIndex, 1)
      setImageFiles(newFiles)
      
      const newPreviews = [...imagePreviews]
      const previewUrl = newPreviews.at(index)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      newPreviews.splice(index, 1)
      setImagePreviews(newPreviews)
    }
    
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Fungsi yang dijalankan ketika form disubmit
  const onSubmit = async (data: FormData) => {
    try {
      setUploading(true)
      const finalUrls = [...existingImages]

      // Jika ada gambar baru yang diunggah
      if (imageFiles.length > 0) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
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

            finalUrls.push(publicUrl)
          }
        }
      }

      const imageUrlStr = finalUrls.length > 0 ? finalUrls.join(',') : null

      // Update data laporan di database
      const { error } = await supabase
        .from('items')
        .update({
          ...data,
          image_url: imageUrlStr,
        })
        .eq('id', id)

      if (error) {
        throw new Error(`Gagal menyimpan perubahan: ${error.message}`)
      }

      toast.success('Laporan berhasil diperbarui!')
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error('Terjadi kesalahan', { description: err.message || 'Error tidak diketahui' })
    } finally {
      setUploading(false)
    }
  }

  const isLoading = isSubmitting || uploading

  if (loadingInitial) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary mb-3">
          <FileText className="h-3.5 w-3.5" />
          Edit Laporan
        </div>
        <h1 className="text-3xl font-bold text-foreground">Edit Barang</h1>
        <p className="text-muted-foreground mt-1">Perbarui detail barang yang kamu laporkan</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Status Selector */}
        <div className="space-y-1.5">
          <Label className="text-foreground font-semibold">Status Laporan *</Label>
          <Select value={watch('status')} onValueChange={(val) => setValue('status', val as FormData['status'])}>
            <SelectTrigger className="bg-background border-input text-foreground h-11 focus:ring-primary">
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="ACTIVE" className="text-foreground">Aktif</SelectItem>
              <SelectItem value="CLAIMED" className="text-foreground">Diklaim</SelectItem>
              <SelectItem value="RESOLVED" className="text-foreground">Selesai / Ditemukan</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
        </div>

        {/* Type Selector */}
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Tipe Laporan *</Label>
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
          <Label htmlFor="title" className="text-foreground font-semibold">Nama Barang *</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Contoh: Dompet kulit coklat"
            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-11"
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-foreground font-semibold">Deskripsi / Ciri-ciri *</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Deskripsikan ciri-ciri barang secara detail (warna, merek, isi, dll)"
            rows={4}
            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary resize-none"
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        {/* Category & Location row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-foreground font-semibold">Kategori *</Label>
            <Select value={watch('category')} onValueChange={(val) => setValue('category', val as FormData['category'])}>
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
            <Label htmlFor="location" className="text-foreground font-semibold">Lokasi Kejadian *</Label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                {...register('location')}
                placeholder="Contoh: Kantin, Gedung A Lt.2"
                className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-11"
              />
            </div>
            {errors.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Foto Barang (Maks 3 Gambar, Opsional)</Label>
          
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
                <p className="text-sm font-medium">Klik untuk tambah foto ({imagePreviews.length}/3)</p>
                <p className="text-xs opacity-60 mt-0.5">PNG, JPG, WEBP · Maks 5MB per foto</p>
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
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Menyimpan...</>
            ) : (
              'Simpan Perubahan'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
