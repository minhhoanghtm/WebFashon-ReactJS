import React, { useRef, useEffect } from "react";

const OTP_LENGTH = 6;

/**
 * Reusable 6-digit OTP Input component.
 * Supports auto-focus, backspace jumping, full-code pasting, and mobile numeric keypad.
 */
export const OtpInput = ({
  value = "",
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
  className = "",
}) => {
  const inputRefs = useRef([]);

  // Convert string value to array of 6 chars
  const digits = Array(OTP_LENGTH)
    .fill("")
    .map((_, i) => (value && value[i] ? value[i] : ""));

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const triggerChange = (newDigits) => {
    const combined = newDigits.join("");
    if (onChange) onChange(combined);
    if (combined.length === OTP_LENGTH && newDigits.every((d) => d !== "")) {
      if (onComplete) onComplete(combined);
    }
  };

  const handleInputChange = (index, e) => {
    const rawVal = e.target.value;
    const cleanDigit = rawVal.replace(/\D/g, "").slice(-1);

    const nextDigits = [...digits];
    nextDigits[index] = cleanDigit;
    triggerChange(nextDigits);

    if (cleanDigit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const nextDigits = [...digits];
        nextDigits[index] = "";
        triggerChange(nextDigits);
      } else if (index > 0) {
        const nextDigits = [...digits];
        nextDigits[index - 1] = "";
        triggerChange(nextDigits);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text/plain");
    const numbersOnly = pastedText.replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!numbersOnly) return;

    const nextDigits = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < numbersOnly.length; i++) {
      nextDigits[i] = numbersOnly[i];
    }
    triggerChange(nextDigits);

    const focusIdx = Math.min(numbersOnly.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div
      role="group"
      aria-label="Nhập mã OTP 6 chữ số"
      className={`flex items-center justify-between gap-2 sm:gap-3 ${className}`}
      onPaste={handlePaste}
    >
      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
        <input
          key={index}
          data-otp-slot={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={1}
          value={digits[index]}
          onChange={(e) => handleInputChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          aria-label={`Chữ số thứ ${index + 1}`}
          aria-invalid={hasError}
          className={`h-12 w-11 sm:h-14 sm:w-12 text-center text-lg sm:text-xl font-bold font-mono tracking-wider transition-all
            min-h-[44px] min-w-[40px]
            bg-background text-foreground border rounded-none
            focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none
            disabled:cursor-not-allowed disabled:opacity-50
            ${
              hasError
                ? "border-destructive text-destructive focus:border-destructive focus:ring-destructive"
                : digits[index]
                ? "border-foreground"
                : "border-border"
            }`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
