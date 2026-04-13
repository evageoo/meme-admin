import { createClient } from '@/utils/supabaseServer'

export default async function MemeAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10 font-sans">
        <div className="bg-white p-12 rounded-[48px] shadow-xl border border-slate-100 text-center max-w-md">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Auth Required</h2>
          <p className="text-slate-400 text-sm mb-8 uppercase tracking-widest font-mono">Terminal connection lost. Please sign in via the main tool.</p>
        </div>
      </div>
    )
  }

  // 1. DATA FETCHING FOR TABLES
  const fetchTableData = async (table: string) => {
    const { data, count } = await supabase.from(table).select('id, created_by_user_id', { count: 'exact' }).limit(5)
    return { rows: data || [], total: count || 0 }
  }

  // 2. STATS FETCHING FROM OUR NEW VIEW
  const { data: scoreData } = await supabase.from('caption_scores').select('total_votes')
  const { data: topPerformers } = await supabase
    .from('caption_scores')
    .select('display_text, total_votes')
    .order('total_votes', { ascending: false })
    .limit(3)

// This version is "Null-Safe" for the Vercel compiler
const totalRows = scoreData?.length || 0
const avgVotes = totalRows > 0
  ? ((scoreData || []).reduce((acc, curr) => acc + (curr.total_votes || 0), 0) / totalRows).toFixed(2)
  : 0

  const tableList = {
    Profiles: await fetchTableData('profiles'),
    Flavors: await fetchTableData('humor_flavors'),
    Steps: await fetchTableData('humor_flavor_steps'),
    Captions: await fetchTableData('captions')
  }

  return (
    <main className="p-10 bg-slate-50 min-h-screen font-sans selection:bg-blue-500">
      <header className="mb-12 max-w-7xl mx-auto flex justify-between items-end">
        <div>
          <h1 className="text-6xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">Admin Domain</h1>
          <p className="text-[10px] font-mono text-slate-400 mt-4 uppercase tracking-[0.4em] italic">Michael_Audit_System_v12 // Online</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[9px] font-mono text-slate-300 uppercase">Authorized_Node</p>
          <p className="text-[10px] font-bold text-blue-600 truncate max-w-[200px]">{user.email}</p>
        </div>
      </header>

      {/* STATS SECTION */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        <div className="bg-blue-600 text-white p-10 rounded-[42px] shadow-[0_20px_40px_rgba(37,99,235,0.2)] flex flex-col justify-between">
          <h4 className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-8">Avg Engagement</h4>
          <div>
            <p className="text-5xl font-black leading-none">{avgVotes}</p>
            <p className="text-[10px] uppercase font-bold mt-2 opacity-60 tracking-tighter">Avg Votes Per Caption</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[42px] shadow-sm border border-slate-200 col-span-2 flex flex-col">
          <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-8">Top Performing Captions</h4>
          <div className="space-y-4 flex-grow">
            {topPerformers && topPerformers.length > 0 ? (
              topPerformers.map((cap, i) => (
                <div key={i} className="flex justify-between items-center text-xs group">
                  <span className="font-bold text-slate-700 truncate mr-6 group-hover:text-blue-600 transition-colors">
                    "{cap.display_text}"
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="h-[2px] w-8 bg-slate-100 group-hover:bg-blue-100 transition-colors"></div>
                    <span className="font-mono font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase text-[9px]">
                      {cap.total_votes} pts
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[10px] font-mono text-slate-300 italic">Calculating_Data_Streams...</p>
            )}
          </div>
        </div>
      </section>

      {/* AUDIT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {Object.entries(tableList).map(([name, data]) => (
          <div key={name} className="bg-white p-8 rounded-[38px] shadow-sm border border-slate-200 hover:border-blue-200 transition-all group">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
              <h3 className="text-xs font-black uppercase text-slate-400 group-hover:text-blue-600 tracking-widest transition-colors">{name}</h3>
              <span className="text-[10px] font-mono text-slate-300 font-bold">{data.total}</span>
            </div>
            <div className="space-y-3">
              {data.rows.map((row: any) => (
                <div key={row.id} className="text-[8px] font-mono bg-slate-50 p-4 rounded-2xl border border-slate-100 truncate text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm transition-all">
                  AUDIT_ID: {row.created_by_user_id || 'SYSTEM_GEN'}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="h-20" />
    </main>
  )
}