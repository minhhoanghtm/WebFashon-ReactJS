import React from 'react';
import DOMPurify from 'dompurify';

const StorySection = ({ data }) => {
  const { heading, content } = data || {};

  if (!content) return null;

  const cleanHTML = DOMPurify.sanitize(content);

  return (
    <section className="max-w-[900px] mx-auto px-6 py-16 md:py-24 rounded-none">
      {heading && (
        <div className="text-center mb-12 select-none">
          <h2 
            className="text-2xl md:text-4xl font-light text-neutral-900 tracking-[0.15em] uppercase font-serif"
            style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
          >
            {heading.normalize("NFC")}
          </h2>
          <div className="w-12 h-[1px] bg-neutral-900 mx-auto mt-6" />
        </div>
      )}

      <article 
        className="font-sans text-neutral-800 text-sm md:text-base leading-relaxed font-light tracking-wide prose prose-neutral max-w-none 
          prose-headings:font-serif prose-headings:font-light prose-headings:uppercase prose-headings:tracking-wide prose-headings:text-neutral-900
          prose-h1:text-3xl md:prose-h1:text-4xl prose-h1:my-8
          prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:my-6
          prose-h3:text-xl md:prose-h3:text-2xl prose-h3:my-5
          prose-p:leading-relaxed prose-p:mb-6 prose-p:text-neutral-700
          prose-blockquote:border-l-0 prose-blockquote:text-lg md:prose-blockquote:text-xl prose-blockquote:italic prose-blockquote:font-serif prose-blockquote:text-neutral-900 prose-blockquote:text-center prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:my-10 prose-blockquote:border-y prose-blockquote:border-neutral-200
          prose-img:rounded-none prose-img:w-full prose-img:h-auto prose-img:object-cover prose-img:my-10
          prose-ul:list-disc prose-ul:pl-6 prose-ul:my-5
          prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-5"
        dangerouslySetInnerHTML={{ __html: cleanHTML }}
      />
    </section>
  );
};

export default React.memo(StorySection);
