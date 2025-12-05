"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { adminRegister } from "../../../store/slices/authSlice";
import { setCredentials } from "../../../store/slices/authSlice";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminRegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    key: "",
  });
  const [localError, setLocalError] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();
  const {
    isAuthenticated,
    loading: reduxLoading,
    error: reduxError,
    user,
  } = useSelector((s) => s.auth || {});

  useEffect(() => {
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
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!form.name || !form.email || !form.password || !form.key) {
      setLocalError(
        "Please fill all fields including the admin registration key"
      );
      return;
    }

    setLocalLoading(true);
    try {
      const result = await dispatch(
        adminRegister({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          key: form.key,
        })
      ).unwrap();

      const { token: returnedToken, user: returnedUser } = result ?? {};
      if (returnedToken) {
        try {
          localStorage.setItem("token", returnedToken);
        } catch (err) {
          console.warn("Could not save token", err);
        }
      }

      dispatch(setCredentials({ user: returnedUser, token: returnedToken }));

      // redirect handled by effect
    } catch (err) {
      const message =
        typeof err === "string" ? err : err?.message || "Registration failed";
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
        <h2 className="text-2xl font-bold mb-1">Admin Register</h2>
        <p className="text-sm text-gray-500 mb-6">
          Create an admin account using a secret key.
        </p>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-indigo-400"
              placeholder="Your full name"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Secret Key
            </label>

            <div className="relative">
              <input
                name="key"
                type={showKey ? "text" : "password"}
                value={form.key}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 pr-12 
                 focus:ring-2 focus:ring-indigo-400"
                placeholder="Enter admin registration key"
              />

              {/* Eye toggle */}
              <button
                type="button"
                onClick={() => setShowKey((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 
                 hover:text-gray-700 transition"
              >
                {showKey ? (
                  /* Eye-off icon */
                  <>🙈</>
                ) : (
                  /* Eye open */
                  <>👁️</>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-1">
              The admin key is required to create admin accounts. Ask the
              project owner for the key.
            </p>
          </div>

          {localError && (
            <div className="text-sm text-red-600">{localError}</div>
          )}

          <button
            type="submit"
            disabled={effectiveLoading}
            className="w-full mt-2 rounded-lg bg-indigo-600 text-white py-3 font-semibold disabled:opacity-60"
          >
            {effectiveLoading ? "Registering..." : "Register as Admin"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4">
          Already have an admin account?{" "}
          <a
            href="/components/login/admin"
            className="text-indigo-600 hover:underline"
          >
            Sign in
          </a>
        </p>
      </motion.div>
    </div>
  );
}
