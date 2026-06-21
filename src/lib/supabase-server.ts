import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Fungsi ini digunakan untuk membuat koneksi ke Supabase dari sisi Server.
// Ini dipakai di Server Components (contoh: page.tsx yang tidak pakai 'use client')
// Fungsi ini juga menangani cookies agar user tetap login saat berpindah halaman.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Mengambil semua cookies yang ada
        getAll() {
          return cookieStore.getAll()
        },
        // Menyimpan cookies baru (misalnya saat user baru login)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Abaikan error jika kita mencoba set cookie di konteks Server Component biasa
            // (Server component tidak bisa langsung set cookie, hanya bisa baca)
          }
        },
      },
    }
  )
}
