'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MapPin, Plus, User, LogOut, LayoutDashboard } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<{ avatar_url?: string | null; full_name?: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // useEffect ini digunakan untuk mengambil data user dan profil saat komponen pertama kali dimuat
  useEffect(() => {
    const getProfile = async () => {
      try {
        // Mengambil sesi user saat ini
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          // Jika ada user, ambil data profil (seperti foto dan nama) dari database
          const { data } = await supabase.from('profiles').select('avatar_url, full_name').eq('id', user.id).single()
          if (data) setProfile(data)
        }
      } catch (error) {
        console.error("Failed to load user profile:", error)
      } finally {
        setLoading(false)
      }
    }
    getProfile()

    // Memantau perubahan status login (misal jika user login dari tab lain, atau logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const activeUser = session?.user ?? null
      setUser(activeUser)
      if (activeUser) {
        const { data } = await supabase.from('profiles').select('avatar_url, full_name').eq('id', activeUser.id).single()
        if (data) setProfile(data)
      } else {
        setProfile(null)
      }
    })

    // Bersihkan pemantauan jika komponen tidak lagi digunakan
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fungsi untuk logout
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Mengambil 2 huruf pertama dari email untuk dijadikan inisial avatar jika user belum punya foto
  const initials = user?.email?.substring(0, 2).toUpperCase() ?? 'U'

  return (
    <header className="sticky top-4 z-50 w-full rounded-3xl border bg-background/80 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-ring rounded-xl p-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="block">
            <span className="text-base sm:text-lg font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-tight">Primakara </span>
            <span className="text-base sm:text-lg font-bold text-foreground/80">LNF</span>
          </div>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-secondary/50 p-1 rounded-2xl border">
          <Link href="/" className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-background hover:shadow-sm rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-ring">
            Semua
          </Link>
          <Link href="/?type=LOST" className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-red-600 hover:bg-background hover:shadow-sm rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-ring">
            Hilang
          </Link>
          <Link href="/?type=FOUND" className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-emerald-600 hover:bg-background hover:shadow-sm rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-ring">
            Temuan
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/items/new">
                    <Button size="sm" className="hidden sm:flex gap-2 font-medium rounded-2xl transition-all h-10 px-4">
                      <Plus className="h-4 w-4" />
                      Laporan Baru
                    </Button>
                    <Button size="icon" variant="ghost" className="flex sm:hidden rounded-xl">
                      <Plus className="h-5 w-5" />
                    </Button>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 rounded-full border bg-background p-0.5 pr-3 hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring shadow-sm">
                        <Avatar className="h-8 w-8 rounded-full overflow-hidden relative flex items-center justify-center bg-secondary">
                          {profile?.avatar_url ? (
                            <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" />
                          ) : (
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                              {initials}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="hidden sm:block text-sm font-semibold text-foreground">{profile?.full_name ?? user.email?.split('@')[0]}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2">
                      <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                        <Link href="/dashboard" className="flex items-center gap-2 font-medium">
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                        <Link href="/profile" className="flex items-center gap-2 font-medium">
                          <User className="h-4 w-4" />
                          Profil Saya
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-destructive cursor-pointer rounded-xl font-medium focus:bg-destructive/10 focus:text-destructive">
                        <LogOut className="h-4 w-4" />
                        Keluar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="font-semibold rounded-2xl h-10 px-4">
                      Masuk
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm" className="font-semibold rounded-2xl h-10 px-4 shadow-sm">
                      Daftar
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
