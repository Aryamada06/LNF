'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  // State untuk menyimpan input pengguna
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Router untuk berpindah halaman
  const router = useRouter()
  
  // Koneksi ke Supabase
  const supabase = createClient()

  // Fungsi yang dipanggil saat tombol login ditekan
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault() // Mencegah halaman reload
    setLoading(true)

    // Melakukan proses autentikasi ke Supabase menggunakan email dan password
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Login gagal', { description: error.message })
      setLoading(false)
      return
    }

    toast.success('Berhasil masuk!')
    router.push('/') // Pindah ke halaman utama
    router.refresh() // Refresh halaman agar data terbaru termuat
  }


  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-card rounded-[2rem] shadow-sm border border-border overflow-hidden">
        
        {/* Left Side - Info */}
        <div className="hidden md:flex flex-col justify-between bg-secondary/50 p-12 border-r border-border">
          <div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm mb-8">
              <MapPin className="h-7 w-7" />
            </div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              {"Selamat Datang"}
              <br />
              {"Kembali."}
            </h1>
            <p className="text-muted-foreground font-medium mt-4 max-w-sm">
              {"Masuk ke akun Primakara LNF kamu untuk melaporkan barang hilang atau mengklaim barang yang ditemukan."}
            </p>
          </div>
          <div className="mt-8 bg-card p-6 rounded-2xl border border-border shadow-sm">
            <h3 className="font-bold text-foreground mb-2 text-sm">{"💡 Tahukah kamu?"}</h3>
            <p className="text-sm font-medium text-primary-foreground">{"Lebih dari 80% barang yang dilaporkan di Primakara LNF berhasil dikembalikan ke pemiliknya."}</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="md:hidden text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm mb-4">
              <MapPin className="h-7 w-7" />
            </div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground">{"Selamat Datang!"}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{"Masuk ke akun Primakara LNF kamu"}</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-semibold">{"Email Kampus"}</Label>
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
              <Label htmlFor="password" className="text-foreground font-semibold">{"Password"}</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
              <div className="flex justify-end mt-2">
                <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  {"Lupa Password?"}
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-sm transition-all focus:ring-4 focus:ring-ring font-bold text-base mt-4"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> {"Memproses..."}</>
              ) : (
                'Masuk Sekarang'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            {"Belum punya akun?"}{' '}
            <Link href="/auth/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              {"Daftar di sini"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
