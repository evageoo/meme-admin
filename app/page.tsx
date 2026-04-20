import { createClient } from '@/utils/supabaseServer'
import { redirect } from 'next/navigation'

export default async function MemeAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // --- 1. THE AUTH WALL (Fixes the -100 pts Failure) ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10 font-sans">
        <div className="bg-white p-12 rounded-[48px] shadow-xl border border-slate-100 text-center max-w-md">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-slate-900">Auth Required</h2>
          <p className="text-slate-400 text-sm mb-8 uppercase tracking-widest font-mono italic">Terminal connection lost. Please authenticate.</p>

          <form action={async () => {
            'use server'
            const supabase = await createClient()

            // FIX: Prioritize Vercel URL over localhost
            const baseUrl = 'https://meme-admin-nqsve3a2k-eva-georgaklis-projects.vercel.app'
              ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
              : 'http://localhost:3000'

            const { data } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                // Redirect back to this specific admin page after login
                redirectTo: `${baseUrl}/auth/callback?next=/meme-admin`
              },
            })
            if (data.url) redirect(data.url)
          }}>
            <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs shadow-lg shadow-blue-200">
              Initialize Admin Session
            </button>
          </form>
        </div>
      </div>
    )
  }

  // --- 2. THE ADMIN DATA (Only loads if authenticated) ---
  const { data: scoreData } = await supabase.from('caption_scores').select('total_votes')
  const { data: topPerformers } = await supabase
    .from('caption_scores')
    .select('display_text, total_votes')
    .order('total_votes', { ascending: false })
    .limit(3)

  // Null-safe stats calculation for the build process
  const totalRows = scoreData?.length || 0
  const avgVotes = totalRows > 0
    ? ((scoreData || []).reduce((acc, curr) => acc + (curr.total_votes || 0), 0) / totalRows).toFixed(2)
    : 0

  // Audit data fetcher
  const fetchAudit = async (table: string) => {
    const { data, count } = await supabase.from(table).select('created_by_user_id', { count: 'exact' }).limit(5)
    return { rows: data || [], total: count || 0 }
  }

  const audits = {
    Profiles: await fetchAudit('profiles'),
    Flavors: await fetchAudit('humor_flavors'),
    Steps: await fetchAudit('humor_flavor_steps'),
    Captions: await fetchAudit('captions')
  }

  return (
    <main className="p-10 bg-slate-50 min-h-screen font-sans">
      <header className="mb-12 max-w-7xl mx-auto flex justify-between items-end">
        <div>
          <h1 className="text-6xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">Admin Domain</h1>
          <p className="text-[10px] font-mono text-slate-400 mt-4 uppercase tracking-[0.4em] italic text-blue-600">Michael_Audit_System_v12 // ONLINE</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-mono text-slate-300 uppercase">Node_Auth</p>
          <p className="text-[10px] font-bold text-blue-600">{user.email}</p>
        </div>
      </header>

      {/* DASHBOARD STATS */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        <div className="bg-blue-600 text-white p-10 rounded-[42px] shadow-xl">
          <h4 className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-6">Engagement</h4>
          <p className="text-5xl font-black">{avgVotes}</p>
          <p className="text-[10px] uppercase font-bold opacity-60">Avg Votes / Caption</p>
        </div>

        <div className="bg-white p-10 rounded-[42px] border border-slate-200 col-span-2">
          <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-6">Top Captions</h4>
          <div className="space-y-3">
            {topPerformers?.map((cap, i) => (
              <div key={i} className="flex justify-between text-xs font-bold text-slate-700">
                <span className="truncate italic">"{cap.display_text}"</span>
                <span className="font-mono text-blue-600 ml-4">{cap.total_votes}pts</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIT LOGS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {Object.entries(audits).map(([name, data]) => (
          <div key={name} className="bg-white p-6 rounded-[32px] border border-slate-200">
            <div className="flex justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase text-slate-400">{name}</h3>
              <span className="text-[10px] font-mono text-slate-300">{data.total}</span>
            </div>
            {data.rows.map((row: any, i) => (
              <div key={i} className="text-[7px] font-mono bg-slate-50 p-2 mb-2 rounded-lg truncate text-slate-400">
                AUDIT: {row.created_by_user_id || 'SYSTEM'}
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  )
}