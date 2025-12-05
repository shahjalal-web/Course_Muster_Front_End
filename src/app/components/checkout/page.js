"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://course-muster-back-end.vercel.app";

export default function CheckoutPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams?.get("courseId");
  const batchId = searchParams?.get("batch") || "";

  // assume user is stored in redux under state.auth.user (adjust as needed)
  const user = useSelector((s) => s?.auth?.user || null);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardName, setCardName] = useState(user?.name || "");
  const [cardNumber, setCardNumber] = useState("");
  const [bikashTrx, setBikashTrx] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!courseId) return;

    let ac = new AbortController();

    const fetchCourse = async () => {
      setLoading(true);
      setError(null);

      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const res = await fetch(
          `${API_BASE}/api/courses/${encodeURIComponent(courseId)}`,
          {
            signal: ac.signal,
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}), // add token only if exists
            },
          }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load course");
        }

        const data = await res.json();
        setCourse(data?.course || data);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error(err);
        setError(err.message || "Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
    return () => ac.abort();
  }, [courseId]);

  const price = useMemo(
    () => (course?.price ? Number(course.price) : 0),
    [course]
  );

  const handlePay = async (e) => {
    e?.preventDefault();
    setError(null);
    if (!courseId) return setError("Missing course id");
    if (!user) {
      const next = `/components/checkout?courseId=${encodeURIComponent(
        courseId
      )}${batchId ? `&batch=${encodeURIComponent(batchId)}` : ""}`;
      return router.push(`/auth/login?next=${encodeURIComponent(next)}`);
    }

    // validation
    if (paymentMethod === "card") {
      if (!cardNumber.trim()) return setError("Enter card number (dummy).");
    } else {
      if (!bikashTrx.trim()) return setError("Enter bKash trx id (dummy).");
    }

    setProcessing(true);

    try {
      // prepare payment object
      const payment = {
        method: paymentMethod,
        status: "paid",
        paidAt: new Date().toISOString(),
        cardLast4:
          paymentMethod === "card"
            ? String(cardNumber).replace(/\s+/g, "").slice(-4)
            : undefined,
        trxId: paymentMethod === "bikash" ? bikashTrx.trim() : undefined,
      };

      const payload = {
        courseId,
        batchId: batchId || null,
        user: {
          id: user?.id || user?._id || null,
          name: user?.name || null,
          email: user?.email || null,
        },
        payment,
      };

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const res = await fetch(`${API_BASE}/api/course/student/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      // If server returns HTML (like your previous error), read text
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const json = await res.json();
          throw new Error(
            json?.error || json?.message || `Status ${res.status}`
          );
        } else {
          const text = await res.text();
          throw new Error(text || `Status ${res.status}`);
        }
      }

      // success
      const data = contentType.includes("application/json")
        ? await res.json()
        : null;
      setSuccess(data?.message || "Enrollment successful");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Payment / enrollment failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return <div className="p-6 text-center">Loading checkout...</div>;
  if (error)
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 text-black">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-2">Checkout</h1>
        <p className="text-sm text-gray-500 mb-6">
          Complete your enrollment payment (dummy).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="mb-4">
              <label className="text-xs text-gray-500">Course</label>
              <div className="p-3 border rounded mt-1">
                {course?.title || "—"}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500">Student</label>
              <div className="p-3 border rounded mt-1">
                <div className="font-medium">{user?.name || "Guest"}</div>
                <div className="text-xs text-gray-500">
                  {user?.email || "—"}
                </div>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Payment Method</label>
                <div className="mt-2 space-x-3">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="pm"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                    />
                    <span className="ml-2 text-sm">Card (dummy)</span>
                  </label>

                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="pm"
                      value="Bkash"
                      checked={paymentMethod === "bikash"}
                      onChange={() => setPaymentMethod("bikash")}
                    />
                    <span className="ml-2 text-sm">bKash / Mobile (dummy)</span>
                  </label>
                </div>
              </div>

              {paymentMethod === "card" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">
                      Name on card
                    </label>
                    <input
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3 py-2 border rounded mt-1"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Card number</label>
                    <input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded mt-1"
                      placeholder="4242 4242 4242 4242 (dummy)"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      We only store last 4 digits for demo.
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "bikash" && (
                <div>
                  <label className="text-xs text-gray-500">
                    bKash trx id (dummy)
                  </label>
                  <input
                    value={bikashTrx}
                    onChange={(e) => setBikashTrx(e.target.value)}
                    className="w-full px-3 py-2 border rounded mt-1"
                    placeholder="e.g. TRX123456789"
                  />
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={processing}
                  className={`px-4 py-2 rounded-lg w-full ${
                    processing
                      ? "bg-gray-300 text-gray-700"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  {processing
                    ? "Processing..."
                    : price > 0
                    ? `Pay ${price} BDT`
                    : "Complete Enrollment (Free)"}
                </button>
              </div>
            </form>

            {success && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded">
                {success}
              </div>
            )}
          </div>

          <div>
            <div className="bg-gray-50 rounded p-4 sticky top-6">
              <div className="text-sm text-gray-500">Order summary</div>
              <div className="mt-2 border-b pb-3">
                <div className="flex justify-between text-sm">
                  <div>{course?.title || "Course"}</div>
                  <div>{price > 0 ? `${price} BDT` : "Free"}</div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Batch: {batchId || "Any / Open"}
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between font-medium">
                  <div>Total</div>
                  <div>{price > 0 ? `${price} BDT` : "Free"}</div>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                After successful (dummy) payment your enrollment will be stored
                in the database and you will be able to access the course.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
