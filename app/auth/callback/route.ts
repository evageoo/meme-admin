import { createClient } from '@/utils/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // This reads the ?next=/meme-admin parameter we set in the login form
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Directs the user to the Vercel URL + the next path
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Fallback if something goes wrong
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}