"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/app/store/slices/authSlice";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });

  // local UI state (avoid colliding names with redux state)
  const [localError, setLocalError] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();

  // Redux state (auth slice) — safe fallback if undefined
  const {
    loading: reduxLoading,
    error: reduxError,
    isAuthenticated,
    user,
  } = useSelector((state) => state.auth || {});

  useEffect(() => {
    // sync redux errors into local UI if needed
    if (reduxError) setLocalError(reduxError);
  }, [reduxError]);

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
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    if (!form.email || !form.password) {
      setLocalError("Please fill both fields");
      return;
    }

    setLocalLoading(true);
    try {
      // unwrap() will throw if the thunk was rejectedWithValue
      const result = await dispatch(
        loginUser({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        })
      ).unwrap();

      // result is expected to be normalized { user, token } from your slice
      console.log("Login result:", result);
      const { token } = result || {};

      if (token) {
        try {
          localStorage.setItem("token", token);
        } catch (err) {
          console.warn("Could not save token to localStorage", err);
        }
      }

      setSuccessMsg("Signed in successfully");
      // Optional: you can redirect here but also rely on isAuthenticated effect
      // router.push('/');
    } catch (err) {
      const message =
        typeof err === "string" ? err : err?.message || "Login failed";
      setLocalError(message);
      console.error("Login error:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  // show loading when either local action or redux loading is true
  const effectiveLoading = localLoading || reduxLoading;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="max-w-4xl w-full bg-white rounded-2xl shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-2"
      >
        {/* LEFT - Illustration / Marketing */}
        <div className="hidden md:flex items-center justify-center bg-linear-to-br from-indigo-600 to-sky-500 p-8">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-white text-center max-w-xs"
          >
            <h2 className="text-3xl font-extrabold mb-2">Welcome back</h2>
            <p className="opacity-90">
              Sign in to continue to your dashboard and manage your Course.
            </p>

            <div className="mt-6 grid gap-3">
              <div className="bg-white bg-opacity-10 rounded-lg p-3 text-left">
                <p className="text-sm font-semibold text-blue-600">
                  Fast • Secure • Modern
                </p>
                <p className="text-xs opacity-90 mt-1 text-blue-600">
                  Two-step verification, role aware UI and more.
                </p>
              </div>
            </div>
          </motion.div>

          {/* subtle floating circles */}
          <svg
            className="absolute right-6 bottom-6 opacity-10"
            width="180"
            height="180"
            viewBox="0 0 180 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="30" cy="30" r="30" fill="white" />
            <circle cx="150" cy="150" r="30" fill="white" />
          </svg>
        </div>

        {/* RIGHT - Form */}
        <div className="p-8 md:p-12">
          <div className="mb-6">
            <h3 className="text-2xl font-bold">Sign in</h3>
            <p className="text-sm text-gray-500 mt-1">
              Use your account to access the dashboard
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow hover:shadow-md"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>

              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 pr-12 
                 focus:outline-none focus:ring-2 focus:ring-indigo-400 
                 transition-shadow hover:shadow-md"
                  autoComplete="current-password"
                />

                {/* Eye toggle button */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 
                 hover:text-gray-700 transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    // Eye Off Icon
                    <>🙈</>
                  ) : (
                    // Eye Icon
                    <>👁️</>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  name="remember"
                  type="checkbox"
                  checked={form.remember}
                  onChange={handleChange}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember me</span>
              </label>

              <a href="#" className="text-indigo-600 hover:underline">
                Forgot password?
              </a>
            </div>

            {localError && (
              <div className="text-sm text-red-600">{localError}</div>
            )}
            {successMsg && (
              <div className="text-sm text-green-600">{successMsg}</div>
            )}

            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={effectiveLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 bg-indigo-600 text-white font-semibold shadow-md hover:shadow-lg transition-shadow disabled:opacity-60"
              >
                {effectiveLoading ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                ) : (
                  "Sign in"
                )}
              </motion.button>
            </div>

            <div className="pt-3">
              <div className="relative text-center text-sm text-gray-400">
                <span className="bg-white px-3 relative z-10">
                  or continue with
                </span>
                <div className="absolute left-0 right-0 top-3 h-px bg-gray-200 -z-10" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 transition"
                >
                  {/* Facebook SVG */}
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.877v-6.987H8.898v-2.89h1.54V9.797c0-1.522.904-2.366 2.289-2.366.664 0 1.359.118 1.359.118v1.497h-.766c-.755 0-.99.469-.99.95v1.144h1.684l-.269 2.89h-1.415V21.88C18.343 21.128 22 16.99 22 12z"
                      fill="#1877F2"
                    />
                  </svg>
                  Facebook
                </button>

                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 transition"
                >
                  {/* Google SVG */}
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21.6 12.23c0-.77-.07-1.51-.2-2.23H12v4.23h5.27c-.23 1.24-.95 2.3-2.04 3.01v2.49h3.29c1.92-1.77 3.02-4.37 3.02-7.5z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.29-2.49c-.92.62-2.09.99-3.32.99-2.55 0-4.71-1.72-5.48-4.03H3.07v2.53C4.71 19.86 8.08 22 12 22z"
                      fill="#34A853"
                    />
                    <path
                      d="M6.52 13.03A6.01 6.01 0 016 12c0-.33.03-.66.08-.97V8.5H3.07A10.01 10.01 0 002 12c0 1.6.39 3.12 1.07 4.45l3.45-3.42z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 6.48c1.47 0 2.79.5 3.83 1.48l2.87-2.87C16.95 3.52 14.72 2.5 12 2.5 8.08 2.5 4.71 4.64 3.07 7.5l3.45 2.98C7.29 7.86 9.45 6.48 12 6.48z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </button>
              </div>
            </div>

            <p className="text-sm text-center text-gray-500 pt-4">
              Don’t have an account?{" "}
              <a
                href="/components/signup"
                className="text-indigo-600 hover:underline"
              >
                Sign up
              </a>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
