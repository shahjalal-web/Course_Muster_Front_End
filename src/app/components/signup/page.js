// app/signup/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../../store/slices/authSlice";

export default function SignupPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  // Redux state (auth slice)
  const { loading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [localError, setLocalError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === "student") {
      // redirect to admin dashboard
      router.push("/components/student/dashboard");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      // redirect to admin dashboard
      router.push("/components/admin/dashboard");
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setLocalError(null);
    setSuccessMsg(null);
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Please enter a valid email";
    if (form.password.length < 6)
      return "Password must be at least 6 characters";
    if (form.password !== form.confirm) return "Passwords do not match";
    return null;
  };

const onSubmit = async (e) => {
  e.preventDefault();
  setLocalError(null);
  setSuccessMsg(null);

  const v = validate();
  if (v) {
    setLocalError(v);
    return;
  }

  try {
    // dispatch and capture normalized result from thunk
    const result = await dispatch(
      registerUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
    ).unwrap(); // will throw if rejectedByValue

    console.log('register result:', result);
    // result expected to be normalized { user, token } from the slice
    const { user, token } = result || {};

    // optionally persist token (only if you want to)
    if (token) {
      try {
        localStorage.setItem('token', token);
      } catch (err) {
        // ignore storage errors, but you may want to log them
        console.warn('Could not save token to localStorage', err);
      }
    }

    // success UI
    setSuccessMsg('Registration successful!');

    // optional: if you redirect after signup, do it AFTER unwrap()
    // router.push('/dashboard');

    // optional: if you want to clear the form
    // setForm({ name: '', email: '', password: '' });
  } catch (err) {
    // err will be the string message from rejectWithValue OR an Error message
    const message = typeof err === 'string' ? err : err?.message || 'Registration failed';
    setLocalError(message);
    console.error('register error:', err);
  }
};


  return (
    <div className="min-h-[85vh] bg-red-900 flex items-center justify-center bg-linear-to-b from-sky-50 to-white px-4 py-12">
      <div className="w-full max-w-2xl bg-white border border-slate-100 rounded-2xl shadow-lg p-8 md:p-10 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
        <h1 className="text-2xl md:text-3xl font-extrabold text-green-800 mb-3 text-center">
          Create Student Account
        </h1>
        <p className="text-sm text-slate-500 text-center mb-6">
          Join CourseMaster — access courses, track progress, and start
          learning.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Full name
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
              autoComplete="email"
            />
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white text-sm
          focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
                  autoComplete="new-password"
                />

                {/* Eye Button */}
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
                >
                  {showPass ? (
                    /* Eye-off icon */
                    <>🙈</>
                  ) : (
                    /* Eye icon */
                    <>👁️</>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Confirm Password
              </label>

              <div className="relative">
                <input
                  id="confirm"
                  name="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirm}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white text-sm
          focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
                  autoComplete="new-password"
                />

                {/* Eye Button */}
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
                >
                  {showConfirm ? (
                    /* Eye-off icon */
                    <>🙈</>
                  ) : (
                    /* Eye icon */
                    <>👁️</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error / Success */}
          {(localError || error) && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-100 px-4 py-2 rounded-lg">
              {localError || error}
            </div>
          )}

          {successMsg && (
            <div className="text-sm text-green-800 bg-green-50 border border-green-100 px-4 py-2 rounded-lg">
              {successMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-1 py-3 rounded-xl text-white text-lg font-semibold
              bg-linear-to-r from-sky-600 to-indigo-600 shadow-sm hover:from-sky-700 hover:to-indigo-700
              transform active:scale-95 transition-all duration-150 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }
            `}
            aria-busy={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          {/* Footer */}
          <div className="pt-3 text-center text-sm text-slate-600">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="text-sky-600 underline">
              Terms
            </Link>{" "}
            &{" "}
            <Link href="/privacy" className="text-sky-600 underline">
              Privacy
            </Link>
            .
          </div>

          <div className="pt-2 text-center text-sm">
            Already registered?{" "}
            <Link
              href="/components/login"
              className="text-sky-700 font-medium hover:underline"
            >
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
