'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // useEffect akan berjalan sekali saat halaman dimuat
  useEffect(() => {
    // Membaca URL saat ini untuk mencari kode (token) reset
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')

    if (code) {
      // Menukar kode dengan sesi login sementara
      // Hal ini diperlukan agar kita bisa mengupdate password pengguna
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          toast.error('Token tidak valid', { description: 'Tautan reset password mungkin sudah usang atau digunakan.' })
        } else {
          // Hapus kode dari URL agar tidak tertukar lagi jika halaman direfresh
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      })
    }
  }, [supabase])

  // Fungsi yang dijalankan ketika form di-submit
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Cek apakah password dan konfirmasi password sama
    if (password !== confirmPassword) {
      toast.error('Gagal', { description: 'Password tidak cocok.' })
      return
    }

    // Cek panjang password minimum
    if (password.length < 6) {
      toast.error('Gagal', { description: 'Password minimal harus 6 karakter.' })
      return
    }

    setLoading(true)

    try {
      // Periksa apakah ada sesi aktif terlebih dahulu (hasil pertukaran token di atas)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Gagal', { description: 'Sesi tidak ditemukan. Pastikan Anda membuka tautan dari email terbaru, atau minta tautan reset baru.' })
        setLoading(false)
        return
      }

      // Update password di database Supabase
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        toast.error('Gagal memperbarui password', { description: error.message })
        setLoading(false)
        return
      }

      toast.success('Berhasil!', { description: 'Password Anda telah berhasil diperbarui.' })
      router.push('/auth/login') // Arahkan pengguna kembali ke halaman login
    } catch (err: unknown) {
      // Menggunakan unknown lebih aman daripada any
      const errorMessage = err instanceof Error ? err.message : 'Gagal terhubung ke server.'
      toast.error('Terjadi Kesalahan', { description: errorMessage })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-lg bg-card rounded-[2rem] shadow-sm border border-border overflow-hidden p-8 sm:p-12">
        
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Buat Password Baru</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">
            Silakan masukkan password baru Anda di bawah ini
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-bold text-sm">Password Baru</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                className="pl-12 pr-12 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring h-14 rounded-2xl font-medium transition-all text-base"
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-full p-1"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground font-bold text-sm">Konfirmasi Password Baru</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                required
                className="pl-12 pr-12 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring h-14 rounded-2xl font-medium transition-all text-base"
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-full p-1"
                aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-sm transition-all focus:ring-4 focus:ring-ring font-bold text-base mt-4"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Memproses...</>
            ) : (
              'Simpan Password Baru'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
