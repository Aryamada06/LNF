'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { User, Phone, Building2, Save, Loader2, ArrowLeft, Camera } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'
import type { Profile } from '@/lib/types'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [email, setEmail] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hook useEffect berjalan sekali saat halaman dimuat
  useEffect(() => {
    const fetchProfile = async () => {
      // Cek apakah user sedang login
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { router.push('/auth/login'); return }

      setEmail(user.email ?? '')

      // Ambil data profil dari database Supabase
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data as Profile)
        if (data.avatar_url) setAvatarPreview(data.avatar_url)
      }
      setLoading(false)
    }
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fungsi yang dipanggil saat user memilih file gambar baru untuk avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validasi ukuran file maksimal 1MB
    if (file.size > 1 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 1MB')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  // Fungsi untuk menyimpan perubahan data profil
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSaving(false)
        return
      }

      let finalAvatarUrl = profile.avatar_url

      // Jika ada file avatar baru, upload terlebih dahulu ke storage
      if (avatarFile) {
        toast.info('Mengunggah foto profil...')
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}/avatar_${Date.now()}.webp`

        // Kompres avatar
        const options = {
          maxSizeMB: 0.2, // 200KB max for avatar
          maxWidthOrHeight: 400,
          useWebWorker: true,
          fileType: 'image/webp'
        }
        const compressedFile = await imageCompression(avatarFile, options)

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, compressedFile, { upsert: true })

        if (uploadError) {
          throw new Error(`Upload foto gagal: ${uploadError.message}`)
        }

        if (!uploadData) {
          throw new Error('Upload berhasil tapi tidak ada data yang dikembalikan.')
        }

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(uploadData.path)

        finalAvatarUrl = publicUrl
      }

      // Update data di tabel profiles
      // Upsert akan melakukan insert jika belum ada, atau update jika sudah ada
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: profile.full_name,
        whatsapp_number: profile.whatsapp_number,
        campus_id: profile.campus_id,
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        throw new Error(`Gagal menyimpan profil: ${error.message}`)
      }

      toast.success('Profil berhasil diperbarui!')
      router.push('/dashboard')
    } catch (err: any) {
      console.error(err)
      toast.error('Terjadi kesalahan', { description: err.message || 'Error tidak diketahui' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Dashboard
      </Link>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary mb-3">
          <User className="h-3.5 w-3.5" />
          Profil Pengguna
        </div>
        <h1 className="text-3xl font-bold text-foreground">Profil Saya</h1>
        <p className="text-muted-foreground mt-1">Lengkapi profilmu agar orang bisa menghubungimu</p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-8">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-3xl font-bold shadow-sm flex-shrink-0 overflow-hidden relative">
              {avatarPreview ? (
                <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
              ) : (
                profile.full_name?.[0]?.toUpperCase() ?? email[0]?.toUpperCase() ?? 'U'
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-secondary border border-border text-foreground rounded-full p-2 shadow-sm group-hover:scale-110 transition-transform">
              <Camera className="h-4 w-4" />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
          />
          <div>
            <p className="font-semibold text-foreground text-xl">{profile.full_name ?? 'Pengguna'}</p>
            <p className="text-muted-foreground">{email}</p>
          </div>
        </div>

        <Separator className="bg-border mb-8" />

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-foreground font-semibold">Nama Lengkap</Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                value={profile.full_name ?? ''}
                onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Nama lengkap kamu"
                className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-11"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsapp" className="text-foreground font-semibold">Nomor WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="whatsapp"
                value={profile.whatsapp_number ?? ''}
                onChange={(e) => setProfile(p => ({ ...p, whatsapp_number: e.target.value }))}
                placeholder="Contoh: 08123456789"
                className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-11"
              />
            </div>
            <p className="text-xs text-muted-foreground/80">Digunakan agar orang bisa menghubungimu via WhatsApp</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="campusId" className="text-foreground font-semibold">NIM / ID Kampus (Opsional)</Label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="campusId"
                value={profile.campus_id ?? ''}
                onChange={(e) => setProfile(p => ({ ...p, campus_id: e.target.value }))}
                placeholder="Nomor mahasiswa / NIM"
                className="pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-11"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <Link href="/dashboard" className="flex-1">
              <Button type="button" variant="outline" className="w-full border-input bg-background hover:bg-secondary text-foreground h-11">
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
              ) : (
                <><Save className="h-4 w-4" /> Simpan Profil</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
