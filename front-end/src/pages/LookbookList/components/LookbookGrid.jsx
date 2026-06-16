import React from 'react';

const LookbookGrid = ({ children }) => {
  return (
    <section 
      id="lookbooks-grid"
      className="max-w-7xl mx-auto px-6 md:px-12 pb-24"
      aria-label="Danh sách các bộ sưu tập"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {children}
      </div>
    </section>
  );
};

export default React.memo(LookbookGrid);
