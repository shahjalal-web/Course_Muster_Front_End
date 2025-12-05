/* eslint-disable @next/next/no-html-link-for-pages */
"use client";
import React from "react";

export default function Hero() {
  return (
    <section className="bg-linear-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: copy */}
          <div className="lg:col-span-7">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-4 w-max">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 8v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 8v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Learn — Build — Succeed
              </p>

              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Upskill with industry-led courses. <span className="text-indigo-600">Learn at your pace.</span>
              </h1>

              <p className="mt-4 text-lg text-slate-600">
                CourseMaster brings curated courses, interactive quizzes, and real-world projects together — for students, instructors and teams. Start learning today or manage courses effortlessly as an admin.
              </p>

              {/* Search / CTA */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <label htmlFor="search" className="sr-only">Search courses</label>
                  <div className="flex rounded-md shadow-sm overflow-hidden">
                    <input
                      id="search"
                      type="text"
                      placeholder="Search courses, instructors or topics"
                      className="flex-1 px-4 py-3 bg-white border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <button
                      className="px-4 py-3 bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none"
                      aria-label="Search courses"
                    >
                      Search
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/components/courses"
                    className="inline-flex items-center px-5 py-3 rounded-md bg-indigo-600 text-white font-medium shadow-sm hover:bg-indigo-700"
                  >
                    Browse Courses
                  </a>
                  <a
                    href="/components/login"
                    className="inline-flex items-center px-4 py-3 rounded-md border border-slate-200 text-sm text-slate-700 bg-white hover:bg-slate-50"
                  >
                    Student Login
                  </a>
                </div>
              </div>

              {/* features */}
              <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold">✓</span>
                  Interactive quizzes & projects
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyan-50 text-cyan-600 text-xs font-semibold">✓</span>
                  Instructor-led content & batches
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-50 text-yellow-600 text-xs font-semibold">✓</span>
                  Assignment submission & reviews
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">✓</span>
                  Admin tools & analytics
                </li>
              </ul>

              {/* stats */}
              <div className="mt-8 flex flex-wrap gap-6">
                <Stat label="Students" value="12k+" />
                <Stat label="Courses" value="320+" />
                <Stat label="Instructors" value="180+" />
              </div>
            </div>
          </div>

          {/* Right: illustration */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-linear-to-br from-indigo-50 to-white">
                {/* Decorative top-right badge */}
                <div className="absolute top-4 right-4 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-slate-700">
                  New — Analytics
                </div>

                {/* Illustration placeholder */}
                <div className="p-8">
                  {/* Replace the SVG below with an image or real illustration */}
                  <svg viewBox="0 0 600 400" className="w-full h-56 sm:h-72" aria-hidden>
                    <defs>
                      <linearGradient id="g1" x1="0" x2="1">
                        <stop offset="0" stopColor="#7c3aed" />
                        <stop offset="1" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="100%" height="100%" rx="18" fill="url(#g1)" opacity="0.08" />
                    <g fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="2">
                      <rect x="40" y="40" width="220" height="120" rx="8" />
                      <rect x="340" y="40" width="220" height="80" rx="8" />
                      <rect x="40" y="200" width="520" height="140" rx="8" />
                    </g>
                  </svg>

                  <div className="mt-4 text-sm text-slate-600">
                    <strong className="text-slate-900">Course analytics</strong> — track enrollments, completion rates, and quiz performance in one place.
                  </div>
                </div>

                {/* CTA footer inside card */}
                <div className="border-t border-slate-100 px-6 py-4 bg-white/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-slate-700">Start a free trial — no credit card required</div>
                    <a href="/components/signup" className="text-sm font-medium px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                      Start free
                    </a>
                  </div>
                </div>
              </div>

              {/* small testimonial */}
              <blockquote className="mt-4 text-sm text-slate-600">
                “CourseMaster helped me build practical skills and land my first job. Lessons are focused and actionable.” — <strong>Rana, Front-end Developer</strong>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Small Stat component */
function Stat({ label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );
}
