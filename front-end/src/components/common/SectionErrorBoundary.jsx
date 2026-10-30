import React, { Component } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

/**
 * SectionErrorBoundary
 * Local Error Boundary to catch UI and rendering crashes within individual sections,
 * preventing a single failing component from crashing the entire Home page.
 */
class SectionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn(
      `[SectionErrorBoundary] Section "${this.props.name || "Unknown"}" caught an error:`,
      error,
      errorInfo
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback({
          error: this.state.error,
          reset: this.handleReset,
        });
      }

      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      // Default editorial graceful fallback UI
      return (
        <div
          className={`home-section-error my-8 p-6 rounded-2xl border border-[#05251C]/20 bg-[#FBF9F5] dark:bg-[#151D18] text-center ${
            this.props.className || ""
          }`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#05251C]/10 text-[#05251C] flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-[#171717] dark:text-[#E8E5DF]">
                Tạm thời chưa thể tải {this.props.name ? `phần "${this.props.name}"` : "nội dung này"}
              </h3>
              <p className="text-xs text-[#77736E] dark:text-neutral-400 mt-1 max-w-md mx-auto">
                Đã xảy ra sự cố hiển thị. Các nội dung khác vẫn hoạt động bình thường.
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 text-xs font-bold uppercase tracking-wider rounded-full bg-[#05251C] text-[#FAF9F5] hover:bg-[#F5DD20] hover:text-[#05251C] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <RotateCcw size={13} />
              <span>Thử lại</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;

