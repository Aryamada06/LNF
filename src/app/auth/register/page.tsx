'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  // State untuk menyimpan input dari user saat mendaftar
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // Fungsi yang dipanggil saat user menekan tombol daftar
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault() // Mencegah reload halaman
    
    // Validasi sederhana: pastikan password minimal 6 karakter
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    setLoading(true)

    // Melakukan pendaftaran ke Supabase, sekaligus menyimpan nama lengkap ke metadata user
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      toast.error('Registrasi gagal', { description: error.message })
      setLoading(false)
      return
    }

    // Jika sukses, tampilkan pesan dan arahkan ke halaman utama
    toast.success('Akun berhasil dibuat!', {
      description: 'Silakan cek email kamu untuk verifikasi (jika diaktifkan).',
    })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-card rounded-[2rem] shadow-sm border border-border overflow-hidden">
        
        {/* Left Side - Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center order-2 md:order-1 border-t md:border-t-0 md:border-r border-border">
          <div className="md:hidden text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm mb-4">
              <MapPin className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Buat Akun</h1>
            <p className="text-muted-foreground font-medium text-sm mt-1">Bergabung dengan Primakara LNF</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground font-bold text-sm">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama kamu"
                  required
                  className="pl-12 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring h-14 rounded-2xl font-medium transition-all text-base"
                  aria-required="true"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-bold text-sm">Email Kampus</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@kampus.ac.id"
                  required
                  className="pl-12 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring h-14 rounded-2xl font-medium transition-all text-base"
                  aria-required="true"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-bold text-sm">Password</Label>
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-sm transition-all focus:ring-4 focus:ring-ring font-bold text-base mt-4"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Mendaftar...</>
              ) : (
                'Buat Akun Sekarang'
              )}
            </Button>
          </form>

          <p className="text-center text-sm font-medium text-muted-foreground mt-8">
            Sudah punya akun?{' '}
            <Link href="/auth/login" className="text-foreground font-bold hover:underline underline-offset-4 transition-all">
              Masuk di sini
            </Link>
          </p>
        </div>

        {/* Right Side - Info */}
        <div className="hidden md:flex flex-col justify-between bg-secondary/50 p-12 order-1 md:order-2">
          <div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm mb-8">
              <MapPin className="h-7 w-7" />
            </div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              Akses Semua <br /> Fitur LNF.
            </h1>
            <p className="text-muted-foreground font-medium mt-4 max-w-sm">
              Buat akun dalam beberapa detik dan bergabunglah dengan komunitas kampus.
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            {[
              "Lapor barang hilang dengan cepat",
              "Bantu teman temukan barangnya",
              "Notifikasi real-time via email"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
