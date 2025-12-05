/* eslint-disable @next/next/no-img-element */
/* pages/admin/users.jsx */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://course-muster-back-end.vercel.app";

export default function AdminUsersPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sort, setSort] = useState("createdAt_desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, roleFilter, sort]);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("No auth token found. Please login as admin.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (roleFilter) params.set("role", roleFilter);
      if (sort) params.set("sort", sort);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await fetch(
        `${API_BASE}/api/admin/students?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }

      const json = await res.json();
      console.log(json);
      setItems(json.items || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  async function loadDetails(id) {
    setSelected({ loading: true });
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(
        `${API_BASE}/api/admin/students/${encodeURIComponent(id)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }
      const json = await res.json();
      setSelected({ loading: false, student: json.student });
    } catch (err) {
      console.error(err);
      setSelected({ loading: false, error: err.message || "Failed to load" });
    }
  }

  const roleOptions = useMemo(
    () => ["", "student", "admin", "instructor"],
    []
  );

  return (
    <div className="min-h-screen w-full bg-linear-to-b from-slate-50 to-slate-100 py-8 px-3 sm:px-4 text-black overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Students
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              View and manage student accounts (admin area).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setQ("");
                setRoleFilter("");
                setSort("createdAt_desc");
                setPage(1);
                loadUsers();
              }}
              className="text-sm px-3 py-1 border rounded bg-white shadow-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or email"
              className="col-span-1 sm:col-span-2 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-200 w-full"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white w-full"
            >
              <option value="">All roles</option>
              {roleOptions.map(
                (r) =>
                  r !== "" && (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  )
              )}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white w-full"
            >
              <option value="createdAt_desc">Newest</option>
              <option value="createdAt_asc">Oldest</option>
              <option value="name_asc">Name A → Z</option>
              <option value="name_desc">Name Z → A</option>
            </select>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <button
                onClick={() => {
                  setPage(1);
                  loadUsers();
                }}
                className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-md shadow text-sm"
              >
                Search
              </button>
              <button
                onClick={() => {
                  setQ("");
                  setRoleFilter("");
                  setSort("createdAt_desc");
                  setPage(1);
                  loadUsers();
                }}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-gradient-to-r from-indigo-50 to-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700">
                  Role
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-indigo-700 whitespace-nowrap">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-indigo-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-red-600"
                  >
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                items.map((u, idx) => (
                  <tr key={u._id || u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                            u.role === "admin"
                              ? "bg-indigo-600"
                              : "bg-emerald-500"
                          }`}
                        >
                          {u.name
                            ? u.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                            : (u.email || "U")[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-slate-800 truncate">
                            {u.name || "—"}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {u.meta?.job || ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm max-w-xs break-words">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-indigo-100 text-indigo-700"
                            : u.role === "instructor"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {u.role || "student"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                      {new Date(
                        u.createdAt || u.created_at || Date.now()
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <Link
                        href={`/components/admin/dashboard/users/${
                          u._id || u.id
                        }`}
                        className="inline-flex items-center px-3 py-1 rounded-md border text-sm bg-white hover:bg-slate-50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3 mt-2">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found.
            </div>
          ) : (
            items.map((u) => (
              <div
                key={u._id || u.id}
                className="bg-white rounded-lg shadow p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                        u.role === "admin" ? "bg-indigo-600" : "bg-emerald-500"
                      }`}
                    >
                      {u.name
                        ? u.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                        : (u.email || "U")[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 truncate">
                        {u.name || "—"}
                      </div>
                      <div className="text-xs text-slate-400 break-all">
                        {u.email}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                            u.role === "admin"
                              ? "bg-indigo-100 text-indigo-700"
                              : u.role === "instructor"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {u.role || "student"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-right">
                    <div className="text-xs text-slate-400">Joined</div>
                    <div className="font-medium text-xs">
                      {new Date(
                        u.createdAt || u.created_at || Date.now()
                      ).toLocaleDateString()}
                    </div>
                    <div className="mt-2">
                      <button
                        onClick={() => loadDetails(u._id || u.id)}
                        className="px-3 py-1 rounded-md border text-xs bg-white"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            Total:{" "}
            <span className="font-medium text-slate-800">{total}</span> users
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
            >
              Prev
            </button>
            <div className="px-3 py-1 border rounded bg-white text-sm">
              Page {page} / {totalPages}
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>
        </div>

        {/* Detail drawer */}
        {selected && (
          <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center md:justify-end pointer-events-none">
            {/* backdrop (optional) */}
            <div className="absolute inset-0 bg-black/20 pointer-events-auto md:hidden" />

            <div className="relative pointer-events-auto w-full max-w-md md:w-96 bg-white shadow-xl rounded-t-lg md:rounded-l-lg md:rounded-tr-lg p-4 mt-4 md:m-4 md:mt-0 md:mb-0 max-h-[80vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold">Student details</h3>
                <button
                  onClick={() => setSelected(null)}
                  className="text-sm text-gray-500"
                >
                  Close
                </button>
              </div>

              {selected.loading ? (
                <div className="py-6 text-center">Loading...</div>
              ) : selected.error ? (
                <div className="py-6 text-red-600">{selected.error}</div>
              ) : selected.student ? (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                        selected.student.role === "admin"
                          ? "bg-indigo-600"
                          : "bg-emerald-500"
                      }`}
                    >
                      {selected.student.name
                        ? selected.student.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                        : (selected.student.email || "U")[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {selected.student.name}
                      </div>
                      <div className="text-xs text-gray-500 break-all">
                        {selected.student.email}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Phone</div>
                    <div className="font-medium">
                      {selected.student.phone ||
                        selected.student.meta?.phone ||
                        "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Role</div>
                    <div className="font-medium">
                      {selected.student.role}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Joined</div>
                    <div className="font-medium">
                      {new Date(
                        selected.student.createdAt ||
                          selected.student.created_at ||
                          Date.now()
                      ).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Meta</div>
                    <pre className="bg-slate-50 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(selected.student.meta || {}, null, 2)}
                    </pre>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() =>
                        alert("Feature: Edit user (not implemented)")
                      }
                      className="w-full sm:flex-1 px-3 py-2 rounded bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        alert("Feature: Reset password (not implemented)")
                      }
                      className="w-full sm:w-auto px-3 py-2 rounded border text-sm"
                    >
                      Reset password
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
