// src/components/Header.tsx
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            // Menambahkan type annotation eksplisit agar tidak error "implicit any"
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Abaikan error jika dipanggil dari Server Component
            // Ini normal terjadi saat Next.js melakukan render di server
          }
        },
      },
    }
  );

  // Cek User langsung di Server
  const { data: { user } } = await supabase.auth.getUser();

  // Oper data user ke Client Component
  return <HeaderClient initialUser={user} />;
}