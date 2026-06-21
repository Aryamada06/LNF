import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Route ini menangani callback dari Supabase (misal setelah user memverifikasi email)
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Jika ada parameter "next", gunakan itu sebagai tujuan redirect, jika tidak ke halaman utama '/'
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createServerSupabaseClient()
    // Menukar kode dengan sesi pengguna untuk mengautentikasi pengguna
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Jika berhasil, arahkan pengguna ke halaman tujuan
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Jika gagal atau token tidak valid, arahkan ke halaman login dengan pesan error
  return NextResponse.redirect(`${origin}/auth/login?error=Invalid_Token`)
}
