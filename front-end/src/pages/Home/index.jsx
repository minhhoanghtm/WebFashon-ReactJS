import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
        Premium Collection <span className="text-indigo-600">2026</span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500">
        Discover stylish clothes, shoes, and accessories. Clean architecture rebuild for maximum scalability.
      </p>
      <div className="mt-10 flex justify-center gap-4">
        <Link
          to="/products"
          className="rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition"
        >
          View Collection
        </Link>
      </div>
    </div>
  );
};

export default Home;
