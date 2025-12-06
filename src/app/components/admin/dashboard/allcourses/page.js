/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://course-muster-back-end.vercel.app";

// AllCourses page (client-side filtering + per-batch expansion)

export default function AllCoursesPage() {
  const [allCourses, setAllCourses] = useState([]); // raw courses from backend (fetched once)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // filters (UI-controlled)
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [instructor, setInstructor] = useState("");
  const [priceFilter, setPriceFilter] = useState("all"); // all | free | paid

  // filter options (derived from allCourses)
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);

  // pagination (client-side)
  const [page, setPage] = useState(1);
  const limit = 6;
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchAllCourses(); // fetch once on mount
  }, []);


  // fetch all courses once
  async function fetchAllCourses() {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_BASE}/api/course/all-courses`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to load courses");
      const data = await res.json();
      // backend returns array of courses
      const courses = Array.isArray(data) ? data : data.items || [];
      setAllCourses(courses || []);

      // populate filters from data
      const cats = new Set();
      const ins = new Set();
      (courses || []).forEach((c) => {
        if (c.category) cats.add(c.category);
        if (c.instructorName) ins.add(c.instructorName);
        // also check batches for batch-level instructor overrides (rare)
      });
      setCategories(Array.from(cats));
      setInstructors(Array.from(ins));
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  // Expand courses into display items: one item per batch (if batches exist) or single item
  const expandedItems = useMemo(() => {
    const items = [];
    for (const c of allCourses || []) {
      if (Array.isArray(c.batches) && c.batches.length > 0) {
        c.batches.forEach((b, idx) => {
          items.push({
            courseId: c._id,
            title: c.title,
            category: c.category || "General",
            instructorName: c.instructorName || null,
            price: typeof c.price === "number" ? c.price : Number(c.price) || 0,
            thumbnail: c.thumbnail || null,
            batchId: b._id || b.id || `${c._id}-batch-${idx + 1}`,
            batchName: b.name || `Batch ${idx + 1}`,
            batchStartDate: b.startDate || null,
            batchEndDate: b.endDate || null,
            rawCourse: c,
            rawBatch: b,
          });
        });
      } else {
        items.push({
          courseId: c._id,
          title: c.title,
          category: c.category || "General",
          instructorName: c.instructorName || null,
          price: typeof c.price === "number" ? c.price : Number(c.price) || 0,
          thumbnail: c.thumbnail || null,
          batchId: null,
          batchName: null,
          batchStartDate: null,
          batchEndDate: null,
          rawCourse: c,
          rawBatch: null,
        });
      }
    }
    return items;
  }, [allCourses]);

  // client-side filtering
  const filteredItems = useMemo(() => {
    const qLower = (q || "").trim().toLowerCase();
    return expandedItems.filter((it) => {
      if (qLower) {
        const inTitle = (it.title || "").toLowerCase().includes(qLower);
        const inCategory = (it.category || "").toLowerCase().includes(qLower);
        if (!inTitle && !inCategory) return false;
      }
      if (category && String(category).trim() !== "") {
        if (it.category !== category) return false;
      }
      if (instructor && String(instructor).trim() !== "") {
        if ((it.instructorName || "") !== instructor) return false;
      }
      if (priceFilter === "free") {
        if (!(Number(it.price) === 0)) return false;
      } else if (priceFilter === "paid") {
        if (!(Number(it.price) > 0)) return false;
      }
      return true;
    });
  }, [expandedItems, q, category, instructor, priceFilter]);

  // update pagination total whenever filteredItems change
  useEffect(() => {
    setTotal(filteredItems.length);
    setPage(1); // reset page to 1 when filter results change
  }, [filteredItems]);

  // paginated items to display
  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredItems.slice(start, start + limit);
  }, [filteredItems, page]);

  function resetFilters() {
    setQ("");
    setCategory("");
    setInstructor("");
    setPriceFilter("all");
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 text-black">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">All Courses</h1>
            <p className="text-sm text-gray-500">
              Browse and filter courses offered on the platform.
            </p>
          </div>
        </div>

        {/* Filters panel */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search courses by title or category..."
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white"
            >
              <option value="">All instructors</option>
              {instructors.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>

            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white"
            >
              <option value="all">All prices</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div className="mt-3 flex items-center gap-3">
            {/* Apply is not necessary because filtering is live, but keep a control for manual refresh */}
            <button
              type="button"
              onClick={() => {
                /* noop - filters apply live */
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 border rounded"
            >
              Reset
            </button>
          </div>
        </div>

        {/* courses grid */}
        <div>
          {loading ? (
            <div className="text-center py-20">Loading courses...</div>
          ) : error ? (
            <div className="text-center py-20 text-red-600">{error}</div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-20 text-gray-600">
              No courses found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((it) => (
                <div
                  key={`${it.courseId}-${it.batchId || "nobatch"}`}
                  className="bg-white rounded-lg shadow overflow-hidden"
                >
                  <Link href={`/components/admin/dashboard/allcourses/${it.courseId}`} className="block">
                    <div className="h-44 bg-gray-100 w-full flex items-center justify-center overflow-hidden">
                      {it.thumbnail ? (
                        <img
                          src={it.thumbnail}
                          alt={it.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400">No image</div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg leading-tight">
                      {it.title}{" "}
                      {it.batchName ? (
                        <span className="text-sm font-normal text-gray-500">
                          — {it.batchName}
                        </span>
                      ) : null}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {it.category || "General"}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        By: {it.instructorName || "—"}
                      </div>
                      <div className="font-semibold">
                        {it.price > 0 ? `${it.price} BDT` : "Free"}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      
                      <Link
                        href={`/components/admin/dashboard/allcourses/${it.courseId}`}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* pagination */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <div className="px-3 py-1 border rounded">
            Page {page} / {totalPages}
          </div>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </motion.div>
    </div>
  );
}
