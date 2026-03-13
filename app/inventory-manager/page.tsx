import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/actions";
import Link from "next/link";
import Button from "@/components/Button";

export default async function InventoryManagerDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("user_role")
    .eq("user_email", user?.email)
    .single();

  const userRole = roleData?.user_role || "inventory";
  const roleTitles: Record<string, string> = {
    inventory: "Inventory Manager",
    project: "Project Manager",
    tech: "Technician",
    admin: "Administrator",
  };
  const roleTitle = roleTitles[userRole] || "User";

  // Fetch counts from assets table
  const [totalItemsData, damagedData, availableData] = await Promise.all([
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("is_deleted", false),
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("condition", "damaged")
      .eq("is_deleted", false),
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("status", "available")
      .eq("is_deleted", false),
  ]);

  const totalItems = totalItemsData.count || 0;
  const damagedItems = damagedData.count || 0;
  const availableItems = availableData.count || 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900 tracking-wide">
              LANGRPROS
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <form action={signOut}>
              <Button variant="secondary" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {roleTitle}
          </h1>
          <p className="text-gray-500 mt-1">Track and manage your inventory</p>
        </div>

        {/* Stats cards -  style grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="border border-gray-100 rounded-lg p-6">
            <div className="w-12 h-12 bg-[#00d26a]/10 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[#00d26a]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <p className="text-4xl font-bold text-gray-900">{totalItems}</p>
            <p className="text-sm text-gray-500 mt-1">Total Items</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-6">
            <div className="w-12 h-12 bg-[#ffbd2e]/10 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[#ffbd2e]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-4xl font-bold text-gray-900">{damagedItems}</p>
            <p className="text-sm text-gray-500 mt-1">Damaged Items</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-6">
            <div className="w-12 h-12 bg-[#1769ff]/10 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[#1769ff]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <p className="text-4xl font-bold text-gray-900">{availableItems}</p>
            <p className="text-sm text-gray-500 mt-1">Available Items</p>
          </div>
        </div>

        {/* Quick Access Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Link
            href="/inventory-manager/equipments"
            className="flex items-center justify-between p-6 border border-gray-100 rounded-lg hover:border-gray-200 hover:shadow-sm transition-all group"
          >
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-[#00d26a] transition-colors">
                View All Equipment
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                See the complete inventory list
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-[#00d26a]/10 transition-colors">
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-[#00d26a]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </div>
          </Link>
          <Link
            href="/inventory-manager/add"
            className="flex items-center justify-between p-6 border border-gray-100 rounded-lg hover:border-gray-200 hover:shadow-sm transition-all group"
          >
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-[#1769ff] transition-colors">
                Add New Item
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Add equipment to inventory
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-[#1769ff]/10 transition-colors">
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-[#1769ff]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
          </Link>
        </div>

        {/* Welcome card */}
        <div className="bg-[#00d26a] rounded-lg p-8 text-white">
          <h2 className="text-2xl font-semibold mb-2">Welcome back! 👋</h2>
          <p className="text-white/80">
            You have full access to the Inventory Manager dashboard.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded text-sm font-medium">
            Role: {roleTitle}
          </div>
        </div>
      </main>
    </div>
  );
}
