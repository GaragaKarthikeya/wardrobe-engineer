# Supabase Setup Guide

1.  **Create Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2.  **Database Schema**: Go to the **SQL Editor** and run the following script:

    ```sql
    -- Create the items table
    create table public.items (
      id uuid default gen_random_uuid() primary key,
      created_at timestamptz default now(),
      image_url text not null,
      tags jsonb default '{}'::jsonb,
      is_clean boolean default true
    );

    -- Enable Row Level Security (RLS) but allow public access for this personal tool
    alter table public.items enable row level security;

    -- Create a policy that allows everything for now (Simplify for Personal Tool)
    -- WARNING: This allows anyone with your Anon Key to read/write.
    -- Since it's a personal local tool, this is acceptable for MVP.
    create policy "Allow public access"
    on public.items
    for all
    using (true)
    with check (true);
    ```

3.  **Storage Setup**:
    -   Go to **Storage** in the sidebar.
    -   Create a new Bucket named `wardrobe`.
    -   Make it **Public**.
    -   Save.

4.  **Environment Variables**:
    -   Go to **Project Settings** -> **API**.
    -   Copy `Project URL` and `anon` public key.
    -   Create a file named `.env.local` in `wardrobe-engineer/` (root of app).
    -   Add the keys:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
    GEMINI_API_KEY=your-google-gemini-key-here
    ```
