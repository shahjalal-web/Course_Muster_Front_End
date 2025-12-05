/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://course-muster-back-end.vercel.app";

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function AddLessonPage() {
  const router = useRouter();

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const [form, setForm] = useState({
    title: "",
    lessonNumber: "",
    type: "video", // video | quiz | assignment | article
    videoUrl: "",
    durationMinutes: "",
    // quizQuestions: structured
    quizQuestions: [],
    assignmentInstructions: "",
    assignmentDueDate: "",
    resources: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoadingCourses(true);

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const res = await fetch(`${API_BASE}/api/course/lessons`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error("Failed to fetch courses");

      const data = await res.json();
      setCourses(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not load courses");
    } finally {
      setLoadingCourses(false);
    }
  };

  const onCourseChange = (courseId) => {
    setSelectedBatchId("");
    setSelectedCourse(courses.find((c) => c._id === courseId) || null);
  };

  const updateField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  //
  // Quiz builder helpers (updated: correctIndex defaults to -1)
  //
  const addQuestion = () => {
    const qId = makeId();
    setForm((s) => ({
      ...s,
      quizQuestions: [
        ...s.quizQuestions,
        {
          id: qId,
          question: "",
          options: [
            { id: makeId(), text: "" },
            { id: makeId(), text: "" },
          ],
          correctIndex: -1, // no correct answer selected yet
        },
      ],
    }));
  };

  const removeQuestion = (qid) => {
    setForm((s) => ({
      ...s,
      quizQuestions: s.quizQuestions.filter((q) => q.id !== qid),
    }));
  };

  const updateQuestionText = (qid, text) => {
    setForm((s) => ({
      ...s,
      quizQuestions: s.quizQuestions.map((q) =>
        q.id === qid ? { ...q, question: text } : q
      ),
    }));
  };

  const addOption = (qid) => {
    setForm((s) => ({
      ...s,
      quizQuestions: s.quizQuestions.map((q) =>
        q.id === qid
          ? { ...q, options: [...q.options, { id: makeId(), text: "" }] }
          : q
      ),
    }));
  };

  const removeOption = (qid, oid) => {
    setForm((s) => ({
      ...s,
      quizQuestions: s.quizQuestions.map((q) => {
        if (q.id !== qid) return q;
        const newOptions = q.options.filter((o) => o.id !== oid);
        let newCorrect = q.correctIndex;
        const idxOfRemoved = q.options.findIndex((o) => o.id === oid);
        if (idxOfRemoved >= 0) {
          if (idxOfRemoved < newCorrect) newCorrect = Math.max(0, newCorrect - 1);
          if (newOptions.length === 0) {
            newOptions.push({ id: makeId(), text: "" });
            newCorrect = -1;
          } else if (newCorrect >= newOptions.length) {
            newCorrect = newOptions.length - 1;
          }
        }
        return { ...q, options: newOptions, correctIndex: newCorrect };
      }),
    }));
  };

  const updateOptionText = (qid, oid, text) => {
    setForm((s) => ({
      ...s,
      quizQuestions: s.quizQuestions.map((q) =>
        q.id === qid
          ? {
              ...q,
              options: q.options.map((o) => (o.id === oid ? { ...o, text } : o)),
            }
          : q
      ),
    }));
  };

  const setCorrectOption = (qid, index) => {
    setForm((s) => ({
      ...s,
      quizQuestions: s.quizQuestions.map((q) =>
        q.id === qid ? { ...q, correctIndex: index } : q
      ),
    }));
  };

  //
  // Validation (updated: require a selected correct option for each quiz question)
  //
  const validate = () => {
    if (!selectedCourse) return "Select a course";
    if (!form.title || form.title.trim().length < 3)
      return "Lesson title (min 3 chars) is required";
    if (!form.lessonNumber) return "Lesson number is required";
    if (form.type === "video") {
      if (!form.videoUrl || !form.videoUrl.includes("youtube"))
        return "A YouTube video URL is required for video lessons";
    }

    if (form.type === "quiz") {
      if (!form.quizQuestions || form.quizQuestions.length === 0)
        return "Add at least one quiz question";
      for (const [qi, q] of form.quizQuestions.entries()) {
        if (!q.question || q.question.trim().length < 3)
          return `Question ${qi + 1} must have a question text (min 3 chars)`;
        if (!q.options || q.options.length < 2)
          return `Question ${qi + 1} must have at least 2 options`;
        for (const [oi, o] of q.options.entries()) {
          if (!o.text || o.text.trim().length === 0)
            return `Option ${oi + 1} for question ${qi + 1} cannot be empty`;
        }
        if (
          typeof q.correctIndex !== "number" ||
          q.correctIndex < 0 ||
          q.correctIndex >= q.options.length
        )
          return `Question ${qi + 1} must have exactly one correct option selected`;
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      // build quizPayload from structured state (if quiz type)
      const quizPayload =
        form.type === "quiz"
          ? form.quizQuestions.map((q) => ({
              id: q.id,
              question: q.question.trim(),
              options: q.options.map((o) => ({ id: o.id, text: o.text.trim() })),
              correctIndex: q.correctIndex,
            }))
          : null;

      const payload = {
        courseId: selectedCourse._id,
        courseName: selectedCourse.title || null,
        courseCategory:
          selectedCourse.category || selectedCourse.categoryName || null,
        batchId: selectedBatchId || null,
        batchName:
          selectedBatchId && selectedCourse?.batches
            ? selectedCourse.batches.find((b) =>
                b._id
                  ? String(b._id) === selectedBatchId
                  : b.id
                  ? b.id === selectedBatchId
                  : b.name === selectedBatchId
              )?.name || null
            : null,

        title: form.title.trim(),
        lessonNumber: Number(form.lessonNumber),
        type: form.type,
        videoUrl: form.videoUrl || null,
        durationMinutes: form.durationMinutes
          ? Number(form.durationMinutes)
          : null,
        quizPayload: quizPayload || null,
        assignmentInstructions: form.assignmentInstructions || null,
        assignmentDueDate: form.assignmentDueDate || null,
        resources: form.resources || null,
      };

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const res = await fetch(
        `${API_BASE}/api/course/${selectedCourse._id}/lessons`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.message || data?.error || "Failed to add lesson");

      setSuccess("Lesson added successfully");
      setForm({
        title: "",
        lessonNumber: "",
        type: "video",
        videoUrl: "",
        durationMinutes: "",
        quizQuestions: [],
        assignmentInstructions: "",
        assignmentDueDate: "",
        resources: "",
      });
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 md:py-10 md:px-4 text-black">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-3xl mx-auto bg-white rounded-2xl md:shadow md:p-6"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Add Lesson</h1>
        <p className="text-sm text-gray-500 mb-6">
          Select a course (and batch if applicable), then add lesson details.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course
            </label>
            <select
              value={selectedCourse?._id || ""}
              onChange={(e) => onCourseChange(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="" disabled>
                {loadingCourses ? "Loading courses..." : "-- Select Course --"}
              </option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Batch select (if available) */}
          {selectedCourse &&
            selectedCourse.batches &&
            selectedCourse.batches.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch (optional)
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">-- Any Batch --</option>
                  {selectedCourse.batches.map((b, idx) => (
                    <option key={idx} value={b._id || b.name}>
                      {b.name}{" "}
                      {b.startDate
                        ? `(${new Date(b.startDate).toLocaleDateString()})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

          {/* Lesson basic */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lesson Title
              </label>
              <input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3"
                placeholder="e.g. Intro to React"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lesson #
              </label>
              <input
                value={form.lessonNumber}
                onChange={(e) => updateField("lessonNumber", e.target.value)}
                type="number"
                min="1"
                className="w-full rounded-lg border border-gray-200 px-4 py-3"
                placeholder="1"
              />
            </div>
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lesson Type
            </label>
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 bg-white"
            >
              <option value="video">Video</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Assignment</option>
              <option value="article">Article / Reading</option>
            </select>
          </div>

          {/* conditional fields */}
          {form.type === "video" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                YouTube Video URL
              </label>
              <input
                value={form.videoUrl}
                onChange={(e) => updateField("videoUrl", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-lg border border-gray-200 px-4 py-3"
              />

              <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">
                Duration (minutes, optional)
              </label>
              <input
                value={form.durationMinutes}
                onChange={(e) => updateField("durationMinutes", e.target.value)}
                type="number"
                min="0"
                className="w-36 rounded-lg border border-gray-200 px-3 py-2"
                placeholder="e.g. 12"
              />
            </div>
          )}

          {form.type === "quiz" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Quiz Builder</h3>
                <div>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-sm text-indigo-600"
                  >
                    + Add question
                  </button>
                </div>
              </div>

              {form.quizQuestions.length === 0 && (
                <p className="text-xs text-gray-500">
                  No questions yet. Click "Add question" to start.
                </p>
              )}

              {form.quizQuestions.map((q, qi) => (
                <div
                  key={q.id}
                  className="p-4 border rounded-lg bg-gray-50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700">
                        Question {qi + 1}
                      </label>
                      <input
                        value={q.question}
                        onChange={(e) => updateQuestionText(q.id, e.target.value)}
                        placeholder="Write the question text"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 mt-1"
                      />
                    </div>

                    <div className="shrink-0 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="text-sm bg-white border px-3 py-1 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Options
                    </label>

                    <div className="space-y-2">
                      {q.options.map((o, oi) => (
                        <div key={o.id} className="flex items-center gap-2">
                          {/* radio to pick correct option */}
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctIndex === oi}
                            onChange={() => setCorrectOption(q.id, oi)}
                            className="w-4 h-4"
                          />
                          <input
                            value={o.text}
                            onChange={(e) =>
                              updateOptionText(q.id, o.id, e.target.value)
                            }
                            placeholder={`Option ${oi + 1}`}
                            className="flex-1 rounded-lg border border-gray-200 px-3 py-2"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(q.id, o.id)}
                            className="text-sm bg-white border px-2 py-1 rounded"
                          >
                            ✕
                          </button>
                          {/* explicit label so it's clear which radio is correct */}
                          <span className="text-xs text-gray-500 ml-2">Mark as correct</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => addOption(q.id)}
                        className="text-sm text-indigo-600"
                      >
                        + Add option
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          // quick helper: set first non-empty option as correct if none selected
                          const existing = form.quizQuestions.find((qq) => qq.id === q.id);
                          if (!existing) return;
                          if (existing.correctIndex >= 0) return;
                          const firstFilled = existing.options.findIndex((op) => op.text && op.text.trim().length > 0);
                          const idx = firstFilled >= 0 ? firstFilled : 0;
                          setCorrectOption(q.id, idx);
                        }}
                        className="text-sm bg-slate-100 px-2 py-1 rounded"
                      >
                        Set default correct
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {form.type === "assignment" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignment Instructions
              </label>
              <textarea
                value={form.assignmentInstructions}
                onChange={(e) =>
                  updateField("assignmentInstructions", e.target.value)
                }
                rows={4}
                className="w-full rounded-lg border border-gray-200 px-4 py-3"
              />

              <label className="text-xs text-gray-600 mt-2">Due date (optional)</label>
              <input
                type="date"
                value={form.assignmentDueDate}
                onChange={(e) =>
                  updateField("assignmentDueDate", e.target.value)
                }
                className="w-44 rounded-lg border border-gray-200 px-3 py-2"
              />
            </div>
          )}

          {form.type === "article" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Article / Content
              </label>
              <textarea
                value={form.resources}
                onChange={(e) => updateField("resources", e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-gray-200 px-4 py-3"
                placeholder="Paste article content or resource links"
              />
            </div>
          )}

          {/* messages */}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 text-white px-6 py-3 font-semibold disabled:opacity-60"
            >
              {loading ? "Adding..." : "Add Lesson"}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg bg-white border px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-6 text-xs text-gray-500">
          <strong>Note:</strong> For video lessons the frontend consumer should
          embed the YouTube URL and show a "Mark as Completed" button; progress
          tracking should be stored per-user in the backend (see suggestions
          below). Quiz payloads are stored as structured JSON and should be
          rendered by the consumer to show questions, options and grading.
        </div>
      </motion.div>
    </div>
  );
}
