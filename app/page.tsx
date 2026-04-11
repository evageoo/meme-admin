import { createClient } from '@/utils/supabaseServer'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function Week7AdminDashboard() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md border border-slate-200">
          <h1 className="text-3xl font-black mb-4 text-slate-900 uppercase tracking-tighter">Admin Area</h1>
          <form action={async () => {
            'use server'
            const supabase = await createClient()
            const { data } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `https://${process.env.VERCEL_URL}/auth/callback` },
            })
            if (data.url) redirect(data.url)
          }}>
            <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg uppercase text-xs tracking-widest">Sign In</button>
          </form>
        </div>
      </main>
    )
  }

  const { data: profile } = await supabase.from('profiles').select('is_superadmin').eq('id', user.id).single()
  if (!profile?.is_superadmin) return <main className="h-screen flex items-center justify-center bg-black text-red-500 font-black">ACCESS DENIED</main>

  // FETCHING ALL TABLES FROM YOUR SCREENSHOTS
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
    allowed_signup_domains: await fetchTable('allowed_signup_domains'),
    whitelisted_emails: await fetchTable('whitelisted_emails'),
  }

  return (
    <main className="p-10 bg-slate-50 min-h-screen">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-5xl font-black tracking-tighter uppercase text-slate-900">Domain Model</h1>
        <div className="flex gap-4 items-center">
            <span className="text-xs font-bold text-slate-500 bg-white border px-4 py-2 rounded-full shadow-sm">{user.email}</span>
            <form action={async () => {
              'use server'
              const supabase = await createClient()
              await supabase.auth.signOut()
              revalidatePath('/')
            }}>
              <button className="text-[10px] font-black uppercase text-red-500 border border-slate-200 px-3 py-1.5 rounded-md hover:bg-red-50 transition-all">Logout</button>
            </form>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.entries(tables).map(([name, data]) => (
          <div key={name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
               <h3 className="text-[10px] font-black uppercase text-slate-400">{name.replace(/_/g, ' ')}</h3>
               <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{data.length}</span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {data.slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="text-[9px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                  {item.email || item.name || item.content || item.id}
                  <div className="text-[7px] text-slate-300 mt-1 uppercase">ID: {item.id.slice(0,8)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}