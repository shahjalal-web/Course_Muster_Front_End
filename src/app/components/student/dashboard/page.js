/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */

"use client";
import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://course-muster-back-end.vercel.app";

/* Recharts dynamic imports (client-only) */
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), {
  ssr: false,
});
const Area = dynamic(() => import("recharts").then((m) => m.Area), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), {
  ssr: false,
});
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), {
  ssr: false,
});
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), {
  ssr: false,
});
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), {
  ssr: false,
});
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), {
  ssr: false,
});
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), {
  ssr: false,
});

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("No auth token found in localStorage. Please login.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/course/student/progress`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Status ${res.status}`);
        }
        const json = await res.json();
        if (!mounted) return;
        setProgressData(json);
        if (json.courses && json.courses.length)
          setSelectedCourseId(json.courses[0].courseId);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(err.message || "Failed to load dashboard data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // derived safe variables
  const courses = progressData?.courses || [];
  const overall = progressData?.overall || {
    totalLessons: 0,
    lessonsCompleted: 0,
    lessonsRemaining: 0,
    quizzesTaken: 0,
    assignmentsSubmitted: 0,
    avgQuizScore: null,
    quizBuckets: [
      { name: "0-49", value: 0 },
      { name: "50-69", value: 0 },
      { name: "70-89", value: 0 },
      { name: "90-100", value: 0 },
    ],
  };

  // pick a display name if present in data (purchase item studentName) otherwise fallback
  const displayName = useMemo(() => {
    if (courses.length > 0) {
      for (const c of courses) {
        if (c.rawPurchase && c.rawPurchase.studentName)
          return c.rawPurchase.studentName;
      }
    }
    return "Student";
  }, [courses]);

  // timeline: simple synthetic weekly timeline based on overall.lessonsCompleted (split into 5 recent points)
  const progressTimeline = useMemo(() => {
    const completed = overall.lessonsCompleted || 0;
    const pts = 5;
    const base = Math.floor(completed / pts);
    const remainder = completed - base * pts;
    return Array.from({ length: pts }).map((_, i) => ({
      week: `W${i + 1}`,
      completed: base + (i < remainder ? 1 : 0),
    }));
  }, [overall.lessonsCompleted]);

  // distribution: use courses by category/title (fall back if none)
  const courseDistribution = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    // map by title (or category)
    const map = {};
    courses.forEach((c) => {
      const key = (c.title || c.courseId || "Course").slice(0, 20);
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [courses]);

  // recent courses: use the courses list, most recent purchases first by purchasedAt
  const recentCourses = useMemo(() => {
    const arr = (courses || []).slice().map((c) => ({
      id: c.courseId,
      title: c.title,
      thumbnail: c.thumbnail || "/placeholder-course.png",
      progress:
        c.lessonCounts && c.lessonCounts.total
          ? Math.round(
              ((c.progress?.completed || 0) / c.lessonCounts.total) * 100
            )
          : 0,
      batchName: c.batchName || "Batch",
      purchasedAt: c.purchasedAt || null,
    }));
    arr.sort((a, b) => {
      const ta = a.purchasedAt ? new Date(a.purchasedAt).getTime() : 0;
      const tb = b.purchasedAt ? new Date(b.purchasedAt).getTime() : 0;
      return tb - ta;
    });
    return arr.slice(0, 6);
  }, [courses]);

  const COLORS = ["#06b6d4", "#7c3aed", "#34d399", "#f59e0b", "#fb7185"];

  const fmtDate = (d) => {
    try {
      if (!d) return "—";
      return new Date(d).toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-pulse h-8 w-40 bg-gray-200 rounded mb-4 mx-auto" />
          <div className="text-sm text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Welcome back, {displayName} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Here's your latest progress summary (from the real API)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs text-slate-500">Overall completion</span>
              <span className="text-sm font-medium text-slate-800">
                {overall.totalLessons === 0
                  ? "—"
                  : `${Math.min(
                      100,
                      Math.round(
                        (overall.lessonsCompleted / overall.totalLessons) * 100
                      )
                    )}%`}
              </span>
            </div>

            <Link href="/components/courses">
              <p className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-linear-to-r from-indigo-600 to-cyan-500 text-white shadow-sm text-sm">
                Browse courses
              </p>
            </Link>
          </div>
        </div>

        {/* top stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Courses"
            value={courses.length}
            subtitle="Purchased"
            accent="from-indigo-50 to-indigo-100"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3M3 21h18"
                />
              </svg>
            }
          />
          <StatCard
            title="Lessons"
            value={`${overall.lessonsCompleted} / ${overall.totalLessons}`}
            subtitle="Completed / Total"
            accent="from-emerald-50 to-emerald-100"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4"
                />
              </svg>
            }
          />
          <StatCard
            title="Quizzes"
            value={overall.quizzesTaken}
            subtitle={`Avg ${overall.avgQuizScore ?? "—"}%`}
            accent="from-yellow-50 to-yellow-100"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3"
                />
              </svg>
            }
          />
          <StatCard
            title="Assignments"
            value={overall.assignmentsSubmitted}
            subtitle="Submitted"
            accent="from-pink-50 to-pink-100"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-pink-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 17v-2a4 4 0 018 0v2"
                />
              </svg>
            }
          />
        </div>

        {/* main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Weekly progress (derived) */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-slate-700">
                    Recent Progress
                  </h3>
                  <p className="text-xs text-slate-400">
                    Approximation based on total completed lessons
                  </p>
                </div>
                <div className="text-xs text-slate-500">Last 5 intervals</div>
              </div>

              <div style={{ height: 220 }} className="min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressTimeline}>
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#7c3aed"
                      fill="#ede9fe"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* distribution + recent activity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  Course distribution
                </h4>
                <div style={{ height: 180 }} className="min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          courseDistribution.length
                            ? courseDistribution
                            : [{ name: "No courses", value: 1 }]
                        }
                        dataKey="value"
                        nameKey="name"
                        outerRadius={60}
                        innerRadius={30}
                        label
                      >
                        {(courseDistribution.length
                          ? courseDistribution
                          : [{ name: "No courses", value: 1 }]
                        ).map((entry, idx) => (
                          <Cell
                            key={entry.name}
                            fill={COLORS[idx % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 space-y-2">
                  {(courseDistribution.length
                    ? courseDistribution
                    : [{ name: "No courses", value: 1 }]
                  ).map((c, i) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          style={{ background: COLORS[i % COLORS.length] }}
                          className="w-3 h-3 rounded-full inline-block"
                        />
                        <span className="text-slate-700 truncate">
                          {c.name}
                        </span>
                      </div>
                      <div className="text-slate-500">{c.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  Recent courses
                </h4>
                <div className="space-y-3">
                  {recentCourses.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No courses found.
                    </div>
                  ) : (
                    recentCourses.map((c) => (
                      <div key={c.id} className="flex items-center gap-3">
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <img
                            src={c.thumbnail}
                            alt={c.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-800 truncate">
                            {c.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {c.batchName} • {fmtDate(c.purchasedAt)}
                          </div>
                          <div className="mt-1">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div
                                style={{ width: `${c.progress}%` }}
                                className="h-2 rounded-full bg-linear-to-r from-indigo-500 to-cyan-400"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: profile & quick stats */}
          <aside className="space-y-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-indigo-400 to-cyan-400 text-white flex items-center justify-center text-lg font-semibold">
                  {displayName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {displayName}
                  </div>
                  <div className="text-xs text-slate-500">Student</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="p-2 bg-indigo-50 rounded text-center">
                  <div className="text-xs text-slate-500">Avg quiz</div>
                  <div className="text-sm font-medium text-indigo-700 mt-1">
                    {overall.avgQuizScore ?? "—"}%
                  </div>
                </div>
                <div className="p-2 bg-emerald-50 rounded text-center">
                  <div className="text-xs text-slate-500">Quizzes</div>
                  <div className="text-sm font-medium text-emerald-700 mt-1">
                    {overall.quizzesTaken}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <p className="flex-1 px-3 py-2 rounded-md border text-sm text-slate-700 hover:bg-slate-50 text-center">
                  Profile
                </p>
                <button className="px-3 py-2 rounded-md bg-linear-to-r from-purple-600 to-indigo-600 text-white text-sm">
                  Settings
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                Quick stats
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Lessons completed</span>
                  <span className="font-medium">
                    {overall.lessonsCompleted}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lessons remaining</span>
                  <span className="font-medium">
                    {overall.lessonsRemaining}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Assignments submitted</span>
                  <span className="font-medium">
                    {overall.assignmentsSubmitted}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* Small presentational component for stat cards */
function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent = "from-indigo-50 to-indigo-100",
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg bg-linear-to-br ${accent}`}>{icon}</div>
        <div>
          <div className="text-xs text-slate-500">{title}</div>
          <div className="text-xl font-semibold text-slate-800">{value}</div>
          {subtitle && (
            <div className="text-xs text-slate-400 mt-1">{subtitle}</div>
          )}
        </div>
      </div>
    </div>
  );
}
