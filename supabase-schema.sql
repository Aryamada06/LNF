-- ============================================================
-- Campus Lost & Found System - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  whatsapp_number TEXT,
  campus_id TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Items table
CREATE TYPE public.item_category AS ENUM ('Elektronik', 'Dokumen', 'Aksesoris', 'Lainnya');
CREATE TYPE public.item_type AS ENUM ('LOST', 'FOUND');
CREATE TYPE public.item_status AS ENUM ('ACTIVE', 'CLAIMED', 'RESOLVED');

CREATE TABLE IF NOT EXISTS public.items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category public.item_category NOT NULL,
  type public.item_type NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  status public.item_status NOT NULL DEFAULT 'ACTIVE',
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all profiles (needed for item details / whatsapp contact)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

-- Profiles: Users can only update their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Items: Everyone can read items
CREATE POLICY "Items are viewable by everyone"
  ON public.items FOR SELECT USING (true);

-- Items: Only authenticated users can create items
CREATE POLICY "Authenticated users can create items"
  ON public.items FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Items: Only the owner can update their items
CREATE POLICY "Users can update own items"
  ON public.items FOR UPDATE USING (auth.uid() = user_id);

-- Items: Only the owner can delete their items
CREATE POLICY "Users can delete own items"
  ON public.items FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on user signup (trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- Supabase Storage: Create 'item-images' bucket
-- ============================================================
-- Run this in Supabase Storage dashboard OR via the API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('item-images', 'item-images', true);

-- Storage policy: Anyone can view images
CREATE POLICY "Images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'item-images');

-- Storage policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'item-images' AND auth.role() = 'authenticated'
  );

-- Storage policy: Users can delete their own uploads
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]
  );
