/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://course-muster-back-end.vercel.app";

function isYouTubeUrl(url) {
  if (!url) return false;
  return /youtube\.com|youtu\.be/.test(url);
}

function getYouTubeEmbed(url) {
  if (!url) return null;
  // extract video id
  const m = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:\?|&|$)/);
  if (m && m[1]) return `https://www.youtube.com/embed/${m[1]}`;
  // youtu.be short link
  const m2 = url.match(/youtu\.be\/([0-9A-Za-z_-]{11})/);
  if (m2 && m2[1]) return `https://www.youtube.com/embed/${m2[1]}`;
  return null;
}

export default function BatchLessonViewerPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id;
  console.log(courseId);
  const batchKey = params?.batchKey || "";

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [progressByLesson, setProgressByLesson] = useState({}); // lessonId -> progress object

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    setLessons([]);
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    fetch(
      `${API_BASE}/api/course/student/get-lessons?courseId=${encodeURIComponent(
        courseId
      )}${batchKey ? `&batchId=${encodeURIComponent(batchKey)}` : ""}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    )
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Status ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setLessons(data.lessons || []);
        // optionally fetch progress for each lesson (if many, you can create an endpoint; here we lazy fetch)
        // auto-select first lesson
        setSelectedIdx(0);
      })
      .catch((err) => {
        console.error(err);
        setError(err?.message || "Failed to load lessons");
      })
      .finally(() => setLoading(false));
  }, [courseId, batchKey]);

  const selected = lessons[selectedIdx] || null;

  // helper to fetch progress for a lesson (lazy)
  async function fetchProgress(lessonId) {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(
        `${API_BASE}/api/course/student/lesson-progress?lessonId=${encodeURIComponent(
          lessonId
        )}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) {
        // ignore missing progress
        return null;
      }
      const data = await res.json();
      return data.progress || null;
    } catch (err) {
      return null;
    }
  }

  // mark lesson complete
  async function handleMarkComplete(lesson) {
    if (!lesson) return;
    setSubmitting(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(
        `${API_BASE}/api/course/student/${lesson._id}/complete`,
        {
          method: "POST",
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
      // update local progress state
      setProgressByLesson((p) => ({
        ...p,
        [lesson._id]: {
          status: "completed",
          updatedAt: new Date().toISOString(),
        },
      }));
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to mark complete");
    } finally {
      setSubmitting(false);
    }
  }

  // in BatchLessonViewerPage component — replace existing handleSubmitQuiz
  async function handleSubmitQuiz(lesson, answersPayload) {
    if (!lesson) throw new Error("lesson missing");
    setSubmitting(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(
        `${API_BASE}/api/course/student/${lesson._id}/submit-quiz`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ answers: answersPayload }),
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }
      const data = await res.json();

      // Normalize response so widget can rely on a stable shape
      const normalized = {
        score:
          typeof data.score === "number"
            ? data.score
            : data.progress?.quiz?.score ?? null,
        total:
          typeof data.total === "number"
            ? data.total
            : data.progress?.quiz?.total ??
              (Array.isArray(lesson.quizPayload)
                ? lesson.quizPayload.length
                : 0),
        detailed: Array.isArray(data.detailed)
          ? data.detailed
          : data.progress?.quiz?.detailed ?? [],
        progress: data.progress ?? null,
      };

      // update parent progress state so widgets get latest via props
      setProgressByLesson((p) => ({
        ...p,
        [lesson._id]: normalized.progress ||
          p[lesson._id] || {
            quiz: normalized,
            status:
              normalized.score === normalized.total && normalized.total > 0
                ? "completed"
                : "attempted",
          },
      }));

      // return normalized so QuizWidget receives it immediately
      return normalized;
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to submit quiz");
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  // submit assignment
  async function handleSubmitAssignment(lesson, submission) {
    if (!lesson) return;
    setSubmitting(true);
    setError(null);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(
        `${API_BASE}/api/course/student/${lesson._id}/submit-assignment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ submission }),
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }
      const data = await res.json();
      setProgressByLesson((p) => ({ ...p, [lesson._id]: data.progress }));
      return data;
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to submit assignment");
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  // renderers for lesson types
  function LessonRenderer({ lesson }) {
    if (!lesson) return null;
    const type = (lesson.type || "video").toLowerCase();
    if (type === "video") {
      const embed = getYouTubeEmbed(lesson.videoUrl);
      return (
        <div>
          <h3 className="text-lg font-semibold">{lesson.title}</h3>
          {embed ? (
            <div className="mt-3">
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src={embed}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              {lesson.durationMinutes && (
                <div className="text-sm text-gray-500 mt-2">
                  Duration: {lesson.durationMinutes} min
                </div>
              )}
            </div>
          ) : lesson.videoUrl ? (
            <div className="mt-3">
              <video
                controls
                src={lesson.videoUrl}
                className="w-full max-h-[60vh]"
              />
            </div>
          ) : (
            <div className="mt-3 text-sm text-gray-500">
              No video URL provided.
            </div>
          )}
        </div>
      );
    }

    if (type === "quiz") {
      // extract questions (your DB stores quizPayload as array)
      const questions = Array.isArray(lesson.quizPayload)
        ? lesson.quizPayload
        : [];
      return (
        <QuizWidget
          lesson={lesson}
          questions={questions}
          onSubmit={handleSubmitQuiz}
          submitting={submitting}
          initialProgress={progressByLesson[lesson._id] || null}
        />
      );
    }

    if (type === "assignment") {
      return (
        <AssignmentWidget
          lesson={lesson}
          onSubmit={handleSubmitAssignment}
          submitting={submitting}
          initialProgress={progressByLesson[lesson._id] || null}
        />
      );
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50 text-black">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 bg-white rounded shadow-sm p-3 max-h-[80vh] overflow-y-auto">
          <div className="text-sm text-gray-600 font-medium mb-2">Lessons</div>
          {loading && <div className="text-xs text-gray-500">Loading...</div>}
          {!loading && lessons.length === 0 && (
            <div className="text-xs text-gray-500">No lessons found.</div>
          )}
          <ul className="space-y-2">
            {lessons.map((ls, idx) => {
              const isActive = idx === selectedIdx;
              return (
                <li
                  key={ls._id}
                  className={`p-2 rounded ${
                    isActive ? "bg-indigo-50" : "hover:bg-gray-50"
                  } cursor-pointer`}
                  onClick={() => setSelectedIdx(idx)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm">
                        {ls.lessonNumber}. {ls.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ls.type}
                        {ls.type === "video" && ls.durationMinutes
                          ? ` • ${ls.durationMinutes} min`
                          : ""}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {progressByLesson[ls._id]?.status === "completed"
                        ? "✓"
                        : ""}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>

        <main className="lg:col-span-3 bg-white rounded shadow-sm p-4">
          {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
          {!selected ? (
            <div className="text-sm text-gray-500">
              Select a lesson to start.
            </div>
          ) : (
            <>
              <LessonRenderer lesson={selected} />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleMarkComplete(selected)}
                  disabled={submitting}
                  className="px-3 py-2 bg-indigo-600 text-white rounded"
                >
                  Mark as finished
                </button>
                <button
                  onClick={() => {
                    const next = selectedIdx + 1;
                    if (next < lessons.length) setSelectedIdx(next);
                  }}
                  disabled={selectedIdx >= lessons.length - 1}
                  className="px-3 py-2 border rounded"
                >
                  Next lesson
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function QuizWidget({
  lesson,
  questions = [],
  onSubmit,
  submitting,
  initialProgress = null,
}) {
  const [answers, setAnswers] = useState(() =>
    (questions || []).map(() => null)
  );
  const [result, setResult] = useState(() => {
    // if initialProgress contains quiz info, prepopulate result
    if (initialProgress && initialProgress.quiz) {
      return {
        score: initialProgress.quiz.score ?? null,
        total: initialProgress.quiz.total ?? questions.length,
        detailed: initialProgress.quiz.detailed ?? [],
        progress: initialProgress,
      };
    }
    return null;
  });
  console.log(result)
  const [localError, setLocalError] = useState(null);
  const [submitted, setSubmitted] = useState(
    () => !!(initialProgress && initialProgress.quiz)
  );

  useEffect(() => {
    setAnswers((questions || []).map(() => null));
    // reset result if different lesson
    setResult(
      initialProgress && initialProgress.quiz
        ? {
            score: initialProgress.quiz.score ?? null,
            total: initialProgress.quiz.total ?? questions.length,
            detailed: initialProgress.quiz.detailed ?? [],
            progress: initialProgress,
          }
        : null
    );
    setLocalError(null);
    setSubmitted(!!(initialProgress && initialProgress.quiz));
  }, [
    lesson._id,
    JSON.stringify(questions),
    initialProgress && JSON.stringify(initialProgress),
  ]);

  const handleAnswer = (qIndex, optionIdx) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[qIndex] = optionIdx;
      return copy;
    });
  };

  const submit = async () => {
    setLocalError(null);
    // require all questions answered
    const unanswered = questions.findIndex(
      (_, i) => answers[i] === null || answers[i] === undefined
    );
    if (unanswered !== -1) {
      setLocalError("Please answer all questions before submitting.");
      return;
    }

    // build payload
    const payload = questions.map((q, qi) => {
      const selIdx = answers[qi];
      const selOption =
        Array.isArray(q.options) && selIdx != null ? q.options[selIdx] : null;
      return {
        questionId: q.id || q._id || `${qi}`,
        selectedIndex: selIdx,
        selectedOptionId: selOption ? selOption.id : null,
      };
    });

    try {
      const data = await onSubmit(lesson, payload);
      // onSubmit returns normalized { score, total, detailed, progress }
      const display = {
        score: data.score ?? null,
        total: data.total ?? questions.length,
        detailed: data.detailed ?? [],
        progress: data.progress ?? null,
      };
      setResult(display);
      setSubmitted(true);

      // If progress provided, ensure parent state already updated; if not, try to set optimistic progress locally
      if (!display.progress) {
        setResult((r) => ({
          ...r,
          progress: r.progress || {
            quiz: {
              score: display.score,
              total: display.total,
              detailed: display.detailed,
            },
          },
        }));
      }
    } catch (err) {
      setLocalError(err?.message || "Failed to submit quiz.");
      throw err;
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="mt-4 p-3 border rounded text-sm text-gray-600 bg-yellow-50">
        This lesson is marked as a quiz but no questions were found in
        quizPayload.
      </div>
    );
  }

  return (
    <div className="mt-4 text-black">
      <h3 className="text-lg font-semibold">{lesson.title}</h3>

      <div className="mt-3 space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id || idx} className="p-3 border rounded">
            <div className="font-medium text-sm">
              {idx + 1}. {q.question}
            </div>

            <div className="mt-2 space-y-2">
              {(q.options || []).map((opt, oi) => {
                const checked = answers[idx] === oi;
                return (
                  <label
                    key={opt.id || oi}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`q-${lesson._id}-${idx}`}
                      value={oi}
                      checked={checked}
                      onChange={() => handleAnswer(idx, oi)}
                      disabled={submitted || submitting}
                    />
                    <span className="text-sm">{opt.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {localError && <div className="text-sm text-red-600">{localError}</div>}
        {result && (
          <div className="mt-2 text-sm text-gray-700">
            Score: {result.score ?? "N/A"}% —{" "}
            {result.detailed?.filter((d) => d.correct).length}/
            {result.total} correct
          </div>
        )}

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={submit}
            disabled={submitting || submitted}
            className={`px-3 py-2 rounded ${
              submitted
                ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                : "bg-indigo-600 text-white"
            }`}
          >
            {submitted
              ? "Already submitted"
              : submitting
              ? "Submitting..."
              : "Submit Quiz"}
          </button>
        </div>

        {result && (
          <div className="mt-3 p-3 bg-green-50 border rounded text-sm">
            <div className="font-medium">Result</div>
            <div className="mt-1">Score: {result.score ?? "N/A"}%</div>
          </div>
        )}
      </div>
    </div>
  );
}

// AssignmentWidget component
function AssignmentWidget({
  lesson,
  onSubmit,
  submitting,
  initialProgress = null,
}) {
  const [submissionText, setSubmissionText] = useState("");
  const [submitted, setSubmitted] = useState(
    () => !!(initialProgress && initialProgress.submission)
  );
  const [localError, setLocalError] = useState(null);
  const [localSuccess, setLocalSuccess] = useState(null);

  useEffect(() => {
    setSubmissionText("");
    setSubmitted(!!(initialProgress && initialProgress.submission));
    setLocalError(null);
    setLocalSuccess(null);
  }, [lesson._id, initialProgress && JSON.stringify(initialProgress)]);

  const submit = async () => {
    setLocalError(null);
    setLocalSuccess(null);
    if (!submissionText || !String(submissionText).trim()) {
      setLocalError("Please provide your submission (text or a link).");
      return;
    }
    try {
      await onSubmit(lesson, { text: submissionText });
      setSubmitted(true);
      setLocalSuccess("Assignment submitted successfully.");
    } catch (err) {
      setLocalError(err?.message || "Failed to submit assignment");
      throw err;
    }
  };

  if (submitted) {
    return (
      <div className="mt-4 p-3 border rounded bg-green-50 text-sm">
        <div className="font-medium">Already submitted</div>
        {initialProgress?.submission && (
          <div className="text-xs text-gray-600 mt-1">
            Your submission: {initialProgress.submission.text || "—"}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 text-black">
      <h3 className="text-lg font-semibold">{lesson.title}</h3>
      <div className="mt-3">
        <div className="text-sm text-gray-600 mb-2">Instructions</div>
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {lesson.assignmentInstructions || "No instructions provided."}
        </div>
      </div>

      <div className="mt-3">
        <textarea
          required
          value={submissionText}
          onChange={(e) => setSubmissionText(e.target.value)}
          rows={6}
          className="w-full p-2 border rounded"
          placeholder="Paste your submission link or write answer here..."
          disabled={submitting}
        />
      </div>

      {localError && (
        <div className="mt-2 text-sm text-red-600">{localError}</div>
      )}
      {localSuccess && (
        <div className="mt-2 text-sm text-green-700">{localSuccess}</div>
      )}

      <div className="mt-3">
        <button
          onClick={submit}
          disabled={submitting || submitted}
          className="px-3 py-2 bg-indigo-600 text-white rounded"
        >
          {submitting ? "Submitting..." : "Submit Assignment"}
        </button>
      </div>
    </div>
  );
}
