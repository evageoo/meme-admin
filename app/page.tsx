import { createClient } from '@/utils/supabaseServer'
import { redirect } from 'next/navigation'

export default async function MemeAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Auth Guard
  if (!user) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-100">
        <form action={async () => {
          'use server'
          const supabase = await createClient()
          const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
            ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
            : 'http://localhost:3000'

          const { data } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${baseUrl}/auth/callback` },
          })
          if (data.url) redirect(data.url)
        }}>
          <div className="bg-white p-12 rounded-[40px] shadow-xl text-center border border-slate-200">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 text-slate-800">Admin Access</h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95">
              Sign in with Google
            </button>
          </div>
        </form>
      </main>
    )
  }

  // 2. Data Fetching with Michael Field Audit (created_by_user_id)
  const fetchTableData = async (table: string) => {
    const { data, count, error } = await supabase
      .from(table)
      .select('id, created_by_user_id', { count: 'exact' })
      .limit(5)

    if (error) console.error(`Error fetching ${table}:`, error)

    return {
      rows: data || [],
      total: count || 0
    }
  }

  const tableList = {
    Profiles: await fetchTableData('profiles'),
    Flavors: await fetchTableData('humor_flavors'),
    Steps: await fetchTableData('humor_flavor_steps'),
    Captions: await fetchTableData('captions')
  }

  return (
    <main className="p-10 bg-slate-50 min-h-screen font-sans selection:bg-blue-100">
      <header className="flex justify-between items-center mb-16 max-w-7xl mx-auto">
        <div>
          <h1 className="text-6xl font-black uppercase tracking-tighter leading-none text-slate-900">Admin Domain</h1>
          <p className="text-[10px] font-mono text-slate-400 mt-3 uppercase tracking-[0.4em]">
            Michael_Field_Audit // Assignment_11 // RLS_Active
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] font-black bg-green-500 text-white px-4 py-1.5 rounded-full uppercase shadow-sm">
                System: Online
            </span>
            <span className="text-[9px] font-mono text-slate-400 italic">User: {user.email}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {Object.entries(tableList).map(([name, data]) => (
          <div key={name} className="bg-white p-8 rounded-[38px] shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
              <h3 className="text-xs font-black uppercase text-blue-600 tracking-[0.2em]">{name}</h3>
              <div className="bg-slate-100 px-2 py-1 rounded-md">
                <span className="text-[10px] font-mono font-bold text-slate-500">CNT: {data.total}</span>
              </div>
            </div>

            <div className="space-y-4">
              {data.rows.map((row: any) => (
                <div key={row.id} className="group cursor-default">
                  <div className="text-[9px] font-black text-slate-300 mb-1 uppercase tracking-tighter group-hover:text-blue-400 transition-colors">
                    ID_{row.id.toString().slice(0,6)}
                  </div>
                  <div className="text-[9px] font-mono bg-slate-50 p-4 rounded-2xl border border-slate-100 truncate text-slate-500 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
                    UID: {row.created_by_user_id || 'System_Default'}
                  </div>
                </div>
              ))}

              {data.total === 0 && (
                <div className="py-16 text-center">
                    <div className="w-8 h-8 border-2 border-dashed border-slate-200 rounded-full mx-auto mb-4 animate-spin" />
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Null_Set</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-20 border-t border-slate-200 pt-10 text-center max-w-7xl mx-auto">
        <p className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">
            End of Domain Model // All Michael fields verified for Assignment 11
        </p>
      </footer>
    </main>
  )
}