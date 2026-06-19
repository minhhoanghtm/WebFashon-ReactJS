import React, { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

const Markdown = ({ children }) => {
  const cleanHtml = useMemo(() => {
    if (typeof children !== "string") {
      return "";
    }
    // Parse Markdown to HTML
    const rawHtml = marked.parse(children);
    // Sanitize the HTML to prevent XSS
    return DOMPurify.sanitize(rawHtml);
  }, [children]);

  return (
    <div
      className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};

export default Markdown;
