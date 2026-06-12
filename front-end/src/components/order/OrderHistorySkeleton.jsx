import React from "react";

const OrderHistorySkeleton = () => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="mb-8 space-y-3">
        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded-md"></div>
        <div className="h-4 w-96 bg-gray-200 animate-pulse rounded"></div>
      </div>

      {/* Tabs Skeleton */}
      <div className="mb-6 border-b border-gray-100 pb-2">
        <div className="flex space-x-6 overflow-x-auto scrollbar-none py-2">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="h-6 w-24 bg-gray-200 animate-pulse rounded flex-shrink-0"
            ></div>
          ))}
        </div>
      </div>

      {/* Search Input Skeleton */}
      <div className="mb-8">
        <div className="h-11 w-full bg-gray-200 animate-pulse rounded-lg"></div>
      </div>

      {/* Order Cards Skeletons */}
      <div className="space-y-6">
        {[1, 2].map((cardIdx) => (
          <div
            key={cardIdx}
            className="border border-gray-100 rounded-xl p-6 bg-white shadow-sm space-y-6"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-50 gap-4">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-3 w-56 bg-gray-200 animate-pulse rounded"></div>
              </div>
              <div className="h-6 w-24 bg-gray-200 animate-pulse rounded-full"></div>
            </div>

            {/* Products */}
            <div className="space-y-4">
              {[1, 2].map((itemIdx) => (
                <div key={itemIdx} className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 animate-pulse rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-3 w-1/4 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-3 w-16 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="h-5 w-20 bg-gray-200 animate-pulse rounded text-right"></div>
                </div>
              ))}
            </div>

            {/* Footer Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-gray-50 gap-4">
              <div className="h-4 w-48 bg-gray-200 animate-pulse rounded"></div>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="h-10 w-28 bg-gray-200 animate-pulse rounded-lg flex-1 sm:flex-none"></div>
                <div className="h-10 w-28 bg-gray-200 animate-pulse rounded-lg flex-1 sm:flex-none"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistorySkeleton;
