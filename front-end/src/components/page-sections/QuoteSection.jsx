import React from 'react';

const QuoteSection = ({ data }) => {
  const { quote, author } = data || {};

  if (!quote) return null;

  return (
    <section className="py-20 md:py-28 my-8 text-center px-6 border-y border-neutral-100 rounded-none w-full bg-neutral-50/50">
      <blockquote 
        className="italic text-2xl md:text-4xl font-medium max-w-3xl mx-auto leading-relaxed text-neutral-800"
      >
        "{quote.normalize("NFC")}"
      </blockquote>
      {author && (
        <cite className="block text-[9px] uppercase tracking-[0.3em] text-neutral-400 mt-6 not-italic font-bold">
          — {author.normalize("NFC")}
        </cite>
      )}
    </section>
  );
};

export default React.memo(QuoteSection);
