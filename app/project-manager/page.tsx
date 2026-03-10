import { createClient } from '@/utils/supabase/server';
import { signOut } from '@/app/actions';

export default async function ProjectManagerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900 tracking-wide">LANGRPROS</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <form action={signOut}>
              <button className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Project Manager</h1>
          <p className="text-gray-500 mt-1">Manage your projects and teams</p>
        </div>

        {/* Stats cards - Behance style grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="border border-gray-100 rounded-lg p-6">
            <div className="w-12 h-12 bg-[#1769ff]/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#1769ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-gray-900">12</p>
            <p className="text-sm text-gray-500 mt-1">Active Projects</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-6">
            <div className="w-12 h-12 bg-[#1769ff]/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#1769ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-gray-900">24</p>
            <p className="text-sm text-gray-500 mt-1">Team Members</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-6">
            <div className="w-12 h-12 bg-[#1769ff]/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#1769ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-4xl font-bold text-gray-900">8</p>
            <p className="text-sm text-gray-500 mt-1">Completed</p>
          </div>
        </div>

        {/* Welcome card */}
        <div className="bg-[#1769ff] rounded-lg p-8 text-white">
          <h2 className="text-2xl font-semibold mb-2">Welcome back! 👋</h2>
          <p className="text-white/80">You have full access to the Project Manager dashboard.</p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded text-sm font-medium">
            Role: pm
          </div>
        </div>
      </main>
    </div>
  );
}
