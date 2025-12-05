/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://course-muster-back-end.vercel.app";

export default function EnrollmentsViewerPage() {
  const router = useRouter();
  const user = useSelector((s) => s?.auth?.user || null); // adjust if your auth slice differs

  const [loading, setLoading] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [course, setCourse] = useState(null);
  const [courseLoading, setCourseLoading] = useState(false);

  useEffect(() => {
    // If no user in redux, send to login
    if (!user) {
      const next = "/enrollments"; // adjust if this page path differs
      router.push(`/auth/login?next=${encodeURIComponent(next)}`);
      return;
    }

    // fetch enrollments for this user
    async function fetchEnrollments() {
      setLoading(true);
      setError(null);
      setEnrollments([]);
      setSelectedEnrollment(null);
      setCourse(null);

      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;
        const userId = user?.id || user?._id || user?.userId || null;
        if (!userId) {
          setError("User id not available.");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `${API_BASE}/api/course/student/user/${encodeURIComponent(
            userId
          )}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Status ${res.status}`);
        }

        const data = await res.json();
        const list = data.enrollments || [];
        setEnrollments(list);

        if (list.length > 0) {
          // auto-select first enrollment
          setSelectedEnrollment(list[0]);
          // load the course for the first enrollment
          loadCourseForEnrollment(list[0], token || undefined);
        } else {
          setError("You have no enrollments yet.");
        }
      } catch (err) {
        console.error(err);
        setError(err?.message || "Failed to fetch enrollments.");
      } finally {
        setLoading(false);
      }
    }

    fetchEnrollments();
    // only run when user changes
  }, [user, router]);

  async function loadCourseForEnrollment(
    enroll,
    providedToken
  ) {
    if (!enroll || !enroll.courseId) return;
    setSelectedEnrollment(enroll);
    setCourse(null);
    setCourseLoading(true);
    setError(null);

    try {
      const token =
        providedToken ??
        (typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null);
      const res = await fetch(
        `${API_BASE}/api/course/${encodeURIComponent(enroll.courseId)}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }
      const data = await res.json();
      const courseObj = data.course || data;
      setCourse(courseObj);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to load course data.");
    } finally {
      setCourseLoading(false);
    }
  }

  // helpers
  const fmtDate = (d) => {
    try {
      if (!d) return "—";
      return new Date(d).toLocaleString();
    } catch {
      return String(d);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-4 px-3 sm:px-6 lg:px-8 text-black overflow-x-hidden">
      {/* Page header */}
      <div className="w-full rounded-2xl p-4 sm:p-6 mb-6 bg-linear-to-r from-green-400 via-teal-500 to-indigo-600 text-white shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-extrabold truncate">
              My Enrollments
            </h1>
            <p className="mt-1 text-xs sm:text-sm opacity-90">
              Manage courses you're enrolled in — access batches, payments and
              details
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right">
              <div className="text-[11px] sm:text-xs opacity-90">
                Total enrollments
              </div>
              <div className="text-lg sm:text-xl font-semibold">
                {enrollments.length}
              </div>
            </div>
            <button
              onClick={() => router.push("/components/courses")}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-xs sm:text-sm"
            >
              Browse courses
            </button>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left column - list */}
        <div className="lg:col-span-1 w-full">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border w-full">
            <div className="px-3 sm:px-4 py-3 border-b flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 font-medium">
                  Your Enrollments
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {enrollments.length} item
                  {enrollments.length !== 1 ? "s" : ""}
                </div>
              </div>
              {loading ? (
                <div className="text-xs text-gray-400">Loading...</div>
              ) : null}
            </div>

            <div className="max-h-[62vh] overflow-y-auto">
              {enrollments.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  You haven't enrolled in any course yet.
                </div>
              ) : (
                <ul className="divide-y w-full">
                  {enrollments.map((en) => {
                    const isActive =
                      selectedEnrollment &&
                      String(selectedEnrollment._id) === String(en._id);
                    return (
                      <li
                        key={en._id}
                        className={`p-3 sm:p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          isActive
                            ? "bg-linear-to-r from-indigo-50 to-white"
                            : ""
                        }`}
                        onClick={() => loadCourseForEnrollment(en)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") loadCourseForEnrollment(en);
                        }}
                      >
                        <div
                          className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium ${
                            isActive
                              ? "bg-indigo-600 text-white shadow"
                              : "bg-linear-to-br from-green-100 to-teal-100 text-teal-700"
                          }`}
                        >
                          {en.user && (en.user.name || en.user.email)
                            ? en.user.name
                              ? en.user.name[0].toUpperCase()
                              : en.user.email[0].toUpperCase()
                            : String(en.courseId || "C")[0].toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-800 truncate">
                                {en.courseTitle || en.courseId}
                              </div>
                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                Batch: {en.batchId || "Any"}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 whitespace-nowrap">
                              {new Date(
                                en.createdAt
                              ).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                            <div className="text-xs w-full sm:w-auto">
                              {en.payment?.method ? (
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                    {en.payment.method}
                                  </span>
                                  {en.payment.cardLast4 && (
                                    <span className="text-xs text-gray-400">
                                      •••• {en.payment.cardLast4}
                                    </span>
                                  )}
                                  {en.payment.trxId && (
                                    <span className="text-xs text-gray-400">
                                      trx: {en.payment.trxId}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  No payment info
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-end w-full sm:w-auto">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const courseIdSafe =
                                    encodeURIComponent(en.courseId);
                                  const batchIdSafe = en.batchId
                                    ? encodeURIComponent(en.batchId)
                                    : "";
                                  const url = batchIdSafe
                                    ? `/components/student/dashboard/courses/${courseIdSafe}/batch/${batchIdSafe}`
                                    : `/components/student/dashboard/courses/${courseIdSafe}`;
                                  router.push(url);
                                }}
                                className="px-2 py-1 text-xs rounded-md bg-linear-to-r from-purple-500 to-indigo-600 text-white hover:opacity-95 focus:outline-none"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right column - details */}
        <div className="lg:col-span-2 w-full">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 min-h-[62vh] flex flex-col w-full">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
              <div>
                <div className="text-sm text-gray-500">Course Details</div>
                {courseLoading && (
                  <div className="text-xs text-gray-400 mt-1">
                    Loading course...
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {selectedEnrollment &&
                selectedEnrollment.payment?.method ? (
                  <div className="text-xs text-gray-500 text-right">
                    <div className="text-right">Paid via</div>
                    <div className="font-medium">
                      {selectedEnrollment.payment.method}
                    </div>
                  </div>
                ) : (
                  <div className="px-2 py-1 rounded bg-yellow-50 text-yellow-700 text-xs">
                    Free / No payment
                  </div>
                )}
              </div>
            </div>

            {!course ? (
              <div className="mt-6 text-sm text-gray-500">
                Select an enrollment from the left to view course information
                here.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h2 className="text-lg font-semibold text-gray-800 truncate">
                    {course.title}
                  </h2>
                  <div className="text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-linear-to-r from-green-100 to-teal-100 text-teal-700">
                      {course.category || "General"}
                    </span>
                    <span className="inline-block text-xs text-gray-500">
                      By {course.instructorName || "—"}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mt-4 whitespace-pre-wrap">
                    {course.description}
                  </p>

                  {/* content summary */}
                  {(() => {
                    const lessons = course?.lessons || [];
                    const counts = lessons.reduce(
                      (acc, l) => {
                        acc.lessons++;
                        const t = String(l.type || "video").toLowerCase();
                        if (t === "video") acc.videos++;
                        else if (t === "quiz") acc.quizzes++;
                        else if (t === "assignment") acc.assignments++;
                        return acc;
                      },
                      {
                        lessons: 0,
                        videos: 0,
                        quizzes: 0,
                        assignments: 0,
                      }
                    );
                    return (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 border rounded bg-linear-to-br from-white to-indigo-50 text-center">
                          <div className="text-xs text-gray-500">
                            Lessons
                          </div>
                          <div className="font-medium mt-1">
                            {counts.lessons}
                          </div>
                        </div>
                        <div className="p-3 border rounded bg-linear-to-br from-white to-green-50 text-center">
                          <div className="text-xs text-gray-500">
                            Videos
                          </div>
                          <div className="font-medium mt-1">
                            {counts.videos}
                          </div>
                        </div>
                        <div className="p-3 border rounded bg-linear-to-br from-white to-yellow-50 text-center">
                          <div className="text-xs text-gray-500">
                            Quizzes
                          </div>
                          <div className="font-medium mt-1">
                            {counts.quizzes}
                          </div>
                        </div>
                        <div className="p-3 border rounded bg-linear-to-br from-white to-pink-50 text-center">
                          <div className="text-xs text-gray-500">
                            Assignments
                          </div>
                          <div className="font-medium mt-1">
                            {counts.assignments}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 border rounded bg-white">
                      <div className="text-xs text-gray-500">Price</div>
                      <div className="font-medium mt-1">
                        {course.price > 0
                          ? `${course.price} BDT`
                          : "Free"}
                      </div>
                    </div>
                    <div className="p-3 border rounded bg-white">
                      <div className="text-xs text-gray-500">
                        Total Purchases
                      </div>
                      <div className="font-medium mt-1">
                        {course.totalPurchases ?? 0}
                      </div>
                    </div>
                    <div className="p-3 border rounded bg-white">
                      <div className="text-xs text-gray-500">Batches</div>
                      <div className="font-medium mt-1">
                        {(course.batches || []).length}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-sm font-medium mb-3">Batches</div>
                    <div className="space-y-3">
                      {(() => {
                        const batchId =
                          selectedEnrollment?.batchId || null;
                        if (!batchId) {
                          return (
                            <div className="p-3 border rounded bg-white">
                              <div className="font-medium text-sm">
                                Open / Any batch
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                You enrolled without selecting a specific batch
                                — course access is open.
                              </div>
                            </div>
                          );
                        }

                        const matched = (course.batches || []).find(
                          (b, idx) => {
                            const computedKey =
                              b._id || b.id || `${course._id}-batch-${idx + 1}`;
                            return (
                              String(computedKey) === String(batchId) ||
                              (b.name &&
                                String(b.name).toLowerCase() ===
                                  String(batchId).toLowerCase())
                            );
                          }
                        );

                        if (!matched) {
                          return (
                            <div className="p-3 border rounded bg-white">
                              <div className="font-medium text-sm">
                                Enrolled batch not found
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                The batch you enrolled in wasn't found in this
                                course's batch list.
                              </div>
                            </div>
                          );
                        }

                        const idx = (course.batches || []).indexOf(
                          matched
                        );
                        return (
                          <div className="p-3 border rounded bg-linear-to-r from-teal-50 to-white">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">
                                  {matched.name || `Batch ${idx + 1}`}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {matched.startDate
                                    ? new Date(
                                        matched.startDate
                                      ).toLocaleDateString()
                                    : "No start date"}
                                </div>
                              </div>
                              <div className="text-xs text-teal-700">
                                Enrolled here
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <aside className="lg:col-span-1">
                  <div className="space-y-3 lg:sticky lg:top-6">
                    <div className="p-3 bg-linear-to-r from-indigo-50 to-white border rounded">
                      <div className="text-xs text-gray-500">
                        Enrolled On
                      </div>
                      <div className="font-medium mt-1">
                        {selectedEnrollment
                          ? fmtDate(selectedEnrollment.createdAt)
                          : "—"}
                      </div>
                    </div>

                    <div className="p-3 bg-linear-to-r from-yellow-50 to-white border rounded">
                      <div className="text-xs text-gray-500">
                        Payment
                      </div>
                      <div className="mt-1 text-sm">
                        {selectedEnrollment?.payment ? (
                          <>
                            <div className="font-medium">
                              {selectedEnrollment.payment.method}
                            </div>
                            {selectedEnrollment.payment.cardLast4 && (
                              <div className="text-xs text-gray-500">
                                Card • ••••{" "}
                                {selectedEnrollment.payment.cardLast4}
                              </div>
                            )}
                            {selectedEnrollment.payment.trxId && (
                              <div className="text-xs text-gray-500">
                                trx: {selectedEnrollment.payment.trxId}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-gray-500">
                            No payment info
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global error */}
      {error && (
        <div className="mt-6 p-3 rounded bg-red-50 border border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
