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

const formatCountdown = (seconds) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

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

  useDocumentTitle(`Xác minh OTP — ${siteName}`);

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

  // Ghép các ô thành chuỗi OTP hoàn chỉnh
  const otp = digits.join("");
  const isOtpComplete = otp.length === OTP_LENGTH && digits.every((d) => d !== "");

  // ── Xử lý xác minh OTP ───────────────────────────────────
  const handleVerify = useCallback(
    async (codeToVerify) => {
      const code = codeToVerify || digits.join("");
      if (code.length < OTP_LENGTH) return;

      setError("");
      setIsVerifying(true);

      try {
        await verifyOTPService({ email, otp: code });

        const payload = {
          email: formData.email,
          passWord: formData.passWord,
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
        };

        const regRes = await registerService(payload);

        if (regRes) {
          setSuccess(true);
          toast.success("Đăng ký tài khoản thành công!");
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 2000);
        }
      } catch (err) {
        console.error("Lỗi xác minh OTP:", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Mã OTP không chính xác hoặc đã hết hạn.";
        setError(msg);
        toast.error(msg);
      } finally {
        setIsVerifying(false);
      }
    },
    [email, formData, digits, navigate]
  );

  // ── Xử lý khi gõ từng ký tự ──────────────────────────────
  const handleDigitChange = (index, value) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError("");

    if (char && index < OTP_LENGTH - 1) {
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
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-md border border-border bg-card p-8 text-center sm:p-12">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center border border-border bg-secondary">
            <CheckCircle2 className="h-7 w-7 text-foreground" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight uppercase">
            Hồ sơ đã kích hoạt
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground font-sans">
            Chào mừng bạn đến với <strong className="text-foreground">{siteName}</strong>.
            <br />
            Hệ thống đang chuyển hướng tới trang đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-foreground sm:px-8">
      <div className="w-full max-w-lg border border-border bg-card p-6 sm:p-12">
        {/* Nút quay lại */}
        <button
          type="button"
          onClick={() => navigate("/register")}
          className="group mb-8 inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
        >
          <ArrowLeft size={14} aria-hidden="true" className="transition-transform group-hover:-translate-x-1" />
          <span>Quay lại đăng ký</span>
        </button>

        {/* Brand Identity */}
        <header className="mb-8 text-center">
          <p className="text-[11px] font-mono tracking-[0.28em] uppercase text-muted-foreground">
            {siteName} · BẢO MẬT TÀI KHOẢN
          </p>
          <div
            className="mx-auto my-5 flex h-12 w-12 items-center justify-center border border-border bg-secondary"
            aria-hidden="true"
          >
            <ShieldCheck className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
            Nhập mã xác minh
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-sans">
            Mã OTP gồm {OTP_LENGTH} chữ số đã được gửi tới{" "}
            <span className="font-semibold text-foreground break-all">
              {email}
            </span>
            . Mã có hiệu lực trong 10 phút.
          </p>
        </header>

        {/* Ô nhập mã OTP */}
        <div
          className="my-8 flex justify-center gap-2 sm:gap-3"
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
              className={`min-h-[52px] w-12 text-center font-mono text-xl font-bold border bg-background text-foreground transition-colors focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none ${
                error
                  ? "border-destructive text-destructive"
                  : digit
                  ? "border-foreground"
                  : "border-border"
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
              className="mb-6 border border-destructive bg-destructive/10 p-3.5 text-center text-xs font-medium text-destructive"
            >
              {error}
            </div>
          )}
        </div>

        {/* Nút xác minh */}
        <button
          type="button"
          className="group flex min-h-[46px] w-full items-center justify-center gap-2 border border-foreground bg-foreground px-6 py-3.5 text-xs font-semibold tracking-[0.24em] uppercase text-background transition-all hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
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
              <span>Đang kiểm tra mã...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>XÁC MINH & HOÀN TẤT</span>
            </>
          )}
        </button>

        {/* Gửi lại OTP */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-muted-foreground font-sans">
            Chưa nhận được mã?
          </span>
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-foreground underline underline-offset-4 disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
            onClick={handleResend}
            disabled={!canResend || isResending}
          >
            {isResending ? (
              <>
                <LoaderCircle
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
                <span>Đang gửi lại...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Gửi lại mã OTP</span>
              </>
            )}
          </button>
          {!canResend && (
            <span
              className="border border-border px-2 py-1 font-mono text-[11px] text-muted-foreground"
              aria-live="off"
            >
              {formatCountdown(countdown)}
            </span>
          )}
        </div>

        <div className="mt-6 border-t border-border pt-6 text-center text-xs text-muted-foreground font-sans">
          Sai địa chỉ email?{" "}
          <Link
            to="/register"
            className="inline-flex min-h-[44px] items-center font-semibold text-foreground underline underline-offset-4 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
          >
            Đăng ký lại
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
