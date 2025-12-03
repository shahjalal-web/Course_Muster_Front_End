/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const IMGBB_KEY =
  process.env.NEXT_PUBLIC_IMGBB_KEY || "d1fbaa0b9f043f285b08e6d997b387ef";

export default function CreateCoursePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    instructorName: "", // <-- added instructor field
  });

  const categories = [
    "Web Development",
    "App Development",
    "Data Science",
    "AI & Machine Learning",
    "Programming Fundamentals",
    "Cyber Security",
    "UI/UX Design",
    "Business & Productivity",
  ];

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);

  const [batches, setBatches] = useState([
    // sample one by default
    { id: Date.now(), name: "Batch 1", startDate: "", endDate: "" },
  ]);

  const [loading, setLoading] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // helpers
  const updateField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const handleFile = (file) => {
    if (!file) return;
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = () => setThumbnailPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const addBatch = () =>
    setBatches((b) => [
      ...b,
      {
        id: Date.now() + Math.random(),
        name: `Batch ${b.length + 1}`,
        startDate: "",
        endDate: "",
      },
    ]);
  const removeBatch = (id) => setBatches((b) => b.filter((x) => x.id !== id));
  const updateBatch = (id, key, value) =>
    setBatches((b) => b.map((x) => (x.id === id ? { ...x, [key]: value } : x)));

  // convert DataURL to base64 (strip prefix)
  const dataUrlToBase64 = (dataUrl) => {
    if (!dataUrl) return null;
    const parts = dataUrl.split(",");
    return parts[1] || parts[0];
  };

  // upload thumbnail to imgbb
  const uploadThumbnailToImgbb = async () => {
    if (!thumbnailPreview) return null;
    if (!IMGBB_KEY)
      throw new Error("IMGBB key not configured (NEXT_PUBLIC_IMGBB_KEY).");

    try {
      setImgUploading(true);
      const base64 = dataUrlToBase64(thumbnailPreview);
      const formData = new FormData();
      formData.append("image", base64);

      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok || !data?.data?.url) {
        throw new Error(data?.error?.message || "Image upload failed");
      }
      return data.data.url;
    } finally {
      setImgUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // basic validation
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setLoading(true);
    try {
      // 1) if thumbnail selected and not uploaded yet -> upload
      let uploadedUrl = thumbnailUrl;
      if (thumbnailPreview && !uploadedUrl) {
        uploadedUrl = await uploadThumbnailToImgbb();
        setThumbnailUrl(uploadedUrl);
      }

      // 2) prepare payload
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim() || "General",
        price: form.price ? Number(form.price) : 0,
        thumbnail: uploadedUrl || null,
        batches: batches.map((b) => ({
          name: b.name,
          startDate: b.startDate || null,
          endDate: b.endDate || null,
        })),
        instructorName: form.instructorName?.trim() || null, // <-- included
      };

      // optional: attach token if present
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      // 3) send to backend
      const res = await fetch(`${API_BASE}/api/course/add-course`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data?.message ||
          data?.error ||
          res.statusText ||
          "Failed to create course";
        throw new Error(msg);
      }

      setSuccessMsg("Course created successfully.");
      // optionally redirect to course edit or course list
      // assume backend returns created course id at data?.course?._id or data?.id
      const courseId = data?.course?._id || data?.id || null;
      setTimeout(() => {
        if (courseId) router.push(`/admin/courses/${courseId}`); // adjust route as you like
        else router.push("/admin");
      }, 800);
    } catch (err) {
      setError(err?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 md:py-10 md:px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-4xl mx-auto bg-white rounded-2xl md:shadow md:p-6"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Create Course</h1>
        <p className="text-sm text-gray-500 mb-6">
          Fill the course details and add a thumbnail.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title + Category + Instructor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Title
              </label>
              <input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. React for Beginners"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>

              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white 
               focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="" disabled>
                  -- Select Category --
                </option>

                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Instructor name field (new) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructor Name (optional)
            </label>
            <input
              value={form.instructorName}
              onChange={(e) => updateField("instructorName", e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
              placeholder="A short course summary that will appear on course list"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              required
            />
          </div>

          {/* Price + Thumbnail */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (BDT)
              </label>
              <input
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
                placeholder="0 for free"
                type="number"
                min="0"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail
              </label>

              <div className="flex gap-4 items-center">
                <label className="shrink-0 cursor-pointer">
                  <div className="w-28 h-20 border border-dashed rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                      className="hidden"
                    />
                    <span className="text-xs text-gray-500 px-2">Upload</span>
                  </div>
                </label>

                <div className="flex-1">
                  {thumbnailPreview ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={thumbnailPreview}
                        alt="preview"
                        className="w-44 h-28 object-cover rounded-md border"
                      />
                      <div>
                        <p className="text-sm font-medium">Preview</p>
                        <p className="text-xs text-gray-500">
                          Will be uploaded to imgbb on submit (or auto if you
                          click Upload).
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                setError(null);
                                setImgUploading(true);
                                const url = await uploadThumbnailToImgbb();
                                setThumbnailUrl(url);
                              } catch (err) {
                                setError(err?.message || "Image upload failed");
                              } finally {
                                setImgUploading(false);
                              }
                            }}
                            className="text-sm bg-indigo-600 text-white px-3 py-1 rounded disabled:opacity-60"
                            disabled={imgUploading}
                          >
                            {imgUploading ? "Uploading..." : "Upload now"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setThumbnailFile(null);
                              setThumbnailPreview(null);
                              setThumbnailUrl(null);
                            }}
                            className="text-sm bg-white border px-3 py-1 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No thumbnail selected yet.
                    </p>
                  )}

                  {thumbnailUrl && (
                    <p className="mt-2 text-xs text-green-600">
                      Uploaded URL: {" "}
                      <span className="break-all">{thumbnailUrl}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Batches (dynamic) */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Batches</h3>
              <button
                type="button"
                onClick={addBatch}
                className="text-sm text-indigo-600"
              >
                + Add batch
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {batches.map((b, idx) => (
                <div
                  key={b.id}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
                >
                  <div className="sm:col-span-1">
                    <label className="text-xs text-gray-600">Name</label>
                    <input
                      value={b.name}
                      onChange={(e) =>
                        updateBatch(b.id, "name", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2"
                      placeholder={`Batch ${idx + 1}`}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600">Start Date</label>
                    <input
                      type="date"
                      value={b.startDate}
                      onChange={(e) =>
                        updateBatch(b.id, "startDate", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600">End Date</label>
                    <input
                      type="date"
                      value={b.endDate}
                      onChange={(e) =>
                        updateBatch(b.id, "endDate", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => removeBatch(b.id)}
                      className="text-sm bg-white border px-3 py-2 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* messages */}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {successMsg && (
            <div className="text-sm text-green-600">{successMsg}</div>
          )}

          {/* actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 text-white px-6 py-3 font-semibold disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Course"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
