import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-black text-indigo-600">404</h1>
      <p className="mt-4 text-xl font-bold text-gray-800">Page Not Found</p>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-md"
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
