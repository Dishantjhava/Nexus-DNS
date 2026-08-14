"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";

// ── AWS Sign-In Page — Exact Clone of AWS Console Sign-In Screen ──

function LoginForm() {
  const [userType, setUserType] = useState<"root" | "iam">("root");
  const [username, setUsername] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: User/Email, 2: Password (or direct submit)
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("reason") === "session_expired";

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const isAlreadyAuthenticated = !loading && !!user;

  // Focus input on mount / step change
  useEffect(() => {
    if (step === 1) {
      usernameRef.current?.focus();
    } else {
      passwordRef.current?.focus();
    }
  }, [step]);

  // If already authenticated, redirect silently to console
  useEffect(() => {
    if (isAlreadyAuthenticated) {
      router.replace("/hosted-zones");
    }
  }, [isAlreadyAuthenticated, router]);

  const handleNextOrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);

    if (!username.trim()) {
      setError(userType === "root" ? "Email address is required." : "IAM username is required.");
      usernameRef.current?.focus();
      return;
    }

    if (step === 1) {
      // Step 1 ALWAYS advances to Step 2 password prompt
      setStep(2);
      return;
    }

    if (!password) {
      setError("Password is required.");
      passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      router.push("/hosted-zones");
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "";
      const msg =
        raw.toLowerCase().includes("invalid") ||
        raw.toLowerCase().includes("credential") ||
        raw.toLowerCase().includes("unauthorized") ||
        raw.toLowerCase().includes("401")
          ? "Login failed. Invalid username or password."
          : "Login failed. Please check your credentials and try again.";
      setError(msg);
      setSubmitting(false);
      if (step === 2) {
        passwordRef.current?.focus();
      }
    }
  };

  const isDisabled = submitting || isAlreadyAuthenticated;

  return (
    <div className="aws-signin-bg">
      {/* Background light-orange 3D isometric floating cubes */}
      <div className="aws-cubes-wrapper" aria-hidden="true">
        <svg className="aws-cubes-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cubeTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF9900" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#FF9900" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="cubeLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF9900" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#FF9900" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="cubeRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF9900" stopOpacity="0.11" />
              <stop offset="100%" stopColor="#FF9900" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* Left Cluster Cubes */}
          <g transform="translate(-40, 20) scale(1.4)">
            <path d="M60,0 L120,34.6 L60,69.2 L0,34.6 Z" fill="url(#cubeTopGrad)" stroke="rgba(255,153,0,0.28)" strokeWidth="1" />
            <path d="M0,34.6 L60,69.2 L60,138.5 L0,103.9 Z" fill="url(#cubeLeftGrad)" stroke="rgba(255,153,0,0.22)" strokeWidth="1" />
            <path d="M60,69.2 L120,34.6 L120,103.9 L60,138.5 Z" fill="url(#cubeRightGrad)" stroke="rgba(255,153,0,0.22)" strokeWidth="1" />
          </g>
          <g transform="translate(60, 240) scale(1.1)">
            <path d="M60,0 L120,34.6 L60,69.2 L0,34.6 Z" fill="url(#cubeTopGrad)" stroke="rgba(255,153,0,0.25)" strokeWidth="1" />
            <path d="M0,34.6 L60,69.2 L60,138.5 L0,103.9 Z" fill="url(#cubeLeftGrad)" stroke="rgba(255,153,0,0.2)" strokeWidth="1" />
            <path d="M60,69.2 L120,34.6 L120,103.9 L60,138.5 Z" fill="url(#cubeRightGrad)" stroke="rgba(255,153,0,0.2)" strokeWidth="1" />
          </g>
          <g transform="translate(-60, 480) scale(1.6)">
            <path d="M60,0 L120,34.6 L60,69.2 L0,34.6 Z" fill="url(#cubeTopGrad)" stroke="rgba(255,153,0,0.2)" strokeWidth="1" />
            <path d="M0,34.6 L60,69.2 L60,138.5 L0,103.9 Z" fill="url(#cubeLeftGrad)" stroke="rgba(255,153,0,0.16)" strokeWidth="1" />
            <path d="M60,69.2 L120,34.6 L120,103.9 L60,138.5 Z" fill="url(#cubeRightGrad)" stroke="rgba(255,153,0,0.16)" strokeWidth="1" />
          </g>

          {/* Right Cluster Cubes */}
          <g transform="translate(1000, 60) scale(1.3)">
            <path d="M60,0 L120,34.6 L60,69.2 L0,34.6 Z" fill="url(#cubeTopGrad)" stroke="rgba(255,153,0,0.25)" strokeWidth="1" />
            <path d="M0,34.6 L60,69.2 L60,138.5 L0,103.9 Z" fill="url(#cubeLeftGrad)" stroke="rgba(255,153,0,0.2)" strokeWidth="1" />
            <path d="M60,69.2 L120,34.6 L120,103.9 L60,138.5 Z" fill="url(#cubeRightGrad)" stroke="rgba(255,153,0,0.2)" strokeWidth="1" />
          </g>
          <g transform="translate(900, 380) scale(1.5)">
            <path d="M60,0 L120,34.6 L60,69.2 L0,34.6 Z" fill="url(#cubeTopGrad)" stroke="rgba(255,153,0,0.28)" strokeWidth="1" />
            <path d="M0,34.6 L60,69.2 L60,138.5 L0,103.9 Z" fill="url(#cubeLeftGrad)" stroke="rgba(255,153,0,0.22)" strokeWidth="1" />
            <path d="M60,69.2 L120,34.6 L120,103.9 L60,138.5 Z" fill="url(#cubeRightGrad)" stroke="rgba(255,153,0,0.22)" strokeWidth="1" />
          </g>
          <g transform="translate(1120, 580) scale(1.2)">
            <path d="M60,0 L120,34.6 L60,69.2 L0,34.6 Z" fill="url(#cubeTopGrad)" stroke="rgba(255,153,0,0.22)" strokeWidth="1" />
            <path d="M0,34.6 L60,69.2 L60,138.5 L0,103.9 Z" fill="url(#cubeLeftGrad)" stroke="rgba(255,153,0,0.18)" strokeWidth="1" />
            <path d="M60,69.2 L120,34.6 L120,103.9 L60,138.5 Z" fill="url(#cubeRightGrad)" stroke="rgba(255,153,0,0.18)" strokeWidth="1" />
          </g>
        </svg>
      </div>

      {/* ── Top Bar ── */}
      <header className="aws-top-header">
        <div className="aws-top-links">
          <a href="#" onClick={(e) => e.preventDefault()} className="aws-top-link">
            Provide feedback
          </a>
          <div className="aws-top-dropdown">
            <span>Multi-session disabled</span>
            <span className="caret">▼</span>
          </div>
          <div className="aws-top-dropdown">
            <span>English</span>
            <span className="caret">▼</span>
          </div>
        </div>
      </header>

      {/* ── Centered AWS Logo ── */}
      <div className="aws-logo-container">
        <svg className="aws-logo-svg" viewBox="0 0 65 30" fill="none">
          <text
            x="2"
            y="20"
            fill="#232F3E"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="26"
            fontWeight="800"
            letterSpacing="-0.5px"
          >
            aws
          </text>
          <path d="M 6 24 Q 28 34 56 22" stroke="#FF9900" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 52 18 L 60 22 L 54 26 Z" fill="#FF9900" />
        </svg>
      </div>

      {/* ── Main Login Layout (Grid: Left Card + Right Lightsail Hero) ── */}
      <main className="aws-main-layout">
        {/* Left: Sign In Card */}
        <div className="aws-card">
          {step === 1 ? (
            <>
              <h1 className="aws-card-title">Sign In</h1>
              <p className="aws-card-subtitle">Access your AWS account by user type.</p>

              <form onSubmit={handleNextOrSubmit} noValidate>
                {/* Session expired banner */}
                {sessionExpired && !error && (
                  <div className="aws-alert aws-alert-warning" role="alert">
                    <svg className="aws-alert-icon" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8.982 1.566a1.13 1.13 0 00-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 01-1.1 0L7.1 5.995A.905.905 0 018 5zm.002 6a1 1 0 110 2 1 1 0 010-2z" />
                    </svg>
                    <span>Your session has expired. Please sign in again.</span>
                  </div>
                )}

                {/* Error alert */}
                {error && (
                  <div className="aws-alert aws-alert-error" role="alert">
                    <svg className="aws-alert-icon" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" />
                      <path d="M7.002 11a1 1 0 112 0 1 1 0 01-2 0zM7.1 4.995a.905.905 0 111.8 0l-.35 3.507a.552.552 0 01-1.1 0L7.1 4.995z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* User Type Selection Cards */}
                <div className="aws-radio-group">
                  <div className="aws-radio-label-row">
                    <span className="aws-field-label">User type</span>
                    <a href="#" onClick={(e) => e.preventDefault()} className="aws-link-underline">
                      (not sure?)
                    </a>
                  </div>

                  {/* Root user option */}
                  <div
                    className={`aws-radio-card ${userType === "root" ? "selected" : ""}`}
                    onClick={() => setUserType("root")}
                  >
                    <div className="aws-radio-circle">
                      {userType === "root" && <div className="aws-radio-dot" />}
                    </div>
                    <div className="aws-radio-content">
                      <div className="aws-radio-title">Root user</div>
                      <div className="aws-radio-desc">
                        Account owner that performs tasks requiring unrestricted access.
                      </div>
                    </div>
                  </div>

                  {/* IAM user option */}
                  <div
                    className={`aws-radio-card ${userType === "iam" ? "selected" : ""}`}
                    onClick={() => setUserType("iam")}
                  >
                    <div className="aws-radio-circle">
                      {userType === "iam" && <div className="aws-radio-dot" />}
                    </div>
                    <div className="aws-radio-content">
                      <div className="aws-radio-title">IAM user</div>
                      <div className="aws-radio-desc">
                        User within an account that performs daily tasks.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Username / Email Field */}
                <div className="aws-input-group">
                  <label className="aws-field-label" htmlFor="aws-username-input">
                    {userType === "root" ? "Email address" : "Account ID or IAM username"}
                  </label>
                  <input
                    ref={usernameRef}
                    id="aws-username-input"
                    className="aws-text-input"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    placeholder={userType === "root" ? "username@example.com" : "123456789012 or username"}
                    disabled={isDisabled}
                  />
                </div>

                {/* Next Pill Button */}
                <button type="submit" className="aws-pill-button-orange mt-5" disabled={isDisabled}>
                  {submitting ? "Signing in..." : "Next"}
                </button>

                {/* Divider - OR - */}
                <div className="aws-divider-container">
                  <div className="aws-divider-line" />
                  <span className="aws-divider-text">OR</span>
                  <div className="aws-divider-line" />
                </div>

                {/* Secondary Pill Button */}
                <button
                  type="button"
                  onClick={() => handleNextOrSubmit({ preventDefault: () => {} } as React.FormEvent)}
                  className="aws-pill-button-outline"
                >
                  New to AWS? Sign up
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Step 2: Password entry matching second screenshot */}
              <div className="flex items-center gap-2 mb-2">
                <h1 className="aws-card-title mb-0">Root user sign in</h1>
                <span className="text-[#0972D3] cursor-pointer text-sm font-bold" title="Info">
                  ⓘ
                </span>
              </div>
              <p className="aws-card-subtitle mb-4">
                Enter the password for <b className="text-[#16191F]">{username || "admin"}</b>{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setStep(1);
                  }}
                  className="aws-blue-link"
                >
                  (not you?)
                </a>
              </p>

              <form onSubmit={handleNextOrSubmit} noValidate>
                {error && (
                  <div className="aws-alert aws-alert-error" role="alert">
                    <svg className="aws-alert-icon" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z" />
                      <path d="M7.002 11a1 1 0 112 0 1 1 0 01-2 0zM7.1 4.995a.905.905 0 111.8 0l-.35 3.507a.552.552 0 01-1.1 0L7.1 4.995z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="aws-input-group">
                  <label className="aws-field-label" htmlFor="aws-password-input-s2">
                    Password
                  </label>
                  <input
                    ref={passwordRef}
                    id="aws-password-input-s2"
                    className="aws-text-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    disabled={isDisabled}
                  />
                </div>

                <div className="flex items-center justify-between mt-2 mb-4">
                  <label className="flex items-center gap-2 text-xs text-[#545B64] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="accent-[#0972D3]"
                    />
                    Show password
                  </label>
                  <a href="#" onClick={(e) => e.preventDefault()} className="aws-blue-link text-xs font-semibold">
                    Forgot password?
                  </a>
                </div>

                <button type="submit" className="aws-pill-button-orange" disabled={isDisabled}>
                  {submitting ? "Signing in..." : "Sign in"}
                </button>

                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="aws-pill-button-outline w-full mt-2"
                  >
                    Sign in to a different account
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Right: Amazon Lightsail Hero Graphic Box */}
        <div className="aws-hero-card">
          <div className="aws-hero-top">
            <h2 className="aws-hero-title">Amazon Lightsail</h2>
            <p className="aws-hero-body">
              Lightsail is the easiest way to get started on AWS
            </p>
            <button
              onClick={() => window.open("https://aws.amazon.com/lightsail/", "_blank")}
              className="aws-hero-button"
            >
              Learn more »
            </button>
          </div>

          <div className="aws-hero-bottom">
            {/* Robot Line Art Graphic */}
            <div className="aws-robot-container">
              <svg className="aws-robot-svg" viewBox="0 0 120 120" fill="none">
                {/* Antenna */}
                <line x1="60" y1="15" x2="60" y2="30" stroke="#FFFFFF" strokeWidth="2.5" />
                <circle cx="60" cy="12" r="4" fill="#FFFFFF" />

                {/* Head */}
                <rect x="40" y="30" width="40" height="30" rx="8" stroke="#FFFFFF" strokeWidth="2.5" fill="#000000" />
                <circle cx="50" cy="42" r="3.5" fill="#FFFFFF" />
                <circle cx="70" cy="42" r="3.5" fill="#FFFFFF" />
                <path d="M 52 52 Q 60 56 68 52" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />

                {/* Neck */}
                <rect x="56" y="60" width="8" height="6" fill="#FFFFFF" />

                {/* Body */}
                <rect x="42" y="66" width="36" height="34" rx="6" stroke="#FFFFFF" strokeWidth="2.5" fill="#000000" />
                <circle cx="60" cy="80" r="6" stroke="#FFFFFF" strokeWidth="2" fill="none" />
                <circle cx="60" cy="80" r="2" fill="#FFFFFF" />

                {/* Thumbs-Up Arm */}
                <path
                  d="M 78 72 C 90 70 95 55 92 50 C 90 46 84 50 86 56 C 88 62 82 72 78 74"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Left Arm */}
                <path d="M 42 74 L 32 85" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

                {/* Legs */}
                <line x1="50" y1="100" x2="50" y2="114" stroke="#FFFFFF" strokeWidth="2.5" />
                <line x1="70" y1="100" x2="70" y2="114" stroke="#FFFFFF" strokeWidth="2.5" />

                {/* Floor Line */}
                <line x1="10" y1="114" x2="105" y2="114" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="6 4" />
              </svg>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="aws-footer">
        <div className="aws-footer-text">
          © 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.
        </div>
      </footer>

      {/* ── Scoped Styling ── */}
      <style>{`
        .aws-signin-bg {
          min-height: 100vh;
          background-color: #FFFBF6;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: "Amazon Ember", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #16191F;
          overflow-x: hidden;
        }

        /* 3D Isometric Floating Cubes Wrapper */
        .aws-cubes-wrapper {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .aws-cubes-svg {
          width: 100%;
          height: 100%;
          min-width: 1200px;
          min-height: 800px;
        }

        /* Top Header */
        .aws-top-header {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          padding: 12px 32px;
          position: relative;
          z-index: 10;
        }
        .aws-top-links {
          display: flex;
          align-items: center;
          gap: 24px;
          font-size: 13px;
        }
        .aws-top-link {
          color: #0972D3;
          font-weight: 500;
          text-decoration: none;
        }
        .aws-top-link:hover {
          text-decoration: underline;
        }
        .aws-top-dropdown {
          color: #0972D3;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .aws-top-dropdown .caret {
          font-size: 9px;
          color: #0972D3;
        }

        /* Logo */
        .aws-logo-container {
          margin: 12px 0 24px;
          text-align: center;
          position: relative;
          z-index: 10;
        }
        .aws-logo-svg {
          width: 76px;
          height: auto;
        }

        /* Main Layout Grid */
        .aws-main-layout {
          display: flex;
          gap: 28px;
          max-width: 860px;
          width: 100%;
          padding: 0 16px;
          align-items: stretch;
          margin-bottom: 40px;
          position: relative;
          z-index: 10;
        }

        /* Card Container */
        .aws-card {
          background: #FFFFFF;
          border: 1px solid #D5DBDB;
          border-radius: 12px;
          padding: 32px 28px;
          width: 380px;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .aws-card-title {
          font-size: 22px;
          font-weight: 700;
          color: #16191F;
          margin: 0 0 6px;
        }
        .aws-card-subtitle {
          font-size: 13px;
          color: #545B64;
          margin: 0 0 20px;
        }

        /* Radio Group for User Type */
        .aws-radio-group {
          margin-bottom: 20px;
        }
        .aws-radio-label-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }
        .aws-field-label {
          font-size: 13px;
          font-weight: 700;
          color: #16191F;
        }
        .aws-link-underline {
          font-size: 12px;
          color: #16191F;
          text-decoration: underline dotted;
        }

        .aws-radio-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          border: 1px solid #D5DBDB;
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: border-color 0.15s, background-color 0.15s;
          background: #FFFFFF;
        }
        .aws-radio-card.selected {
          border-color: #0972D3;
          border-width: 2px;
          padding: 11px 13px;
          background: #F4F9FF;
        }

        .aws-radio-circle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #0972D3;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .aws-radio-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0972D3;
        }

        .aws-radio-title {
          font-size: 13px;
          font-weight: 700;
          color: #16191F;
          line-height: 1.2;
        }
        .aws-radio-desc {
          font-size: 11px;
          color: #687078;
          margin-top: 3px;
          line-height: 1.4;
        }

        /* Inputs */
        .aws-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }
        .aws-text-input {
          width: 100%;
          height: 38px;
          padding: 0 12px;
          border: 1px solid #8795A5;
          border-radius: 6px;
          font-size: 13px;
          color: #16191F;
          background: #FFFFFF;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .aws-text-input:focus {
          border-color: #0972D3;
          box-shadow: 0 0 0 2px rgba(9, 114, 211, 0.2);
        }

        /* Pill Buttons */
        .aws-pill-button-orange {
          width: 100%;
          height: 38px;
          background: #FF9900;
          border: none;
          border-radius: 20px;
          color: #16191F;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .aws-pill-button-orange:hover:not(:disabled) {
          background: #EC7211;
        }
        .aws-pill-button-orange:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .aws-pill-button-outline {
          width: 100%;
          height: 38px;
          background: #FFFFFF;
          border: 1px solid #0972D3;
          border-radius: 20px;
          color: #0972D3;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .aws-pill-button-outline:hover {
          background: #F4F9FF;
        }

        /* Divider */
        .aws-divider-container {
          display: flex;
          align-items: center;
          margin: 18px 0;
        }
        .aws-divider-line {
          flex: 1;
          height: 1px;
          background: #EAECF0;
        }
        .aws-divider-text {
          padding: 0 12px;
          font-size: 11px;
          font-weight: 700;
          color: #545B64;
        }

        /* Links */
        .aws-blue-link {
          color: #0972D3;
          text-decoration: none;
        }
        .aws-blue-link:hover {
          text-decoration: underline;
        }

        /* Alerts */
        .aws-alert {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 4px;
          font-size: 12px;
          margin-bottom: 16px;
        }
        .aws-alert-warning {
          background: #FFF8E6;
          border: 1px solid #F0A202;
          color: #7D4E00;
        }
        .aws-alert-error {
          background: #FFF2F2;
          border: 1px solid #D13212;
          color: #D13212;
        }
        .aws-alert-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* Right Hero Card */
        .aws-hero-card {
          flex: 1;
          background: #000000;
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 420px;
        }
        .aws-hero-top {
          background: linear-gradient(180deg, #0A0A0A 0%, #1A0D00 50%, #B84E00 100%);
          padding: 36px 32px 24px;
          flex: 1;
        }
        .aws-hero-title {
          font-size: 28px;
          font-weight: 800;
          color: #FFFFFF;
          margin: 0 0 12px;
          letter-spacing: -0.5px;
        }
        .aws-hero-body {
          font-size: 16px;
          color: #E9EAEA;
          margin: 0 0 24px;
          line-height: 1.4;
          max-width: 320px;
        }
        .aws-hero-button {
          background: transparent;
          border: 1.5px solid #FFFFFF;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .aws-hero-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .aws-hero-bottom {
          background: #000000;
          height: 140px;
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          padding-right: 48px;
        }
        .aws-robot-container {
          width: 140px;
          height: 120px;
        }
        .aws-robot-svg {
          width: 100%;
          height: 100%;
        }

        /* Footer */
        .aws-footer {
          margin-top: auto;
          padding: 24px 0;
          text-align: center;
          position: relative;
          z-index: 10;
        }
        .aws-footer-text {
          font-size: 11px;
          color: #879596;
        }

        /* Dark Mode Sign In Page Overrides */
        .dark .aws-signin-bg, [data-theme="dark"] .aws-signin-bg, body.awsui-dark-mode .aws-signin-bg {
          background-color: #0F1B2A !important;
          color: #E9EDF0 !important;
        }
        .dark .aws-card, [data-theme="dark"] .aws-card, body.awsui-dark-mode .aws-card {
          background: #162232 !important;
          border-color: #233246 !important;
          color: #E9EDF0 !important;
        }
        .dark .aws-card-title, [data-theme="dark"] .aws-card-title, body.awsui-dark-mode .aws-card-title {
          color: #FFFFFF !important;
        }
        .dark .aws-card-subtitle, [data-theme="dark"] .aws-card-subtitle, body.awsui-dark-mode .aws-card-subtitle {
          color: #9BA7B6 !important;
        }
        .dark .aws-field-label, [data-theme="dark"] .aws-field-label, body.awsui-dark-mode .aws-field-label {
          color: #E9EDF0 !important;
        }
        .dark .aws-text-input, [data-theme="dark"] .aws-text-input, body.awsui-dark-mode .aws-text-input {
          background: #162334 !important;
          border-color: #2A3B50 !important;
          color: #E9EDF0 !important;
        }
        .dark .aws-radio-card, [data-theme="dark"] .aws-radio-card, body.awsui-dark-mode .aws-radio-card {
          background: #162232 !important;
          border-color: #233246 !important;
          color: #E9EDF0 !important;
        }
        .dark .aws-radio-card.selected, [data-theme="dark"] .aws-radio-card.selected, body.awsui-dark-mode .aws-radio-card.selected {
          background: #172639 !important;
          border-color: #539FE5 !important;
        }
        .dark .aws-radio-title, [data-theme="dark"] .aws-radio-title, body.awsui-dark-mode .aws-radio-title {
          color: #FFFFFF !important;
        }
        .dark .aws-radio-desc, [data-theme="dark"] .aws-radio-desc, body.awsui-dark-mode .aws-radio-desc {
          color: #9BA7B6 !important;
        }
        .dark .aws-logo-svg text, [data-theme="dark"] .aws-logo-svg text, body.awsui-dark-mode .aws-logo-svg text {
          fill: #FFFFFF !important;
        }
        .dark .aws-pill-button-outline, [data-theme="dark"] .aws-pill-button-outline, body.awsui-dark-mode .aws-pill-button-outline {
          background: #162334 !important;
          border-color: #539FE5 !important;
          color: #539FE5 !important;
        }

        @media (max-width: 768px) {
          .aws-main-layout {
            flex-direction: column;
          }
          .aws-card {
            width: 100%;
          }
          .aws-hero-card {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <React.Suspense>
        <LoginForm />
      </React.Suspense>
    </AuthProvider>
  );
}
