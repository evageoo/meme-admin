import { createClient } from '@/utils/supabaseServer'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // 1. LOGIN WALL
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md border border-slate-200">
          <h1 className="text-3xl font-black mb-4 text-slate-900">Admin Area</h1>
          <p className="text-slate-600 mb-8 font-medium">Please sign in to access the dashboard.</p>

          <form action={async () => {
            'use server'
            const supabase = await createClient()
            const { data } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `http://localhost:3001/auth/callback` },
            })
            if (data.url) redirect(data.url)
          }}>
            <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
              SIGN IN WITH GOOGLE
            </button>
          </form>
        </div>
      </main>
    )
  }

  // 2. SUPERADMIN CHECK
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center p-12 bg-white border-4 border-red-500 rounded-3xl shadow-2xl max-w-lg">
          <h1 className="text-5xl font-black text-red-600 mb-4 tracking-tighter">ACCESS DENIED</h1>
          <p className="text-xl font-bold text-slate-800 uppercase mb-4">Superadmin Required</p>
          <p className="text-slate-500 mb-8 font-medium italic">Current user: {user.email}</p>
          <form action={async () => { 'use server'; const supabase = await createClient(); await supabase.auth.signOut(); redirect('/'); }}>
            <button className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold">Sign Out</button>
          </form>
        </div>
      </main>
    )
  }

  // 3. FETCH DATA
  const { data: profiles } = await supabase.from('profiles').select('*')
  const { data: images } = await supabase.from('images').select('*').order('created_datetime_utc', { ascending: false })
  const { data: captions } = await supabase.from('captions').select('*, images(url)').limit(5)

  // 4. SERVER ACTIONS
  async function addImage(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const url = formData.get('url') as string
    if (!url) return
    await supabase.from('images').insert([{ url: url, created_datetime_utc: new Date().toISOString() }])
    revalidatePath('/')
  }

  async function deleteImage(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const id = formData.get('id')
    await supabase.from('images').delete().eq('id', id)
    revalidatePath('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
          <div>
            <h1 className="text-6xl font-black tracking-tighter">CONTROL</h1>
            <p className="text-slate-400 font-bold tracking-[0.2em] text-xs mt-1 uppercase">Admin Environment</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 pr-6 rounded-full shadow-sm border border-slate-200">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-black">A</div>
            <span className="text-sm font-bold text-slate-600">{user.email}</span>
          </div>
        </header>

        {/* STATS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-slate-400 font-bold text-xs uppercase mb-2">Total Profiles</h3>
            <p className="text-5xl font-black text-blue-600">{profiles?.length || 0}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-slate-400 font-bold text-xs uppercase mb-2">Image Assets</h3>
            <p className="text-5xl font-black text-indigo-600">{images?.length || 0}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-slate-400 font-bold text-xs uppercase mb-2">Global Captions</h3>
            <p className="text-5xl font-black text-emerald-600">{captions?.length || 0}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* IMAGE CRUD */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-black mb-6">Manage Images</h2>
              <form action={addImage} className="flex gap-3 mb-8">
                <input name="url" placeholder="New Image URL..." className="flex-1 p-4 bg-slate-50 border rounded-2xl outline-none" required />
                <button type="submit" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all">UPLOAD</button>
              </form>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images?.map((img) => (
                  <div key={img.id} className="relative group rounded-2xl overflow-hidden aspect-square border bg-slate-100">
                    <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <form action={deleteImage}>
                        <input type="hidden" name="id" value={img.id} />
                        <button className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-xs">DELETE</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            {/* PROFILES READ */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-black mb-6">Profiles</h2>
              <div className="space-y-3">
                {profiles?.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm font-bold truncate">{p.email}</p>
                    {p.is_superadmin && <span className="text-[10px] font-black text-blue-600 uppercase">Superadmin</span>}
                  </div>
                ))}
              </div>
            </section>

            {/* CAPTIONS READ */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-black mb-6">Recent Captions</h2>
              <div className="space-y-4">
                {captions?.map((cap: any) => (
                  <div key={cap.id} className="flex gap-3 items-center border-b pb-3">
                    <img src={cap.images?.url} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <p className="text-xs font-medium text-slate-600 italic">"{cap.content}"</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  )
}