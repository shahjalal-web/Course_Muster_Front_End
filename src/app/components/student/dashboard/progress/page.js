/* eslint-disable @next/next/no-img-element */
// pages/student-progress.jsx
"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// Recharts dynamic imports (client only)
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), {
  ssr: false,
});
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), {
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
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), {
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

export default function StudentProgressPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("No auth token found in localStorage. Please login.");
      setLoading(false);
      return;
    }

    fetch(
      "https://course-muster-back-end.vercel.app/api/course/student/progress",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || res.statusText);
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
        if (json.courses && json.courses.length) {
          setSelectedCourseIndex(0); // always first course initially
        }
      })
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-6">No data</div>;

  const { courses, overall } = data;

  const BAR_COLORS = ["#06b6d4", "#7c3aed"]; // cyan, purple
  const PIE_COLORS = ["#06b6d4", "#34d399", "#f59e0b", "#fb7185"];

  const fmtDate = (d) => {
    try {
      if (!d) return "—";
      const dd = new Date(d);
      return dd.toLocaleDateString() + " " + dd.toLocaleTimeString();
    } catch (e) {
      return String(d);
    }
  };

  const selectedCourse =
    courses && courses.length > 0 ? courses[selectedCourseIndex] : null;

  const overallCompletion =
    overall.totalLessons === 0
      ? 0
      : Math.min(
          100,
          Math.round((overall.lessonsCompleted / overall.totalLessons) * 100)
        );

  return (
    <div className="md:p-6 md:max-w-7xl w-full mx-auto text-black">
      {/* Header */}
      <div className="rounded-2xl p-6 mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">Your Learning Dashboard</h1>
            <p className="mt-1 opacity-90">
              Progress summary across all purchased courses
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Overall completion</div>
            <div className="text-2xl font-semibold">
              {overall.totalLessons === 0 ? "—" : `${overallCompletion}%`}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-50">
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
          </div>
          <div>
            <div className="text-sm text-gray-500">Courses purchased</div>
            <div className="text-xl font-semibold">{courses.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50">
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
          </div>
          <div>
            <div className="text-sm text-gray-500">Lessons completed</div>
            <div className="text-xl font-semibold">
              {overall.lessonsCompleted}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-yellow-50">
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
          </div>
          <div>
            <div className="text-sm text-gray-500">Lessons remaining</div>
            <div className="text-xl font-semibold">
              {overall.lessonsRemaining}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-pink-50">
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
          </div>
          <div>
            <div className="text-sm text-gray-500">Quizzes taken</div>
            <div className="text-xl font-semibold">{overall.quizzesTaken}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Lessons: Completed vs Remaining</h3>
            <div className="text-sm text-gray-500">Overall</div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: "Lessons",
                    Completed: overall.lessonsCompleted,
                    Remaining: overall.lessonsRemaining,
                  },
                ]}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="Completed"
                  fill={BAR_COLORS[1]}
                  barSize={32}
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="Remaining"
                  fill={BAR_COLORS[0]}
                  barSize={32}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Quiz Scores</h3>
            <div className="text-sm text-gray-500">Distribution</div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overall.quizBuckets || []}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {(overall.quizBuckets || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Courses list */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Courses</h2>
          <div className="p-2 rounded-2xl font-serif font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg">
            Click a course to see details
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {courses.map((c, idx) => (
            <div
              key={c.courseId || idx}
              onClick={() => setSelectedCourseIndex(idx)}
              className={`cursor-pointer transform hover:-translate-y-1 transition p-4 rounded-xl shadow-md bg-white 
                  flex flex-col gap-4 
                  ${
                    selectedCourseIndex === idx
                      ? "ring-4 ring-indigo-200"
                      : ""
                  }`}
            >
              {/* Thumbnail */}
              <div className="w-full h-40 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 mx-auto sm:mx-0">
                <img
                  src={c.thumbnail || "/placeholder-course.png"}
                  alt={c.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content Section */}
              <div className="flex flex-col w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1">
                  <div className="min-w-0">
                    <div className="font-semibold text-lg truncate">
                      {c.title}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {c.batchName}
                    </div>
                  </div>

                  {/* Purchased Date */}
                  <div className="text-left sm:text-right mt-2 sm:mt-0">
                    <div className="text-sm text-gray-400 leading-tight">
                      Purchased
                    </div>
                    <div className="text-sm font-medium leading-tight">
                      {fmtDate(c.purchasedAt)}
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Lessons</span>
                    <span className="font-medium">{c.lessonCounts.total}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Completed</span>
                    <span className="font-medium">
                      {c.progress.completed}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected course details */}
      {selectedCourse && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">
            Selected Course Details
          </h2>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <div className="text-sm text-gray-500">Lessons</div>
                <div className="text-2xl font-semibold">
                  {selectedCourse.lessonCounts.total}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Videos:{" "}
                  <span className="font-medium text-gray-700">
                    {selectedCourse.lessonCounts.videos}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Quizzes:{" "}
                  <span className="font-medium text-gray-700">
                    {selectedCourse.lessonCounts.quizzes}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Assignments:{" "}
                  <span className="font-medium text-gray-700">
                    {selectedCourse.lessonCounts.assignments}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Progress</div>
                <div className="text-2xl font-semibold">
                  {selectedCourse.progress.completed} completed
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mt-3">
                  <div
                    className="h-3 rounded-full"
                    style={{
                      width: `${
                        selectedCourse.lessonCounts.total === 0
                          ? 0
                          : Math.min(
                              100,
                              Math.round(
                                (selectedCourse.progress.completed /
                                  selectedCourse.lessonCounts.total) *
                                  100
                              )
                            )
                      }%`,
                      background:
                        "linear-gradient(90deg,#7c3aed,#06b6d4)",
                    }}
                  />
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Remaining:{" "}
                  <span className="font-medium text-gray-700">
                    {selectedCourse.progress.remaining}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Assessments</div>
                <div className="text-2xl font-semibold">
                  {selectedCourse.assessments.quizzesTaken} quizzes
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Avg score:{" "}
                  <span className="font-medium text-gray-700">
                    {selectedCourse.assessments.avgQuizScore ?? "—"}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Assignments submitted:{" "}
                  <span className="font-medium text-gray-700">
                    {selectedCourse.assessments.assignmentsSubmitted}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Quizzes detail</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedCourse.quizzes &&
                selectedCourse.quizzes.length > 0 ? (
                  selectedCourse.quizzes.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          {q.title || `Quiz ${idx + 1}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          Attempted:{" "}
                          <span className="font-medium">
                            {q.attempted ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Details:{" "}
                          <span className="text-xs text-gray-400">
                            {q.detailed
                              ? `${q.detailed.length} answers`
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            q.score != null
                              ? q.score >= 70
                                ? "bg-emerald-100 text-emerald-700"
                                : q.score >= 50
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {q.score != null ? `${q.score}%` : "N/A"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    No quizzes available for this course.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
