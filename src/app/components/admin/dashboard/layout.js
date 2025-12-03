"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(true); // sidebar open by default
  const pathname = usePathname();
  const router = useRouter();

  // get auth info from redux (adjust if your state shape differs)
  const { isAuthenticated, user } = useSelector((s) => s.auth || {});

  useEffect(() => {
    // redirect to admin login if not authenticated or not admin
    if (typeof isAuthenticated !== "undefined") {
      if (!isAuthenticated || user?.role !== "admin") {
        router.push("/components/login");
      }
    }
  }, [isAuthenticated, user, router]);

  const menu = [
    { label: "Dashboard", href: "/components/admin/dashboard" },
    { label: "Users", href: "/components/admin/dashboard/users" },
    { label: "Add Courses", href: "/components/admin/dashboard/courses" },
    { label: "Add Lesson", href: "/components/admin/dashboard/lesson" },
    { label: "All Courses", href: "/components/admin/dashboard/allcourses" },
    { label: "Reports", href: "/components/admin/dashboard/reports" },
    { label: "Settings", href: "/components/admin/dashboard/settings" },
    { label: "Profile", href: "/components/admin/dashboard/profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto flex">
        {/* Sidebar */}
        <aside
          className={`bg-white border-r border-gray-200 transition-all
            ${open ? "w-72" : "w-16"} h-screen relative`}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
                A
              </div>
              {open && <h1 className="font-semibold">Admin</h1>}
            </div>

            <button
              onClick={() => setOpen((v) => !v)}
              className="p-1 rounded hover:bg-gray-100"
              aria-label="Toggle sidebar"
            >
              {/* chevron */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={open ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
                />
              </svg>
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {menu.map((m) => {
              const active =
                pathname === m.href || (m.href !== "/components/admin/dashboard" && pathname?.startsWith(m.href));
              return (
                <Link key={m?.href} href={m?.href}>
                  <p
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100
                      ${active ? "bg-indigo-50 border border-indigo-100 text-indigo-700" : "text-gray-700"}`}
                  >
                    <span className="h-6 w-6 flex items-center justify-center text-sm bg-gray-100 rounded">
                      {m.label[0]}
                    </span>
                    {open && <span className="text-sm font-medium">{m.label}</span>}
                  </p>
                </Link>
              );
            })}
          </nav>

          {/* bottom area — logout, small info */}
          <div className="absolute bottom-4 left-0 right-0 px-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                {open && (
                  <p className="text-xs text-gray-500">
                    {user ? `Logged in as ${user.name ?? user.email}` : "Admin area"}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  // simple client-side logout: clear token and redirect
                  // replace with your redux logout action if available
                  try {
                    localStorage.removeItem("token");
                  } catch (err) {
                    console.warn(err);
                  }
                  router.push("/components/admin/dashboard/login");
                }}
                className="text-xs text-red-600 px-2 py-1 rounded hover:bg-red-50"
              >
                {open ? "Logout" : "⎋"}
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="bg-white rounded-2xl p-6 shadow-sm min-h-[70vh]"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
