import { useState, useEffect, useRef } from "react";

/**
 * Hook countdown thời gian thực chuẩn xác dựa trên Server Time (offset),
 * loại trừ sai số từ đồng hồ máy khách.
 * @param {string|Date} targetEndTime - Thời gian kết thúc chiến dịch
 * @param {string|Date} initialServerTime - Thời gian server trả về từ response API
 * @param {Function} onEnd - Callback kích hoạt khi hết giờ
 */
export const useServerCountdown = (targetEndTime, initialServerTime, onEnd) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isEnded: false,
    totalSeconds: 0,
  });

  const onEndCalledRef = useRef(false);

  useEffect(() => {
    if (!targetEndTime || !initialServerTime) return;

    const serverMs = new Date(initialServerTime).getTime();
    const clientMsAtReceive = Date.now();
    // Offset giữa server và client
    const serverClientOffset = serverMs - clientMsAtReceive;
    const targetMs = new Date(targetEndTime).getTime();

    const calculateTime = () => {
      const nowEstimatedServerMs = Date.now() + serverClientOffset;
      const diffMs = targetMs - nowEstimatedServerMs;

      if (diffMs <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isEnded: true,
          totalSeconds: 0,
        });

        if (!onEndCalledRef.current && typeof onEnd === "function") {
          onEndCalledRef.current = true;
          onEnd();
        }
        return false;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isEnded: false,
        totalSeconds,
      });
      return true;
    };

    // Tính ngay lần đầu
    calculateTime();

    const interval = setInterval(() => {
      const continuing = calculateTime();
      if (!continuing) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetEndTime, initialServerTime, onEnd]);

  return timeLeft;
};

export default useServerCountdown;

