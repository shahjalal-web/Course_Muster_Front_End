"use client";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Welcome, Admin 👋</h1>
          <p className="text-slate-500 mt-1">
            Here’s your dashboard overview. Manage everything efficiently.
          </p>
        </header>

        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Users" value="152" color="from-indigo-500 to-indigo-600" />
          <StatCard title="Active Courses" value="24" color="from-emerald-500 to-emerald-600" />
          <StatCard title="Pending Tasks" value="7" color="from-yellow-500 to-orange-500" />
          <StatCard title="Support Tickets" value="3" color="from-rose-500 to-pink-600" />
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Announcement */}
            <div className="bg-white p-5 shadow rounded-xl border">
              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Latest Announcement
              </h2>
              <p className="text-slate-600 text-sm">
                🚀 New features coming soon! We are improving analytics and 
                adding batch-wise reporting for all instructors. Stay tuned!
              </p>
            </div>

            {/* Quick Links */}
            <div className="bg-white p-5 shadow rounded-xl border">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Links</h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <QuickLink label="Manage Users" />
                <QuickLink label="Courses" />
                <QuickLink label="Payments" />
                <QuickLink label="Site Settings" />
                <QuickLink label="Notifications" />
                <QuickLink label="Support Desk" />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <aside className="space-y-6">
            {/* Profile */}
            <div className="bg-white p-5 shadow rounded-xl border">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                  AD
                </div>
                <div>
                  <p className="text-slate-800 font-semibold">Admin Dashboard</p>
                  <p className="text-xs text-slate-500">System Administrator</p>
                </div>
              </div>
            </div>

            {/* Small notes */}
            <div className="bg-white p-5 shadow rounded-xl border">
              <h3 className="text-slate-800 text-sm font-semibold mb-2">Notes</h3>
              <ul className="text-sm text-slate-600 list-disc ml-4 space-y-1">
                <li>Check pending support tickets</li>
                <li>Review course publishing requests</li>
                <li>Backup database weekly</li>
              </ul>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

/* Reusable Components */

function StatCard({ title, value, color }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow border flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg bg-linear-to-br ${color} flex items-center justify-center text-white font-bold`}>
        {value}
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-xl font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function QuickLink({ label }) {
  return (
    <button className="w-full p-3 bg-slate-100 hover:bg-slate-200 text-sm rounded-md text-slate-700 transition">
      {label}
    </button>
  );
}
