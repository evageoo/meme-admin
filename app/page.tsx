import { createClient } from '@/utils/supabaseServer'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function Week7AdminDashboard() {
  const supabase = await createClient()

  // 1. AUTHENTICATION & SECURITY GATES
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md border border-slate-200">
          <h1 className="text-3xl font-black mb-4 text-slate-900">Admin Area</h1>
          <p className="text-slate-600 mb-8 font-medium">Authentication required for domain management.</p>
          <form action={async () => {
            'use server'
            const supabase = await createClient()
            const { data } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `http://localhost:3001/auth/callback` },
            })
            if (data.url) redirect(data.url)
          }}>
            <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">
              SIGN IN WITH GOOGLE
            </button>
          </form>
        </div>
      </main>
    )
  }

  // 2. SUPERADMIN CHECK
  const { data: profile } = await supabase.from('profiles').select('is_superadmin').eq('id', user.id).single()

  if (!profile?.is_superadmin) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-black text-red-500 text-center p-6">
        <h1 className="text-5xl font-black mb-4">ACCESS DENIED</h1>
        <p className="text-slate-400 mb-8">User {user.email} is not authorized for the Domain Model.</p>
        <form action={async () => {
          'use server'
          const supabase = await createClient()
          await supabase.auth.signOut()
          revalidatePath('/')
        }}>
          <button className="px-8 py-3 bg-white text-black rounded-xl font-bold uppercase tracking-widest">Sign Out</button>
        </form>
      </main>
    )
  }

  // 3. DOMAIN MODEL DATA FETCHING
  const fetchTable = async (table: string) => (await supabase.from(table).select('*')).data || []

  const tables = {
    profiles: await fetchTable('profiles'),
    images: await fetchTable('images'),
    humor_flavors: await fetchTable('humor_flavors'),
    humor_flavor_steps: await fetchTable('humor_flavor_steps'),
    terms: await fetchTable('terms'),
    captions: await fetchTable('captions'),
    caption_requests: await fetchTable('caption_requests'),
    caption_examples: await fetchTable('caption_examples'),
    llm_models: await fetchTable('llm_models'),
    llm_providers: await fetchTable('llm_providers'),
    llm_prompt_chains: await fetchTable('llm_prompt_chains'),
    llm_responses: await fetchTable('llm_responses'),
    allowed_domains: await fetchTable('allowed_signup_domains'),
    whitelist: await fetchTable('whitelisted_emails'),
  }

  return (
    <main className="p-10 bg-slate-50 min-h-screen">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-5xl font-black tracking-tighter">DOMAIN MODEL</h1>
        <div className="bg-white px-4 py-2 rounded-full border shadow-sm text-sm font-bold text-slate-500">
           {user.email}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(tables).map(([name, data]) => (
          <div key={name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-1">{name.replace('_', ' ')}</h3>
            <p className="text-3xl font-black text-slate-900 mb-4">{data.length}</p>
            <div className="space-y-1 h-32 overflow-y-auto border-t pt-2">
              {data.slice(0, 5).map((item: any, i: number) => (
                <div key={i} className="text-[10px] text-slate-500 truncate bg-slate-50 p-1 rounded">
                  {item.email || item.name || item.content || item.id}
                </div>
              ))}
              {data.length > 5 && <p className="text-[9px] text-slate-400 italic">+{data.length - 5} more records</p>}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}