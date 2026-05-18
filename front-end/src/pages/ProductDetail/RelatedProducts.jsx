import ProductCard from '@/components/ProductCard'
import React from 'react'
import { Link } from 'react-router-dom'

const RelatedProducts = ({ relatedProducts }) => {
  return (
    <div className='min-w-full border rounded-lg shadow-sm my-5 py-3 px-4'>
      <h1 className='text-xl font-bold mb-4'>Các sản phẩm liên quan</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Hiển thị danh sách sản phẩm liên quan ở đây */}
        {relatedProducts.map((product) => (
          <Link key={product._id} to={`/product/${product.slug}`}>
            <ProductCard key={product._id} product={product} />
          </Link>
        ))}
      </div>
    </div>
  )
}

export default RelatedProducts
