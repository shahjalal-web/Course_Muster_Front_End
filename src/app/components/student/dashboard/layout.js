"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

export default function StudentLayout({ children }) {
  const [open, setOpen] = useState(true); // desktop sidebar
  const [mobileMenu, setMobileMenu] = useState(false); // mobile drawer

  const pathname = usePathname();
  const router = useRouter();

  const { isAuthenticated, user } = useSelector((s) => s.auth || {});

  useEffect(() => {
    if (typeof isAuthenticated !== "undefined") {
      if (!isAuthenticated || user?.role !== "student") {
        router.push("/components/login");
      }
    }
  }, [isAuthenticated, user, router]);

  const menu = [
    { label: "Dashboard", href: "/components/student/dashboard" },
    { label: "Courses", href: "/components/student/dashboard/courses" },
    { label: "Progress", href: "/components/student/dashboard/progress" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Mobile Top Navbar */}
      <div className="flex items-center justify-between bg-white border-b px-4 py-3 lg:hidden">
        <div className="font-semibold text-lg">Student</div>

        {/* Hamburger Button */}
        <button
          onClick={() => setMobileMenu(true)}
          className="p-2 rounded hover:bg-gray-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:block bg-white border-r border-gray-200 transition-all
           ${open ? "w-72" : "w-16"} h-screen relative`}
        >
          <SidebarContent
            open={open}
            setOpen={setOpen}
            menu={menu}
            pathname={pathname}
            router={router}
          />
        </aside>

        {/* Mobile Sidebar Drawer */}
        {mobileMenu && (
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileMenu(false)}>
            <div
              className="absolute left-0 top-0 bg-white w-64 h-full shadow-lg p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent
                open={true}
                setOpen={false}
                menu={menu}
                pathname={pathname}
                router={router}
                onCloseMobile={() => setMobileMenu(false)}
              />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="bg-white rounded-2xl md:p-6 shadow-sm min-h-[70vh]"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

/* Sidebar Content Component */
function SidebarContent({ open, setOpen, menu, pathname, router, onCloseMobile }) {
  return (
    <>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
            S
          </div>
          {open && <h1 className="font-semibold">Student</h1>}
        </div>

        {/* Toggle Button only if desktop */}
        {setOpen && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-1 rounded hover:bg-gray-100 hidden lg:inline-flex"
          >
            <svg xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600"
              fill="none" viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d={open ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
            </svg>
          </button>
        )}
      </div>

      <nav className="p-3 space-y-1">
        {menu.map((m) => {
          const active = pathname === m.href || pathname?.startsWith(m.href);
          return (
            <Link
              key={m.href}
              href={m.href}
              onClick={onCloseMobile}
            >
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

      {/* Logout */}
      <div className="absolute bottom-4 left-0 right-0 px-3">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            router.push("/components/login");
          }}
          className="text-xs text-red-600 px-2 py-1 rounded hover:bg-red-50 w-full text-left"
        >
          Logout
        </button>
      </div>
    </>
  );
}
