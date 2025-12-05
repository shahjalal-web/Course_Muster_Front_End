// app/courses/page.jsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://course-muster-back-end.vercel.app";

/* ---------- CourseCard (in-file) ---------- */
function CourseCard({ course, batchCount = 0, nextStartDate = null, enrollCount = 0 }) {
  const title = course.title;
  const startDate = nextStartDate ? new Date(nextStartDate).toLocaleDateString() : null;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <Link href={`/components/courses/${course._id}`}>
        <p>
          <div className="h-44 bg-gray-100 w-full flex items-center justify-center overflow-hidden">
            {course.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400">No image</div>
            )}
          </div>
        </p>
      </Link>

      <div className="p-4">
        <h3 className="font-semibold text-lg leading-tight truncate">{title}</h3>
        <p className="text-xs text-gray-500 mt-1 truncate">{course.category || "General"}</p>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">By: {course.instructorName || "—"}</div>
          <div className="font-semibold">{course.price > 0 ? `${course.price} BDT` : "Free"}</div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div>
            {batchCount > 0
              ? (startDate ? `Next: ${startDate}` : `${batchCount} batch${batchCount > 1 ? "es" : ""}`)
              : "Open enrollment"}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600">{enrollCount ?? 0} enrolled</div>
            <Link href={`/components/courses/${course._id}`}>
              <p className="text-xs text-indigo-600">View</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page component (client) ---------- */
export default function CoursesPageClient() {
  const searchParams = useSearchParams();

  // filters/UI state
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [instructor, setInstructor] = useState(searchParams.get("instructor") || "");
  const [priceFilter, setPriceFilter] = useState(searchParams.get("price") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const limit = 12;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // dropdown options derived from fetched data
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadCourses(1);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // initial load & when filters change
  useEffect(() => {
    setPage(1);
    loadCourses(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, instructor, priceFilter, sort]);

  async function loadCourses(overridePage = null) {
    setLoading(true);
    setError(null);
    const pg = overridePage ?? page;

    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (instructor) params.set("instructor", instructor);
      if (priceFilter && priceFilter !== "all") params.set("price", priceFilter);
      if (sort && sort !== "newest") params.set("sort", sort);
      params.set("page", String(pg));
      params.set("limit", String(limit));

      const res = await fetch(`${API_BASE}/api/courses/get-all-courses?${params.toString()}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load courses");
      const data = await res.json();

      const arr = data.items || data || [];
      setItems(arr);
      setTotal(typeof data.total === "number" ? data.total : (Array.isArray(arr) ? arr.length : 0));
      setPage(pg);

      // derive filter options if empty
      if ((categories.length === 0 || instructors.length === 0) && Array.isArray(arr)) {
        const cats = new Set();
        const ins = new Set();
        arr.forEach(c => { if (c.category) cats.add(c.category); if (c.instructorName) ins.add(c.instructorName); });
        setCategories(Array.from(cats));
        setInstructors(Array.from(ins));
      }

      // (optional) sync URL - disabled here as you had it commented
    } catch (err) {
      console.error(err);
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  // ONE card per course — aggregate batch info into the course card
  const displayItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map((c) => {
      const batchCount = Array.isArray(c.batches) ? c.batches.length : 0;

      // compute next upcoming start date if present (smallest future date)
      let nextStartDate = null;
      if (Array.isArray(c.batches) && c.batches.length > 0) {
        const dates = c.batches
          .map(b => (b.startDate ? new Date(b.startDate) : null))
          .filter(d => d instanceof Date && !isNaN(d));
        if (dates.length > 0) {
          // choose the earliest date (could be past or future). If you want future only, filter by d > now
          dates.sort((a, b) => a - b);
          nextStartDate = dates[0].toISOString();
        }
      }

      // aggregate enroll count: sum of batch.enrolledCount if available, else fallbacks
      let enrollCount = null;
      if (Array.isArray(c.batches) && c.batches.length > 0) {
        const sums = c.batches.reduce((acc, b) => {
          const v = typeof b.enrolledCount === "number" ? b.enrolledCount : (Array.isArray(b.students) ? b.students.length : 0);
          return acc + (Number.isFinite(v) ? v : 0);
        }, 0);
        enrollCount = sums || null;
      }
      if (enrollCount === null) {
        enrollCount = c.totalPurchases ?? (Array.isArray(c.purchases) ? c.purchases.length : 0);
      }

      return {
        course: c,
        batchCount,
        nextStartDate,
        enrollCount: enrollCount ?? 0,
        key: `${c._id}-course`,
      };
    });
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 text-black">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">All Courses</h1>
          <p className="text-sm text-gray-500">Search, filter and browse courses.</p>
        </header>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or instructor..." className="px-3 py-2 border rounded-md" />

            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border rounded-md bg-white">
              <option value="">All categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={instructor} onChange={(e) => setInstructor(e.target.value)} className="px-3 py-2 border rounded-md bg-white">
              <option value="">All instructors</option>
              {instructors.map(i => <option key={i} value={i}>{i}</option>)}
            </select>

            <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} className="px-3 py-2 border rounded-md bg-white">
              <option value="all">All prices</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 border rounded">
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>

            <button onClick={() => { setQ(""); setCategory(""); setInstructor(""); setPriceFilter("all"); setSort("newest"); loadCourses(1); }} className="px-4 py-2 bg-indigo-600 text-white rounded">Reset</button>
            <div className="ml-auto text-sm text-gray-500">{loading ? "Loading..." : `${displayItems.length} cards — ${total} courses`}</div>
          </div>
        </div>

        <div>
          {loading ? (
            <div className="text-center py-20">Loading courses...</div>
          ) : error ? (
            <div className="text-center py-20 text-red-600">{error}</div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-20 text-gray-600">No courses found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayItems.map(it => (
                <CourseCard
                  key={it.key}
                  course={it.course}
                  batchCount={it.batchCount}
                  nextStartDate={it.nextStartDate}
                  enrollCount={it.enrollCount}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">Showing {displayItems.length} cards — total {total} courses</div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => loadCourses(page - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <div className="px-3 py-1 border rounded">Page {page} / {totalPages}</div>
            <button disabled={page >= totalPages} onClick={() => loadCourses(page + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </main>
  );
}
