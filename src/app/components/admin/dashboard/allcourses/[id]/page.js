/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://course-muster-back-end.vercel.app";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 text-black">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {course?.title || "Manage Course"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {course?.category || "—"}
            </p>

            <div className="mt-3 flex flex-wrap gap-3 items-center">
              <div className="text-sm text-gray-600">
                Instructor:{" "}
                <span className="font-medium">
                  {course?.instructorName || "—"}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Price:{" "}
                <span className="font-medium">
                  {course?.price > 0 ? `${course.price} BDT` : "Free"}
                </span>
              </div>

              
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-2 border rounded"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="bg-gray-50 rounded p-4">
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {course?.description || "—"}
              </p>
            </div>

            {/* Batches */}
            <div className="mt-4 bg-gray-50 rounded p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold mb-2">Batches</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openAddBatch}
                    className="text-sm text-indigo-600"
                  >
                    + Add batch
                  </button>
                </div>
              </div>

              {course?.batches && course.batches.length > 0 ? (
                <ul className="space-y-2">
                  {course.batches.map((b, idx) => (
                    <li
                      key={batchKey(b, idx, course._id)}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          {b.name || `Batch ${idx + 1}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {b.startDate ? `Start: ${fmtDate(b.startDate)}` : ""}{" "}
                          {b.endDate ? ` • End: ${fmtDate(b.endDate)}` : ""}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {/* optional batch meta */}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">No batches defined.</div>
              )}

              {/* Add-batch inline form (modal-like) */}
              {showAddBatch && (
                <div className="mt-4 p-4 border rounded bg-white shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">
                        Batch name
                      </label>
                      <input
                        value={newBatchName}
                        onChange={(e) => setNewBatchName(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                        placeholder="Batch name"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-600">
                        Start date (optional)
                      </label>
                      <input
                        type="date"
                        value={newBatchStart}
                        onChange={(e) => setNewBatchStart(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-600">
                        End date (optional)
                      </label>
                      <input
                        type="date"
                        value={newBatchEnd}
                        onChange={(e) => setNewBatchEnd(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        onClick={submitAddBatch}
                        disabled={addingBatch}
                        className="px-3 py-2 bg-indigo-600 text-white rounded"
                      >
                        {addingBatch ? "Adding..." : "Save batch"}
                      </button>
                      <button
                        type="button"
                        onClick={closeAddBatch}
                        className="px-3 py-2 border rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {addBatchError && (
                    <div className="text-xs text-red-600 mt-2">
                      {addBatchError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lessons (if available) */}
            <div className="mt-4 bg-gray-50 rounded p-4">
              <h3 className="text-sm font-semibold mb-2">
                Lessons ({displayedLessonsCount})
              </h3>
              <div className="space-y-2">
                {displayedLessonsCount === 0 ? (
                  <div className="text-sm text-gray-500">
                    No lessons in this selection.
                  </div>
                ) : (
                  displayedLessons.map((l) => (
                    <div
                      key={l._id}
                      className="p-2 border rounded bg-white flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          {l.lessonNumber}. {l.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {l.type || "video"}{" "}
                          {l.type === "video" && l.durationMinutes
                            ? `• ${l.durationMinutes} min`
                            : ""}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {l.batchId ? `Batch: ${l.batchId}` : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Purchases / students */}
          <div>
            <div className="bg-gray-50 rounded p-4">
              <h3 className="text-sm font-semibold mb-3">
                Purchases ({displayedPurchasesCount})
              </h3>

              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : !course ? (
                <div className="text-sm text-gray-500">No data</div>
              ) : displayedPurchasesCount > 0 ? (
                <div className="space-y-2 max-h-[42vh] overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500">
                        <th className="pb-2">Student</th>
                        <th className="pb-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedPurchases.map((p) => (
                        <tr
                          key={p._id || p.student || Math.random()}
                          className="border-t"
                        >
                          <td className="py-2">{p.studentName || "—"}</td>
                          <td className="py-2">
                            <Link
                              href={`/components/admin/dashboard/users/${
                                p._id || p.id
                              }`}
                              className="px-3 py-1 rounded-md border text-sm bg-blue-400 hover:bg-slate-50"
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
                <div className="text-sm text-gray-500">
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
