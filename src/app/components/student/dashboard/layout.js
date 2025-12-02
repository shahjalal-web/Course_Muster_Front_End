/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux"; // যদি আপনি redux দিয়ে auth রাখেন
import { motion } from "framer-motion";

export default function StudentLayout({ children }) {
  const [open, setOpen] = useState(true); // sidebar open (desktop by default)
  const pathname = usePathname();
  const router = useRouter();

  // AUTH: আপনার প্রকল্পভিত্তিক বদল করবেন
  // উদাহরণ: redux slice থেকে isAuthenticated নেয়া
  const { isAuthenticated, user } = useSelector((s) => s.auth || {});

  useEffect(() => {
    // redirect to admin login if not authenticated or not admin
    if (typeof isAuthenticated !== "undefined") {
      if (!isAuthenticated || user?.role !== "student") {
        router.push("/components/login");
      }
    }
  }, [isAuthenticated, user, router]);

  const menu = [
    { label: "Dashboard", href: "/components/student/dashboard" },
    { label: "Courses", href: "/components/student/dashboard/courses" },
    { label: "Assignments", href: "/components/student/dashboard/assignment" },
    { label: "Profile", href: "/components/student/dashboard/profile" },
    // আপনি চাইলে nested routes বা icons যোগ করুন
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
                S
              </div>
              {open && <h1 className="font-semibold">Student</h1>}
            </div>

            <button
              onClick={() => setOpen((v) => !v)}
              className="p-1 rounded hover:bg-gray-100"
              aria-label="Toggle sidebar"
            >
              {/* simple chevron */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d={open ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
              </svg>
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {menu.map((m) => {
              const active = pathname === m.href || (m.href !== "/student" && pathname?.startsWith(m.href));
              return (
                <Link key={m?.href} href={m?.href}>
                  <p
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100
                      ${active ? "bg-indigo-50 border border-indigo-100 text-indigo-700" : "text-gray-700"}`}
                  >
                    {/* simple icon placeholder */}
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
                {open && <p className="text-xs text-gray-500">Logged in as Student</p>}
              </div>
              <button
                onClick={() => {
                  // আপনার logout logic এখানে
                  localStorage.removeItem("token");
                  // যদি ব্যবহার করেন redux action, dispatch করে clear করুন
                  router.push("/components/login");
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
