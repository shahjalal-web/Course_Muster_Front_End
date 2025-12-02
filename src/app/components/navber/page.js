// app/components/navbar/Navbar.jsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/slices/authSlice"; // <-- adjust path if needed
import "./navbar.css";
import { GiEgyptianProfile } from "react-icons/gi";

export default function Navbar() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false); // mobile menu
  const [openProfile, setOpenProfile] = useState(false); // profile dropdown
  const profileRef = useRef(null);

  // read redux auth state (expects { user, token, isAuthenticated, ... })
  const { user, isAuthenticated } = useSelector((state) => state.auth || {});
  const role = user?.role;
  console.log("user", user?.role);
  // close profile dropdown on outside click
  useEffect(() => {
    const handleDocClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpenProfile(false);
      }
    };
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  // close mobile menu when route changes (keep UI tidy)
  useEffect(() => {
    const handleRouteChange = () => {
      setOpen(false);
      setOpenProfile(false);
    };
    // next/navigation doesn't provide an event emitter here; we fallback to listen to popstate
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  const handleLogout = () => {
    try {
      // 1) dispatch redux logout
      dispatch(logout());

      // 2) if using redux-persist, remove persisted root (safe fail)
      try {
        localStorage.removeItem("persist:root"); // common default key; change if you used different key
      } catch (e) {
        // ignore
      }

      // 3) close menus
      setOpenProfile(false);
      setOpen(false);

      // 4) redirect to login
      router.replace("/components/login");
    } catch (err) {
      console.error("Logout failed", err);
      // fallback: still navigate to login
      router.replace("/components/login");
    }
  };

  const displayName =
    user?.student?.name ||
    user?.admin?.name ||
    user?.administrator?.name ||
    user?.name ||
    "P";

  return (
    <header className="nav-header">
      <nav className="nav-container">
        <div className="brand">
          <Link href="/" className="brand-link">
            CourseMaster
          </Link>
        </div>

        <button
          className="hamburger"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((s) => !s)}
        >
          <span className={`bar ${open ? "open" : ""}`} />
          <span className={`bar ${open ? "open" : ""}`} />
          <span className={`bar ${open ? "open" : ""}`} />
        </button>

        <ul className={`nav-links ${open ? "open" : ""}`}>
          <li>
            <Link href="/components/courses" onClick={() => setOpen(false)}>
              Courses
            </Link>
          </li>
          <li>
            <Link href="/components/pricing" onClick={() => setOpen(false)}>
              Pricing
            </Link>
          </li>
          <li>
            <Link href="/components/about" onClick={() => setOpen(false)}>
              About
            </Link>
          </li>
          <li>
            <Link href="/components/contact" onClick={() => setOpen(false)}>
              Contact
            </Link>
          </li>
        </ul>

        <div className="nav-actions">
          {!isAuthenticated ? (
            <div className="auth-buttons">
              <Link href="/components/login" className="btn btn-outline">
                Login
              </Link>
              <Link href="/components/signup" className="btn btn-primary">
                Sign up
              </Link>
            </div>
          ) : (
            <div className="profile-wrap" ref={profileRef}>
              <button
                className="profile-btn"
                onClick={() => setOpenProfile((v) => !v)}
                aria-haspopup="true"
                aria-expanded={openProfile}
              >
                <span className="avatar">
                  <GiEgyptianProfile />
                </span>
                <span className="profile-name">{user?.name}</span>
              </button>

              {openProfile && (
                <div className="profile-menu" role="menu">
                  <Link
                    href={
                      role === "student"
                        ? "/components/student/dashboard"
                        : "/components/admin/dashboard"
                    }
                    className="menu-item"
                    onClick={() => setOpenProfile(false)}
                  >
                    Dashboard
                  </Link>
                  <button className="menu-item logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
