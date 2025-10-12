"use client";

import Link from "next/link";
import Navbar from "./Navbar";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";

export default function AuthPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/workspaces";

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const fd = new FormData(e.currentTarget);
      const email = String(fd.get("email") || "").trim();
      const password = String(fd.get("password") || "");

      // If anything is missing, show the unified error
      if (!email || !password) {
        setErr("Invalid Credentials");
        return;
      }

      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        // swallow server message; always show unified text
        setErr("Invalid Credentials");
        return;
      }

      try { await res.json(); } catch {}

      router.replace(next);
    } catch {
      setErr("Invalid Credentials");
    } finally {
      setLoading(false);
    }
  }, [next, router]);

  return (
    <div className="grid grid-cols-5 w-full h-screen overflow-hidden">
      {/* Left: banner */}
      <div
        className="col-span-3 flex flex-col w-full h-[100vh] px-16 bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: "url('/Banner.png')" }}
      >
        <Navbar />
        <div className="flex flex-col justify-center items-center w-full p-16 mt-14 z-10">
          <img src="/Logo.png" className="h-52" alt="Logo" />
          <img src="/BannerTitle.png" className="h-36" alt="CVITX" />
        </div>
      </div>

      {/* Right: form */}
      <div className="col-span-2 flex justify-center items-center ">
        <form className="w-96 flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="text-center">
            <p className="text-4xl font-bold text-white">Sign-In</p>
            <p className="text-xs text-gray-300 mt-1">Please enter your credentials</p>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm text-white">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="p-3 rounded-md bg-gray-800 text-white border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              autoComplete="username"
              disabled={loading}
              required
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm text-white">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="p-3 rounded-md bg-gray-800 text-white border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
              required
            />
            {/* Error directly under password field */}
            {err && (
              <div className="mt-3 p-1 rounded-md border border-red-500 text-red-500 text-sm flex flex-col items-center justify-center">
                <p className="text-center w-full">Invalid Credentials</p>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-md transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="w-full flex flex-row justify-center items-center gap-4">
            <div className="w-full h-[1px] bg-gray-700"></div>
            <p className="text-xs text-gray-600">OR</p>
            <div className="w-full h-[1px] bg-gray-700"></div>
          </div>

          <Link
            href="/auth-request"
            className="block w-full text-center border border-orange-500 hover:bg-orange-500 text-white py-3 rounded-md transition"
          >
            Request an Account
          </Link>
        </form>
      </div>

      {/* Decorative gradients */}
      <div className="absolute blue-gradient w-[350px] h-[350px] -top-44 -right-16 z-0"></div>
      <div className="absolute lightblue-gradient w-[250px] h-[250px] -top-36 -right-16 z-0"></div>
      <div className="absolute orange-gradient w-[350px] h-[350px] -bottom-44 -left-52 z-0"></div>
      <div className="absolute light-orange-gradient w-[500px] h-[500px] -bottom-44 -left-52 z-0"></div>
    </div>
  );
}
