'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, MapPin, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  // Fungsi untuk mengirim email reset password
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault() // Mencegah reload halaman
    setLoading(true)

    // Meminta Supabase untuk mengirim email reset password
    // Setelah user klik link di email, mereka akan diarahkan ke halaman /auth/reset-password
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      toast.error('Gagal mengirim email reset', { description: error.message })
      setLoading(false)
      return
    }

    // Jika sukses, ubah state submitted untuk menampilkan pesan sukses
    toast.success('Email reset password berhasil dikirim!')
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-lg bg-card rounded-[2rem] shadow-sm border border-border overflow-hidden p-8 sm:p-12">
        
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm mb-4">
            <MapPin className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Lupa Password?</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">
            Masukkan email Anda untuk mereset password
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
              <h3 className="text-green-600 dark:text-green-400 font-bold mb-2">Periksa Email Anda</h3>
              <p className="text-green-600/80 dark:text-green-400/80 text-sm font-medium">
                Kami telah mengirimkan tautan untuk mereset password ke <strong className="text-green-700 dark:text-green-300">{email}</strong>. 
                Silakan periksa kotak masuk atau folder spam Anda.
              </p>
            </div>
            <Link href="/auth/login" className="inline-flex items-center text-foreground font-bold hover:underline underline-offset-4 transition-all">
              <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-sm transition-all focus:ring-4 focus:ring-ring font-bold text-base mt-4"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Mengirim...</>
              ) : (
                'Kirim Tautan Reset'
              )}
            </Button>

            <div className="text-center mt-6">
              <Link href="/auth/login" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-foreground transition-all">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
