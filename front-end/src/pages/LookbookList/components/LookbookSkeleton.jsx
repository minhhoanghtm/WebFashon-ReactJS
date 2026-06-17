import React from 'react';

const LookbookSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="flex flex-col bg-transparent overflow-hidden animate-pulse"
        >
          {/* Card Image Skeleton (2/3 aspect ratio) */}
          <div className="aspect-[2/3] w-full bg-neutral-200" />
          
          {/* Info Details Skeleton */}
          <div className="pt-4 pb-2 space-y-3">
            {/* Title Line */}
            <div className="h-4 bg-neutral-200 w-3/4 rounded-sm" />
            
            {/* Excerpt Lines */}
            <div className="space-y-2">
              <div className="h-3 bg-neutral-200 w-full rounded-sm" />
              <div className="h-3 bg-neutral-200 w-2/3 rounded-sm" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(LookbookSkeleton);
