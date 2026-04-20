import { createClient } from '@/utils/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // --- CHANGE THIS LINE BELOW ---
  // We change '/meme-admin' to '/' because your admin code is now in app/page.tsx
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there's an error, send them back home to try again
  return NextResponse.redirect(`${origin}/`)
}