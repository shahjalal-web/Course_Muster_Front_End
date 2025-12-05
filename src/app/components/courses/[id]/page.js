/* eslint-disable react-hooks/exhaustive-deps */
// app/courses/[id]/page.jsx
"use client";
import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://course-muster-back-end.vercel.app";

function fmtDate(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "-";
  }
}
function makeBatchKey(courseId, b, idx) {
  return b?._id || b?.id || `${courseId}-batch-${idx + 1}`;
}

export default function CourseDetailPageClient(props) {
  const params = use(props.params); // unwrap the params promise
  const courseId = params?.id; // now safe
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBatch = searchParams?.get("batch") || "";
  const { user, isAuthenticated } = useSelector((state) => state.auth || {});

  const [course, setCourse] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatch || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    const ac = new AbortController();

    const fetchCourse = async () => {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(
          `${API_BASE}/api/courses/${encodeURIComponent(courseId)}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: ac.signal,
          }
        );
        if (!res.ok) {
          if (res.status === 404) throw new Error("Course not found");
          throw new Error("Failed to load course");
        }
        const data = await res.json();
        const courseObj = data?.course ? data.course : data;
        setCourse(courseObj);

        // If no initial batch in URL, select the LAST batch by default (if any)
        if (
          !initialBatch &&
          Array.isArray(courseObj?.batches) &&
          courseObj.batches.length > 0
        ) {
          const lastIndex = courseObj.batches.length - 1;
          const lastKey = makeBatchKey(
            courseObj._id,
            courseObj.batches[lastIndex],
            lastIndex
          );
          setSelectedBatchId(lastKey);
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error(err);
        setError(err.message || "Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
    return () => ac.abort();
  }, [courseId]);

  // helper: check whether a lesson belongs to the selected batch
  const lessonMatchesSelectedBatch = useCallback(
    (l) => {
      if (!selectedBatchId) return true;
      // lesson might have batchId or batchName
      if (!l) return false;
      if (l.batchId && String(l.batchId) === String(selectedBatchId)) return true;
      if (l.batchName) {
        // find the selected batch object (to compare names more robustly)
        const selBatch = course?.batches?.find((b, idx) => {
          const key = makeBatchKey(course._id, b, idx);
          if (String(key) === String(selectedBatchId)) return true;
          return false;
        });
        if (selBatch && String(l.batchName).toLowerCase() === String(selBatch.name).toLowerCase())
          return true;
        // fallback: compare lesson.batchName with selectedBatchId string
        if (String(l.batchName).toLowerCase() === String(selectedBatchId).toLowerCase())
          return true;
      }
      return false;
    },
    [selectedBatchId, course]
  );

  // counts are now batch-aware: if selectedBatchId is set, only count lessons matching that batch
  const counts = useMemo(() => {
    const c = {
      lessons: 0,
      videos: 0,
      quizzes: 0,
      assignments: 0,
      articles: 0,
    };
    if (!course?.lessons || !Array.isArray(course.lessons)) return c;

    for (const l of course.lessons) {
      if (!lessonMatchesSelectedBatch(l)) continue;
      c.lessons++;
      const t = String(l.type || "video").toLowerCase();
      if (t === "video") c.videos++;
      else if (t === "quiz") c.quizzes++;
      else if (t === "assignment") c.assignments++;
      else if (t === "article") c.articles++;
    }
    return c;
  }, [course, selectedBatchId, lessonMatchesSelectedBatch]);

  const isLoggedIn = useCallback(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("token"));
  }, []);

  const getBatchObject = useCallback(() => {
    if (!selectedBatchId || !course?.batches?.length) return null;
    return (
      course.batches.find((b, idx) => {
        const key = makeBatchKey(course._id, b, idx);
        if (String(key) === String(selectedBatchId)) return true;
        if (
          b.name &&
          String(b.name).toLowerCase() === String(selectedBatchId).toLowerCase()
        )
          return true;
        return false;
      }) || null
    );
  }, [selectedBatchId, course]);

  const batchObj = getBatchObject();
  const enrollCount =
    batchObj?.enrolledCount ??
    course?.totalPurchases ??
    (Array.isArray(course?.purchases) ? course.purchases.length : 0);

  const handleEnroll = useCallback(async () => {
    if (!courseId) return;
    if (!isAuthenticated) {
      const next = `/components/checkout?courseId=${encodeURIComponent(
        courseId
      )}${
        selectedBatchId ? `&batch=${encodeURIComponent(selectedBatchId)}` : ""
      }`;
      router.push(`/components/login`);
      return;
    }

    setEnrolling(true);
    try {
      const checkoutUrl = `/components/checkout?courseId=${encodeURIComponent(
        courseId
      )}${
        selectedBatchId ? `&batch=${encodeURIComponent(selectedBatchId)}` : ""
      }`;
      router.push(checkoutUrl);
    } catch (err) {
      console.error(err);
      alert("Failed to start enrollment");
    } finally {
      setEnrolling(false);
    }
  }, [courseId, isLoggedIn, router, selectedBatchId]);

  if (loading) return <div className="p-6 text-center">Loading course...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!course)
    return (
      <div className="p-6 text-center text-gray-600">Course not found.</div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 text-black">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {course.category || "General"} • By {course.instructorName || "—"}
            </p>

            <div className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">
              {course.description}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Lessons</div>
                <div className="font-medium">{counts.lessons}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Quizzes</div>
                <div className="font-medium">{counts.quizzes}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500">Assignments</div>
                <div className="font-medium">{counts.assignments}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-gray-50 rounded p-4 sticky top-6">
              <div className="text-sm text-gray-500">Price</div>
              <div className="text-2xl font-semibold mt-1">
                {course.price > 0 ? `${course.price} BDT` : "Free"}
              </div>

              <div className="mt-4">
                <label className="text-xs text-gray-500 block mb-1">
                  Batch
                </label>
                {Array.isArray(course.batches) && course.batches.length > 0 ? (
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  >
                    {course.batches.map((b, idx) => {
                      const key = makeBatchKey(course._id, b, idx);
                      return (
                        <option key={key} value={key}>
                          {b.name}
                          {b.startDate
                            ? ` • ${new Date(b.startDate).toLocaleDateString()}`
                            : ""}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="text-xs text-gray-500">
                    No batches — open enrollment
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="text-xs text-gray-500">Enrolled</div>
                <div className="font-medium">{enrollCount ?? 0} students</div>
              </div>

              <div className="mt-4">
                {user ? (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg"
                  >
                    {enrolling
                      ? "Processing..."
                      : course.price > 0
                      ? "Enroll Now"
                      : "Get Enrolled"}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      router.push(`/components/login`);
                    }}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    Login to Enrol
                  </button>
                )}
              </div>

              <div className="mt-3 text-xs text-gray-500">
                After enrollment you can access lessons, mark them complete and
                take quizzes/submit assignments.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded p-4">
          <h3 className="text-sm font-semibold mb-2">Course Content</h3>
          {Array.isArray(course.lessons) && course.lessons.length > 0 ? (
            <div className="space-y-2">
              {course.lessons
                .filter((l) => {
                  if (!selectedBatchId) return true;
                  if (!l.batchId && !l.batchName) return false;
                  if (
                    l.batchId &&
                    String(l.batchId) === String(selectedBatchId)
                  )
                    return true;
                  const selBatch = course.batches?.find(
                    (b, idx) =>
                      makeBatchKey(course._id, b, idx) === selectedBatchId
                  );
                  if (
                    selBatch &&
                    l.batchName &&
                    String(l.batchName).toLowerCase() ===
                      String(selBatch.name).toLowerCase()
                  )
                    return true;
                  return false;
                })
                .map((l) => (
                  <div
                    key={l._id || `${l.lessonNumber}-${l.title}`}
                    className="p-3 border rounded flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">
                        {l.lessonNumber}. {l.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {l.type}{" "}
                        {l.type === "video" && l.durationMinutes
                          ? `• ${l.durationMinutes} min`
                          : ""}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {l.type === "video" && l.videoUrl ? "Video" : l.type}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No lessons uploaded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
