import { createBrowserClient } from '@supabase/ssr'

// Fungsi ini digunakan untuk membuat koneksi ke Supabase dari sisi Client (Browser).
// Ini dipakai di komponen React yang menggunakan 'use client'.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
