/* eslint-disable react/no-unescaped-entities */

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-3xl w-full bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl p-8 md:p-12 border border-gray-100">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-none w-48 h-48 md:w-56 md:h-56 rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-4xl font-extrabold shadow-lg">
            404
          </div>

          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Page not found</h1>
            <p className="text-slate-600 mb-6">We can’t find the page you’re looking for. It may have been moved or removed, or the URL might be incorrect.</p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Link href="/" className="inline-block px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700">Take me home</Link>

              <Link href="/" className="inline-block px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Browse the homepage</Link>
            </div>

            <div className="mt-6">
              <form action="/search" method="get" className="flex items-center gap-2 max-w-md">
                <label htmlFor="q" className="sr-only">Search site</label>
                <input id="q" name="q" placeholder="Search the site" className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                <button type="submit" className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300">Search</button>
              </form>
            </div>

            <p className="mt-6 text-sm text-slate-500">If you think this is a mistake, <Link href="/contact" className="underline">contact support</Link> and we'll help you track it down.</p>
          </div>
        </div>

        <footer className="mt-8 text-xs text-slate-400 text-center">Hint: check for typos or try the search above.</footer>
      </div>
    </main>
  );
}
