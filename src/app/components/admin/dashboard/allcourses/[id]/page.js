/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/";

// Utility: format date nicely
function fmtDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleString();
}

// helper to return stable batch id for options (works with _id or id or fallback index key)
function batchKey(b, idx, courseId) {
  return b._id || b.id || `${courseId}-batch-${idx + 1}`;
}

export default function ManageCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id || params?.courseId || null;

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // selected batch state: empty string => All batches
  const [selectedBatchId, setSelectedBatchId] = useState("");

  // Add-batch UI state
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchStart, setNewBatchStart] = useState("");
  const [newBatchEnd, setNewBatchEnd] = useState("");
  const [addingBatch, setAddingBatch] = useState(false);
  const [addBatchError, setAddBatchError] = useState(null);

  useEffect(() => {
    if (!courseId) return;
    fetchCourse();
  }, [courseId, refreshTick]);

  useEffect(() => {
    // when course changes, reset selected batch to '' (All)
    setSelectedBatchId("");
    // also set sensible default next batch name
    if (course) {
      const next = computeNextBatchName(course.batches || [], course._id);
      setNewBatchName(next);
    } else {
      setNewBatchName("");
    }
  }, [courseId, course?.updatedAt, course]);

  const getLessonBatchLabel = (lesson) => {
    const id = lesson.batchId;
    const name = lesson.batchName;

    // jodi API theke already name thake, oita use kori
    if (name) return name;

    if (!id) return "";

    // jodi batchOptions e match thake (same id diye)
    const opt = batchOptions.find((o) => String(o.value) === String(id));
    if (opt) return opt.label;

    // jodi pattern eirokom hoy: 69304932ac7c93b763f96bb1-batch-1
    const m = String(id).match(/batch[-\s_]?(\d+)/i);
    if (m && m[1]) {
      return `Batch ${m[1]}`;
    }

    // fallback: pura id dekhai
    return String(id);
  };

  const fetchCourse = async () => {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_BASE}/api/course/${courseId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Course not found");
        throw new Error("Failed to load course");
      }
      const data = await res.json();
      // assume API returns { course } or course object directly
      const courseObj = data?.course ? data.course : data;
      setCourse(courseObj);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => setRefreshTick((t) => t + 1);

  // derive batch options
  const batchOptions = useMemo(() => {
    if (!course || !Array.isArray(course.batches)) return [];
    return course.batches.map((b, idx) => ({
      value: batchKey(b, idx, course._id),
      label: b.name || `Batch ${idx + 1}`,
      raw: b,
      idx,
    }));
  }, [course]);

  // helper to compute next batch name (same logic used for CreateCourse)
  function computeNextBatchName(batchesArray = [], courseIdForKey) {
    let maxNum = 0;
    const numRegex = /(?:batch\s*)?(\d+)\s*$/i;
    (batchesArray || []).forEach((b) => {
      if (!b?.name) return;
      const m = String(b.name).match(numRegex);
      if (m && m[1]) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n) && n > maxNum) maxNum = n;
      }
    });
    const next =
      maxNum > 0 ? maxNum + 1 : batchesArray ? batchesArray.length + 1 : 1;
    return `Batch ${next}`;
  }

  // helper to check equality between a purchase/lesson's batch identity and selectedBatchId
  const matchesSelectedBatch = (itemBatchId, itemBatchName) => {
    if (!selectedBatchId) return true; // All
    if (!itemBatchId && !itemBatchName) return false;
    // direct id match
    if (itemBatchId && String(itemBatchId) === String(selectedBatchId))
      return true;
    // sometimes batch id stored as string without ObjectId format (match fallback)
    if (itemBatchName && selectedBatchId) {
      // find selected option label and compare case-insensitively
      const opt = batchOptions.find(
        (o) => String(o.value) === String(selectedBatchId)
      );
      if (
        opt &&
        opt.label &&
        String(itemBatchName).toLowerCase() === String(opt.label).toLowerCase()
      )
        return true;
    }
    // also allow matching by synthetic key: e.g. `${courseId}-batch-${idx+1}`
    if (
      String(itemBatchId) ===
      `${course._id}-batch-${
        (batchOptions.find((o) => o.value === selectedBatchId)?.idx ?? -1) + 1
      }`
    )
      return true;
    return false;
  };

  // filtered purchases based on selected batch
  const displayedPurchases = useMemo(() => {
    if (!course) return [];
    const all = Array.isArray(course.purchases) ? course.purchases : [];
    if (!selectedBatchId) return all;
    return all.filter((p) => {
      // p may have batchId or batchName stored; try both
      const pBatchId = p.batchId || p.batch || null;
      console.log(p, "hellos")
      const pBatchName = p.batchName || p.batchLabel || p.batchTitle || null;
      return matchesSelectedBatch(pBatchId, pBatchName);
    });
  }, [course, selectedBatchId, batchOptions]);

  // filtered lessons based on selected batch
  const displayedLessons = useMemo(() => {
    if (!course) return [];
    const all = Array.isArray(course.lessons) ? course.lessons : [];
    if (!selectedBatchId) return all;
    return all.filter((l) => {
      const lBatchId = l.batchId || l.batch || null;
      const lBatchName = l.batchName || null;
      return matchesSelectedBatch(lBatchId, lBatchName);
    });
  }, [course, selectedBatchId, batchOptions]);

  // count shown
  const displayedPurchasesCount = displayedPurchases.length;
  const displayedLessonsCount = displayedLessons.length;

  // ---------- Add Batch handlers ----------
  const openAddBatch = () => {
    setAddBatchError(null);
    const next = computeNextBatchName(course?.batches || [], course?._id);
    setNewBatchName(next);
    setNewBatchStart("");
    setNewBatchEnd("");
    setShowAddBatch(true);
  };

  const closeAddBatch = () => {
    setShowAddBatch(false);
    setAddingBatch(false);
    setAddBatchError(null);
  };

  const submitAddBatch = async () => {
    setAddBatchError(null);
    // basic validation
    if (!newBatchName || String(newBatchName).trim().length < 1) {
      setAddBatchError("Batch name required");
      return;
    }

    setAddingBatch(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const body = {
        name: newBatchName.trim(),
        startDate: newBatchStart || null,
        endDate: newBatchEnd || null,
      };

      // call backend API to append batch: POST /api/course/:id/batches
      const res = await fetch(`${API_BASE}/api/course/${courseId}/batches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || data?.error || "Failed to add batch";
        throw new Error(msg);
      }

      // prefer server-returned updated course or new batch; if server returns updated course set it
      if (data?.course) {
        setCourse(data.course);
      } else if (data?.batch) {
        // if server returns just new batch, append locally
        setCourse((c) => {
          if (!c) return c;
          const nextBatches = Array.isArray(c.batches)
            ? [...c.batches, data.batch]
            : [data.batch];
          return { ...c, batches: nextBatches };
        });
      } else {
        // fallback: re-fetch course
        handleRefresh();
      }

      closeAddBatch();
    } catch (err) {
      console.error("add batch err", err);
      setAddBatchError(err?.message || "Failed to add batch");
    } finally {
      setAddingBatch(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-500 via-sky-500 to-emerald-400 py-8 px-4 text-black">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-6 md:p-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-linear-to-r from-purple-500 to-pink-500 text-white shadow-sm">
                Manage Course
              </span>
              {course?.category && (
                <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-sky-100 text-sky-700">
                  {course.category}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold bg-linear-to-r from-indigo-600 via-rose-500 to-orange-400 bg-clip-text text-transparent">
              {course?.title || "Course Title"}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700">
                <span className="text-xs uppercase tracking-wide font-semibold">
                  Instructor
                </span>
                <span className="font-medium">
                  {course?.instructorName || "—"}
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
                <span className="text-xs uppercase tracking-wide font-semibold">
                  Price
                </span>
                <span className="font-semibold">
                  {course?.price > 0 ? `${course.price} BDT` : "Free"}
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700">
                <span className="text-xs uppercase tracking-wide font-semibold">
                  Lessons
                </span>
                <span className="font-semibold">
                  {Array.isArray(course?.lessons) ? course.lessons.length : 0}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-sky-500 to-indigo-600 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:brightness-110 transition"
            >
              <span className="material-symbols-outlined text-base">
                refresh
              </span>
              Refresh
            </button>

            {error && (
              <div className="mt-1 text-xs px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 max-w-xs text-right">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Optional loading bar */}
        {loading && (
          <div className="mt-4 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full w-1/2 bg-linear-to-r from-indigo-500 via-sky-400 to-emerald-400 animate-[pulse_1.5s_ease-in-out_infinite]" />
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2/3: description, batches, lessons */}
          <div className="md:col-span-2 space-y-5">
            {/* Description */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <span className="inline-block h-6 w-6 rounded-full bg-linear-to-br from-indigo-500 to-sky-500 text-white items-center justify-center text-xs">
                    i
                  </span>
                  Course Description
                </h3>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {course?.description || "No description provided yet."}
              </p>
            </div>

            {/* Batches */}
            <div className="rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-sky-50 to-emerald-50 p-4 md:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <span className="h-7 w-7 rounded-full bg-linear-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center text-xs font-bold">
                      B
                    </span>
                    Batches
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage enrollment windows and organize lessons by batch.
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {/* Batch filter select */}
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-full border border-sky-200 bg-white/70 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    {batchOptions.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={openAddBatch}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-linear-to-r from-pink-500 to-orange-400 text-white shadow-sm hover:shadow-md hover:brightness-110 transition"
                  >
                    <span className="text-base leading-none">＋</span>
                    Add batch
                  </button>
                </div>
              </div>

              {course?.batches && course.batches.length > 0 ? (
                <ul className="space-y-2">
                  {course.batches.map((b, idx) => (
                    <li
                      key={batchKey(b, idx, course._id)}
                      className="flex items-center justify-between rounded-xl bg-white/80 border border-slate-100 px-3 py-2.5 shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold bg-linear-to-br from-indigo-500 to-sky-500 text-white">
                            {idx + 1}
                          </span>
                          <div className="font-medium text-sm text-slate-800">
                            {b.name || `Batch ${idx + 1}`}
                          </div>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                          {b.startDate && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Start: {fmtDate(b.startDate)}
                            </span>
                          )}
                          {b.endDate && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
                              End: {fmtDate(b.endDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {/* placeholder for future meta */}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-slate-500 italic">
                  No batches defined yet. Create one to start enrolling
                  students.
                </div>
              )}

              {/* Add-batch inline form (modal-like) */}
              {showAddBatch && (
                <div className="mt-4 p-4 border border-purple-100 rounded-2xl bg-white/90 shadow-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 font-medium">
                        Batch name
                      </label>
                      <input
                        value={newBatchName}
                        onChange={(e) => setNewBatchName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-slate-50/60"
                        placeholder="Batch name"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-medium">
                        Start date (optional)
                      </label>
                      <input
                        type="date"
                        value={newBatchStart}
                        onChange={(e) => setNewBatchStart(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-slate-50/60"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-medium">
                        End date (optional)
                      </label>
                      <input
                        type="date"
                        value={newBatchEnd}
                        onChange={(e) => setNewBatchEnd(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 bg-slate-50/60"
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        onClick={submitAddBatch}
                        disabled={addingBatch}
                        className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-linear-to-r from-purple-500 to-indigo-500 text-white shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition"
                      >
                        {addingBatch ? "Adding..." : "Save batch"}
                      </button>
                      <button
                        type="button"
                        onClick={closeAddBatch}
                        className="px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {addBatchError && (
                    <div className="text-xs text-rose-600 mt-2">
                      {addBatchError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lessons */}
            <div className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50 via-indigo-50 to-purple-50 p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-linear-to-br from-sky-500 to-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                    L
                  </span>
                  Lessons ({displayedLessonsCount})
                </h3>
                {selectedBatchId && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                    Filtered by batch
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {displayedLessonsCount === 0 ? (
                  <div className="text-sm text-slate-500 italic">
                    No lessons in this selection.
                  </div>
                ) : (
                  displayedLessons.map((l) => (
                    <div
                      key={l._id}
                      className="p-3 border border-slate-100 rounded-2xl bg-white/90 flex items-center justify-between shadow-sm hover:border-sky-200 transition"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-sm text-slate-800">
                          {l.lessonNumber}. {l.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {l.type || "video"}
                          </span>
                          {l.type === "video" && l.durationMinutes && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {l.durationMinutes} min
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 text-right">
                        {l.batchId && (
                          <span className="md:block inline-flex px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
                            {`Batch: ${getLessonBatchLabel(l)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right 1/3: Purchases / students */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50 via-sky-50 to-lime-50 p-4 md:p-5 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-linear-to-br from-emerald-500 to-lime-500 text-white flex items-center justify-center text-xs font-bold">
                    S
                  </span>
                  Purchases ({displayedPurchasesCount})
                </h3>
              </div>

              {loading && !course ? (
                <div className="text-sm text-slate-500">Loading...</div>
              ) : !course ? (
                <div className="text-sm text-slate-500">No data</div>
              ) : displayedPurchasesCount > 0 ? (
                <div className="space-y-2 max-h-[42vh] overflow-auto rounded-2xl border border-emerald-100 bg-white/80">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-linear-to-r from-emerald-50 to-sky-50">
                      <tr className="text-left text-[11px] text-slate-500">
                        <th className="px-3 py-2 font-semibold">Student</th>
                        <th className="px-3 py-2 font-semibold text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedPurchases.map((p) => (
                        <tr
                          key={p._id || p.student || Math.random()}
                          className="border-t border-emerald-100 hover:bg-emerald-50/50 transition"
                        >
                          <td className="px-3 py-2 text-[13px] text-slate-800">
                            {p.studentName || "—"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Link
                              href={`/components/admin/dashboard/users/${p.student}`}
                              className="inline-flex items-center justify-center px-3 py-1.5 rounded-full border border-sky-300 text-[11px] font-semibold bg-sky-100 hover:bg-sky-500 hover:text-white transition"
                            >
                              See Progress
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  No purchases in this selection.
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
