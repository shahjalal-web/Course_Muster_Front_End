/* eslint-disable react/no-unescaped-entities */
// pages/about.jsx
"use client";
import React from "react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-black">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">About Us</h1>
          <p className="mt-2 text-sm text-slate-600">
            We build simple, delightful learning experiences — for students,
            instructors, and teams. Learn more about our mission and how we work.
          </p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Our Mission</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              To make high-quality, practical education accessible to everyone.
              We believe in clear explanations, real projects, and supportive
              learning paths that help learners ship work they are proud of.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Our Values</h2>
            <ul className="text-sm text-slate-600 space-y-2">
              <li><strong>Practicality:</strong> real projects "{">"}" theory without context.</li>
              <li><strong>Clarity:</strong> simple explanations and well-structured content.</li>
              <li><strong>Community:</strong> learning is faster with peers and mentors.</li>
            </ul>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">How we help learners</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              We create step-by-step courses, hands-on projects, and dashboards
              that let students track progress. Instructors get easy-to-use
              tools to author content and measure learning outcomes.
            </p>
            <p>
              Whether you're starting a new career or leveling up at work, our
              goal is to make learning practical and measurable.
            </p>
          </div>
        </section>

        <section className="bg-linear-to-r from-indigo-600 to-cyan-500 text-white p-6 rounded-xl shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="text-lg font-bold">Want to collaborate?</h4>
              <p className="text-sm opacity-90 mt-1">We work with companies, bootcamps and individual instructors.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/components/contact">
                <p className="px-4 py-2 bg-white text-indigo-700 rounded-md font-medium shadow-sm">Contact us</p>
              </Link>
              <a
                href="mailto:hello@example.com"
                className="px-4 py-2 border border-white/30 rounded-md text-white text-sm"
              >
                Email
              </a>
            </div>
          </div>
        </section>

        <footer className="mt-8 text-xs text-slate-400 text-center">
          © {new Date().getFullYear()} Your Learning Platform. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
