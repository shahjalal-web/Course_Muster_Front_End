/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { adminLogin } from "../../../store/slices/authSlice";
import { setCredentials } from "../../../store/slices/authSlice";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [localError, setLocalError] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    loading: reduxLoading,
    error: reduxError,
  } = useSelector((s) => s.auth || {});

  useEffect(() => {
    if (reduxError) setLocalError(reduxError);
  }, [reduxError]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      // redirect to admin dashboard
      router.push("/components/admin/dashboard");
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!form.email || !form.password) {
      setLocalError("Please provide email and password");
      return;
    }

    setLocalLoading(true);
    try {
      const result = await dispatch(
        adminLogin({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        })
      ).unwrap();

      // store token and update credentials in redux
      const { token: returnedToken, user: returnedUser } = result ?? {};
      if (returnedToken) {
        try {
          localStorage.setItem("token", returnedToken);
        } catch (err) {
          console.warn("Could not save token", err);
        }
      }

      // also set credentials to redux (useful)
      dispatch(setCredentials({ user: returnedUser, token: returnedToken }));

      // redirect handled by effect
    } catch (err) {
      const message =
        typeof err === "string" ? err : err?.message || "Admin login failed";
      setLocalError(message);
    } finally {
      setLocalLoading(false);
    }
  };

  const effectiveLoading = localLoading || reduxLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-black">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-md w-full bg-white rounded-2xl p-8 shadow"
      >
        <h2 className="text-2xl font-bold mb-1">Admin Sign in</h2>
        <p className="text-sm text-gray-500 mb-6">
          Use your admin credentials to sign in.
        </p>

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
              className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-indigo-400"
              placeholder="admin@example.com"
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
                className="w-full rounded-lg border border-gray-200 px-4 py-3 pr-12 
                 focus:ring-2 focus:ring-indigo-400 transition-shadow hover:shadow-md"
                placeholder="Choose a strong password"
                autoComplete="new-password"
              />

              {/* Eye toggle button */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 
                 hover:text-gray-700 transition"
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

          {localError && (
            <div className="text-sm text-red-600">{localError}</div>
          )}

          <button
            type="submit"
            disabled={effectiveLoading}
            className="w-full mt-2 rounded-lg bg-indigo-600 text-white py-3 font-semibold disabled:opacity-60"
          >
            {effectiveLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4">
          Don't have an admin account?{" "}
          <a
            href="/components/signup/admin"
            className="text-indigo-600 hover:underline"
          >
            Register (requires secret key)
          </a>
        </p>
      </motion.div>
    </div>
  );
}
