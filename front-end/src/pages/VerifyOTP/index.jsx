import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  LoaderCircle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  registerService,
  sendOTPServive,
  verifyOTPService,
} from "@/services/auth.service";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WebFashion";

  // Lấy formData được truyền từ trang Register qua navigate state
  const formData = useMemo(
    () => location.state?.formData || {},
    [location.state?.formData]
  );
  const email = formData.email || "";

  const [digits, setDigits] = useState(() => Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);

  const canResend = countdown <= 0;

  useDocumentTitle("Xác minh OTP");

  const inputRefs = useRef([]);

  // Nếu không có email (vào thẳng URL), chuyển về trang đăng ký
  useEffect(() => {
    if (!email) {
      navigate("/register", { replace: true });
    }
  }, [email, navigate]);

  // Bộ đếm ngược cho nút gửi lại OTP
  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus ô đầu tiên khi mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatCountdown = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `${sec}s`;
  };

  const otp = digits.join("");
  const isOtpComplete =
    otp.length === OTP_LENGTH && digits.every((d) => d !== "");

  // ── Xác minh OTP ────────────────────────────────────────
  const handleVerify = useCallback(
    async (explicitOtp) => {
      const codeToVerify = explicitOtp ?? otp;
      if (codeToVerify.length !== OTP_LENGTH || isVerifying) return;
      setError("");
      setIsVerifying(true);

      try {
        // Bước 1: Xác minh mã OTP
        const verifyRes = await verifyOTPService({
          email,
          otp: codeToVerify,
        });
        if (!verifyRes?.success) {
          setError(
            verifyRes?.data?.message ||
              "Mã OTP không đúng. Vui lòng kiểm tra lại."
          );
          setDigits(Array(OTP_LENGTH).fill(""));
          inputRefs.current[0]?.focus();
          return;
        }

        // Bước 2: Đăng ký tài khoản
        await registerService({
          email: formData.email,
          passWord: formData.passWord,
          lastName: formData.lastName,
          firstName: formData.firstName,
          birthday: formData.dateOfBirth,
          sex: formData.gender,
        });

        // Bước 3: Hiển thị màn hình thành công rồi chuyển trang
        setSuccess(true);
        toast.success(
          `Tạo tài khoản thành công! Chào mừng bạn đến với ${siteName}`
        );
        setTimeout(() => navigate("/login", { replace: true }), 2200);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Xác minh thất bại. Vui lòng thử lại.";
        setError(msg);
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } finally {
        setIsVerifying(false);
      }
    },
    [otp, isVerifying, email, formData, siteName, navigate]
  );

  // ── Xử lý nhập từng ký tự ──────────────────────────────
  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) return;

    const char = cleaned[cleaned.length - 1];
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError("");

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "")) {
      handleVerify(next.join(""));
    }
  };

  // ── Paste toàn bộ mã ────────────────────────────────────
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!text) return;

    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    setError("");

    const focusIndex = Math.min(text.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();

    if (next.every((d) => d !== "")) {
      handleVerify(next.join(""));
    }
  };

  // ── Backspace / Arrow keys ───────────────────────────────
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ── Gửi lại OTP ─────────────────────────────────────────
  const handleResend = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setError("");
    try {
      await sendOTPServive({ email });
      toast.success("Mã OTP mới đã được gửi đến email của bạn!");
      setDigits(Array(OTP_LENGTH).fill(""));
      setCountdown(RESEND_COOLDOWN);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Gửi lại mã thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  // ── Màn hình thành công ─────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] p-8 md:p-10 text-center">
          <div className="mx-auto h-14 w-14 border border-[var(--color-border)] flex items-center justify-center mb-6">
            <CheckCircle2 className="h-7 w-7 text-[var(--color-text)]" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight mb-2">
            Tài khoản đã được tạo
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            Chào mừng bạn đến với{" "}
            <strong className="text-[var(--color-text)]">{siteName}</strong>.
            <br />
            Hệ thống đang chuyển hướng bạn sang trang đăng nhập…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col justify-center items-center p-4 md:p-8">
      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] p-6 sm:p-10">
        {/* Nút quay lại */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-6 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Quay lại
        </button>

        {/* Brand Identity */}
        <header className="text-center mb-8">
          <span className="atelier-eyebrow block mb-2">{siteName}</span>
          <div
            className="mx-auto my-4 h-12 w-12 border border-[var(--color-border)] flex items-center justify-center"
            aria-hidden="true"
          >
            <ShieldCheck className="h-5 w-5 stroke-[1.5]" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            Nhập mã xác minh
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-2 leading-relaxed">
            Chúng tôi đã gửi mã OTP gồm {OTP_LENGTH} chữ số đến{" "}
            <span className="font-medium text-[var(--color-text)] break-all">
              {email}
            </span>
            . Mã có hiệu lực trong{" "}
            <span className="font-medium text-[var(--color-text)]">
              10 phút
            </span>
            .
          </p>
        </header>

        {/* Ô nhập mã OTP */}
        <div
          className="flex justify-center gap-2 sm:gap-2.5 my-8"
          role="group"
          aria-label="Nhập mã OTP gồm 6 chữ số"
        >
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              id={`otp-digit-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              placeholder="·"
              aria-label={`Chữ số OTP thứ ${i + 1}`}
              aria-invalid={Boolean(error)}
              className={`flex-1 max-w-[48px] min-h-[52px] text-center text-lg font-mono font-semibold border bg-[var(--color-bg)] text-[var(--color-text)] transition-colors focus:outline-none focus:border-[var(--color-text)] ${
                error
                  ? "border-[var(--color-danger)] text-[var(--color-danger)]"
                  : digit
                  ? "border-[var(--color-text)]"
                  : "border-[var(--color-border)]"
              }`}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              onFocus={(e) => e.target.select()}
              disabled={isVerifying}
              autoComplete={i === 0 ? "one-time-code" : "off"}
            />
          ))}
        </div>

        {/* Thông báo lỗi */}
        <div aria-live="polite" aria-atomic="true">
          {error && (
            <div
              role="alert"
              className="mb-6 p-3 border border-[var(--color-danger)] text-[var(--color-danger)] text-xs font-medium text-center"
            >
              {error}
            </div>
          )}
        </div>

        {/* Nút xác minh */}
        <button
          type="button"
          className="w-full min-h-[48px] px-6 py-3 bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.16em] font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => handleVerify(otp)}
          disabled={!isOtpComplete || isVerifying}
          aria-busy={isVerifying}
        >
          {isVerifying ? (
            <>
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              <span>Đang xác minh…</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Xác minh tài khoản</span>
            </>
          )}
        </button>

        {/* Gửi lại OTP */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-[var(--color-text-muted)]">
            Không nhận được mã?
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 font-medium min-h-[44px] px-2 text-[var(--color-text)] underline underline-offset-4 disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
            onClick={handleResend}
            disabled={!canResend || isResending}
          >
            {isResending ? (
              <>
                <LoaderCircle
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
                <span>Đang gửi lại…</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Gửi lại mã</span>
              </>
            )}
          </button>
          {!canResend && (
            <span
              className="font-mono text-[11px] px-2 py-1 border border-[var(--color-border)] text-[var(--color-text-muted)]"
              aria-live="off"
            >
              {formatCountdown(countdown)}
            </span>
          )}
        </div>

        <hr className="my-6 border-t border-[var(--color-border)]" />

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          Nhập sai email?{" "}
          <Link
            to="/register"
            className="font-medium text-[var(--color-text)] underline underline-offset-4 ml-1 inline-flex items-center min-h-[44px]"
          >
            Đăng ký lại
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyOTP;
