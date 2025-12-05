"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

/**
 * Responsive AdminLayout
 * - Desktop: collapsible sidebar (w-72 <-> w-16)
 * - Mobile: off-canvas sidebar (hamburger in topbar, overlay)
 * - Keeps existing behavior (redirect to login if not admin)
 *
 * Usage: wrap admin pages with <AdminLayout> ... </AdminLayout>
 */

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(true); // desktop collapsed state (true => expanded)
  const [mobileOpen, setMobileOpen] = useState(false); // mobile off-canvas
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const menu = [
    { label: "Dashboard", href: "/components/admin/dashboard" },
    { label: "Users", href: "/components/admin/dashboard/users" },
    { label: "Add Courses", href: "/components/admin/dashboard/courses" },
    { label: "Add Lesson", href: "/components/admin/dashboard/lesson" },
    { label: "All Courses", href: "/components/admin/dashboard/allcourses" },
  ];

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
    } catch (err) {
      console.warn(err);
    }
    // optionally dispatch redux logout here
    router.push("/components/admin/dashboard/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Topbar for mobile + small desktops */}
      <div className="md:hidden bg-white border-b">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-md bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">A</div>
              <div className="text-sm font-semibold">Admin</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600 hidden sm:block">Welcome{user?.name ? `, ${user.name}` : ""}</div>
            <button onClick={handleLogout} className="px-3 py-1 text-sm text-red-600 rounded hover:bg-red-50">Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto flex">
        {/* Sidebar - desktop */}
        <aside
          className={`hidden md:block bg-white border-r border-gray-200 transition-all duration-200
            ${open ? "w-72" : "w-16"} h-screen relative`}
          aria-hidden={false}
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
              aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={open ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
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
                    role="menuitem"
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
                onClick={handleLogout}
                className="text-xs text-red-600 px-2 py-1 rounded hover:bg-red-50"
              >
                {open ? "Logout" : "⎋"}
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile off-canvas sidebar */}
        <div
          className={`fixed inset-0 z-40 md:hidden transition-opacity ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          aria-hidden={!mobileOpen}
        >
          {/* overlay */}
          <div
            onClick={() => setMobileOpen(false)}
            className={`absolute inset-0 bg-black/40 ${mobileOpen ? "opacity-100" : "opacity-0"}`}
            aria-hidden="true"
          />

          {/* panel */}
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: mobileOpen ? 0 : -320 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-72 h-full bg-white border-r shadow-lg"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
                  A
                </div>
                <h1 className="font-semibold">Admin</h1>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded hover:bg-gray-100" aria-label="Close menu">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
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
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100
                        ${active ? "bg-indigo-50 border border-indigo-100 text-indigo-700" : "text-gray-700"}`}
                    >
                      <span className="h-6 w-6 flex items-center justify-center text-sm bg-gray-100 rounded">
                        {m.label[0]}
                      </span>
                      <span className="text-sm font-medium">{m.label}</span>
                    </p>
                  </Link>
                );
              })}
            </nav>

            <div className="absolute bottom-4 left-0 right-0 px-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">{user ? `${user.name ?? user.email}` : "Admin area"}</p>
                </div>
                <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="text-xs text-red-600 px-2 py-1 rounded hover:bg-red-50">Logout</button>
              </div>
            </div>
          </motion.aside>
        </div>

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
