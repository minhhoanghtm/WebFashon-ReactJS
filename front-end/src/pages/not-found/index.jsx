import { useEffect } from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  useEffect(() => {
    document.title = "404 — Không tìm thấy trang | WebFashion";
  }, []);

  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-sm font-semibold tracking-[0.24em] text-muted-foreground uppercase">Lỗi 404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
        Không tìm thấy trang này
      </h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
        Liên kết có thể đã thay đổi hoặc trang không còn tồn tại.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Về trang chủ
      </Link>
    </section>
  );
};

export default NotFound;
