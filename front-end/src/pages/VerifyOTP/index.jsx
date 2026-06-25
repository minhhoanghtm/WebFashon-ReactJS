import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, LoaderCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import { registerService, sendOTPServive, verifyOTPService } from "@/services/auth.service";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "404Studio";

  // Lấy formData được truyền từ trang Register qua navigate state
  const formData = location.state?.formData || {};
  const email = formData.email || "";

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

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
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]); // Đã tối ưu thêm dependency để tránh warning nháy số

  // Focus ô đầu tiên khi mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatCountdown = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0
      ? `${m}:${String(sec).padStart(2, "0")}`
      : `${sec}s`;
  };

  const otp = digits.join("");
  const isOtpComplete = otp.length === OTP_LENGTH && digits.every((d) => d !== "");

  // ── Xử lý nhập từng ký tự ──────────────────────────────
  const handleDigitChange = (index, value) => {
    // Chỉ nhận số
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) return;

    const char = cleaned[cleaned.length - 1];
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError("");

    // Tự chuyển sang ô tiếp theo
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ── Paste toàn bộ mã ────────────────────────────────────
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!text) return;

    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    setError("");

    // Focus vào ô cuối cùng được điền hoặc ô tiếp theo
    const focusIndex = Math.min(text.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  // ── Backspace ────────────────────────────────────────────
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        // Xóa ký tự tại ô hiện tại
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        // Xóa ô trước
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
      setCanResend(false);
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

  // ── Xác minh OTP ────────────────────────────────────────
  const handleVerify = useCallback(async () => {
    if (!isOtpComplete || isVerifying) return;
    setError("");
    setIsVerifying(true);

    try {
      // Bước 1: Xác minh mã OTP
      const verifyRes = await verifyOTPService({ email, otp });
      if (!verifyRes?.success) {
        setError(verifyRes?.data?.message || "Mã OTP không đúng. Vui lòng kiểm tra lại.");
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
      toast.success(`Tạo tài khoản thành công! Chào mừng bạn đến với ${siteName} 🎉`);
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
  }, [otp, isOtpComplete, isVerifying, email, formData, navigate]);

  // Tự động submit khi nhập đủ 6 chữ số
  useEffect(() => {
    if (isOtpComplete) {
      handleVerify();
    }
  }, [isOtpComplete, handleVerify]);

  // ── MÀN HÌNH THÀNH CÔNG (ĐÃ REDESIGN) ──────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 selection:bg-black selection:text-white">
        <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-8 md:p-10 text-center shadow-sm">
          <div className="mx-auto h-14 w-14 bg-neutral-100 rounded-full flex items-center justify-center text-black mb-6 animate-bounce">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight mb-2">Tài khoản đã được tạo!</h1>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Chào mừng bạn đến với <strong className="text-neutral-900">{siteName}</strong>.<br />
            Hệ thống đang chuyển hướng bạn sang trang đăng nhập…
          </p>
        </div>
      </div>
    );
  }

  // ── GIAO DIỆN CHÍNH (ĐÃ REDESIGN QUA TAILWIND) ──────────────────
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center p-4 selection:bg-black selection:text-white">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-8 md:p-10 shadow-sm">
        
        {/* Nút quay lại */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-black transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          Quay lại
        </button>

        {/* Brand Identity Branding */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black tracking-tighter text-black uppercase mb-1">
            {siteName.toUpperCase()}
          </h2>
          <p className="text-[10px] tracking-wider uppercase text-neutral-400 font-medium">
            Discover premium fashion tailored to you.
          </p>
        </div>

        {/* Icon wrapper */}
        <div className="flex justify-center mb-6" aria-hidden="true">
          <div className="h-12 w-12 bg-neutral-50 border border-neutral-100 rounded-xl flex items-center justify-center text-neutral-800">
            <ShieldCheck className="h-6 w-6 stroke-[1.5]" />
          </div>
        </div>

        {/* Tiêu đề đoạn Text giới thiệu */}
        <header className="text-center mb-8">
          <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 block mb-1.5">
            Xác thực tài khoản
          </span>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Nhập mã xác minh
          </h1>
          <p className="text-xs text-neutral-500 mt-2 leading-relaxed max-w-xs mx-auto">
            Chúng tôi đã gửi mã OTP gồm {OTP_LENGTH} chữ số đến{" "}
            <span className="font-semibold text-neutral-900 break-all">{email}</span>.{" "}
            Mã có hiệu lực trong <span className="font-medium text-neutral-800">10 phút</span>.
          </p>
        </header>

        {/* Ô nhập mã OTP */}
        <div
          className="flex justify-between gap-2.5 my-8"
          role="group"
          aria-label="Nhập mã OTP"
        >
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              id={`otp-digit-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              placeholder="·"
              aria-label={`Chữ số thứ ${i + 1}`}
              className={`w-12 h-14 md:w-14 md:h-16 text-center text-lg font-bold font-mono rounded-xl border outline-none transition-all shadow-inner 
                ${digit ? "border-black bg-white text-black ring-1 ring-black" : "border-neutral-200 bg-neutral-50 text-neutral-400 placeholder-neutral-300 focus:bg-white focus:border-black focus:ring-1 focus:ring-black"}
                ${error ? "border-red-500 bg-red-50/30 text-red-600 focus:border-red-500 focus:ring-red-500" : ""}
              `}
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
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 flex items-center justify-center text-center" role="alert">
            {error}
          </div>
        )}

        {/* Nút xác minh */}
        <button
          type="button"
          className={`w-full py-3.5 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all duration-200 
            ${isOtpComplete && !isVerifying 
              ? "bg-black text-white hover:bg-neutral-900 active:scale-[0.99] cursor-pointer" 
              : "bg-neutral-100 text-neutral-400 cursor-not-allowed"}`}
          onClick={handleVerify}
          disabled={!isOtpComplete || isVerifying}
          aria-busy={isVerifying}
        >
          {isVerifying ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Đang xác minh…</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Xác minh</span>
            </>
          )}
        </button>

        {/* Gửi lại OTP */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs">
          <span className="text-neutral-400">Không nhận được mã?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`inline-flex items-center gap-1 font-bold transition-colors
                ${canResend && !isResending ? "text-black hover:underline cursor-pointer" : "text-neutral-400 cursor-not-allowed"}`}
              onClick={handleResend}
              disabled={!canResend || isResending}
            >
              {isResending ? (
                <>
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  Đang gửi lại…
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" aria-hidden="true" />
                  Gửi lại mã
                </>
              )}
            </button>
            {!canResend && (
              <span className="text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded font-mono text-[11px]">
                {formatCountdown(countdown)}
              </span>
            )}
          </div>
        </div>

        {/* Divider chân trang */}
        <hr className="my-6 border-t border-dashed border-neutral-100" />

        {/* Footer */}
        <p className="text-center text-xs text-neutral-400">
          Nhập sai email?{" "}
          <Link to="/register" className="font-bold text-neutral-800 hover:text-black underline underline-offset-2 ml-1">
            Đăng ký lại
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyOTP;