/* eslint-disable react/no-unescaped-entities */
// pages/contact.jsx
"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState({ submitting: false, success: null, error: null });

  function handleChange(e) {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  }

  function validate() {
    if (!form.name.trim()) return "Please enter your name.";
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) return "Please enter a valid email.";
    if (!form.message.trim()) return "Please write a message.";
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setStatus({ submitting: false, success: false, error: err });
      return;
    }
    // client-side only: simulate submission (no API)
    setStatus({ submitting: true, success: null, error: null });
    setTimeout(() => {
      setStatus({ submitting: false, success: true, error: null });
      setForm({ name: "", email: "", message: "" });
    }, 900);
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-black">
      <div className="max-w-3xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900">Contact Us</h1>
          <p className="mt-2 text-sm text-slate-600">
            Have a question, feedback or want to partner? Send us a message — we'll get back within 1 business day.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* contact info */}
          <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-2">Get in touch</h2>
            <p className="text-sm text-slate-600 mb-4">
              For support or partnerships, email us or fill the contact form.
            </p>

            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">Email</div>
                <a className="text-slate-800 block" href="mailto:hello@example.com">hello@example.com</a>
              </div>

              <div>
                <div className="text-xs text-slate-500">Phone</div>
                <div className="text-slate-800">+880 1X-XXXX-XXXX</div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Office</div>
                <div className="text-slate-800">Dhaka, Bangladesh</div>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/">
                <p className="text-xs text-indigo-600 hover:underline">Back to home</p>
              </Link>
            </div>
          </div>

          {/* form */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm">
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col text-sm">
                  <span className="text-slate-600 mb-1">Name</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Your full name"
                  />
                </label>

                <label className="flex flex-col text-sm">
                  <span className="text-slate-600 mb-1">Email</span>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="you@example.com"
                  />
                </label>
              </div>

              <label className="flex flex-col text-sm mt-4">
                <span className="text-slate-600 mb-1">Message</span>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={6}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Write your message..."
                />
              </label>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-medium shadow-sm disabled:opacity-60"
                  disabled={status.submitting}
                >
                  {status.submitting ? "Sending..." : "Send message"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText("hello@example.com");
                    alert("Email copied to clipboard: hello@example.com");
                  }}
                  className="px-3 py-2 rounded-md border text-sm"
                >
                  Copy email
                </button>
              </div>

              {status.error && (
                <div className="mt-3 text-sm text-red-600">{status.error}</div>
              )}
              {status.success && (
                <div className="mt-3 text-sm text-green-700">Thanks — your message was sent (demo only).</div>
              )}
            </form>
          </div>
        </div>

        <footer className="mt-8 text-xs text-slate-400 text-center">
          © {new Date().getFullYear()} Your Learning Platform
        </footer>
      </div>
    </main>
  );
}
