import { createClient } from '@/utils/supabase/server';
import { signOut } from '@/app/actions';

export default async function TechDashboard() {
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
                    <h1 className="text-3xl font-bold text-gray-900">Technician Dashboard</h1>
                    <p className="text-gray-500 mt-1">Manage maintenance and technical tasks</p>
                </div>

                {/* Stats cards - Behance style grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="border border-gray-100 rounded-lg p-6">
                        <div className="w-12 h-12 bg-[#ff5722]/10 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-[#ff5722]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-4xl font-bold text-gray-900">5</p>
                        <p className="text-sm text-gray-500 mt-1">Pending Tasks</p>
                    </div>
                    <div className="border border-gray-100 rounded-lg p-6">
                        <div className="w-12 h-12 bg-[#1769ff]/10 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-[#1769ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <p className="text-4xl font-bold text-gray-900">3</p>
                        <p className="text-sm text-gray-500 mt-1">In Progress</p>
                    </div>
                    <div className="border border-gray-100 rounded-lg p-6">
                        <div className="w-12 h-12 bg-[#00d26a]/10 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-[#00d26a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-4xl font-bold text-gray-900">18</p>
                        <p className="text-sm text-gray-500 mt-1">Completed</p>
                    </div>
                </div>

                {/* Welcome card */}
                <div className="bg-[#ff5722] rounded-lg p-8 text-white">
                    <h2 className="text-2xl font-semibold mb-2">Welcome back! 👋</h2>
                    <p className="text-white/80">You have full access to the Technician dashboard.</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded text-sm font-medium">
                        Role: tech
                    </div>
                </div>
            </main>
        </div>
    );
}
