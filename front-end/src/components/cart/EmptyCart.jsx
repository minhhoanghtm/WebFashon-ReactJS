import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight, LogIn } from "lucide-react";

const EmptyCart = ({ isLoggedIn = true }) => {
  return (
    <div className="mx-auto my-8 flex max-w-xl flex-col items-center border border-border bg-card px-6 py-16 text-center sm:px-10">
      <div className="mb-6 flex h-16 w-16 items-center justify-center border border-border bg-secondary text-foreground">
        <ShoppingBag size={28} strokeWidth={1.25} />
      </div>

      <p className="text-[11px] font-medium tracking-[0.24em] uppercase text-muted-foreground">
        WebFashion · Giỏ hàng
      </p>
      <h2 className="mt-2 font-sans text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Giỏ hàng của bạn đang trống
      </h2>
      <p className="mt-3 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
        {isLoggedIn
          ? "Bạn chưa lưu thiết kế nào vào giỏ hàng. Hãy khám phá danh mục bộ sưu tập mới nhất của chúng tôi."
          : "Vui lòng đăng nhập để đồng bộ giỏ hàng đã lưu trong tài khoản của bạn hoặc tiếp tục khám phá bộ sưu tập."}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {!isLoggedIn && (
          <Link
            to="/login"
            className="touch-target inline-flex items-center gap-2 border border-foreground bg-background px-6 py-3.5 text-xs font-semibold tracking-[0.16em] uppercase text-foreground transition-colors hover:bg-secondary"
          >
            <LogIn size={15} />
            <span>Đăng nhập tài khoản</span>
          </Link>
        )}
        <Link
          to="/products"
          className="touch-target inline-flex items-center gap-2 bg-primary px-7 py-3.5 text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground transition-opacity hover:opacity-90"
        >
          <span>Khám phá Bộ sưu tập</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
};

export default EmptyCart;
