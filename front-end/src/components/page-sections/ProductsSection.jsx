import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

const ProductsSection = ({ data }) => {
  const { products = [] } = data || {};

  if (!products || products.length === 0) return null;

  return (
    <section className="border-t border-neutral-100 bg-white py-16 md:py-24 rounded-none">
      <div className="max-w-7xl mx-auto px-6 md:px-12 rounded-none">
        <div className="flex flex-col items-start gap-2 mb-16 rounded-none select-none">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Shop The Look</span>
          <h2 
            className="text-2xl md:text-4xl font-light text-neutral-900 tracking-wide uppercase font-serif"
            style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
          >
            Sản phẩm trong bộ sưu tập
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 rounded-none">
          {products.map((product) => {
            const discount = product.old_price > product.new_price 
              ? Math.round(((product.old_price - product.new_price) / product.old_price) * 100)
              : 0;
            
            const mainImage = product.displayProduct?.[0];

            return (
              <div 
                key={product._id} 
                className="group flex flex-col bg-transparent overflow-hidden border-none shadow-none rounded-none relative"
              >
                {discount > 0 && (
                  <span className="absolute top-3 left-3 z-10 bg-neutral-900 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none">
                    -{discount}%
                  </span>
                )}

                {/* Image */}
                {mainImage && (
                  <div className="aspect-[3/4] w-full overflow-hidden bg-neutral-50 relative rounded-none">
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-700 ease-out rounded-none"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="pt-4 flex-1 flex flex-col text-left rounded-none">
                  <h3 className="font-sans font-medium text-neutral-900 text-xs md:text-sm uppercase tracking-wider mb-2 line-clamp-1 group-hover:text-neutral-500 transition duration-300">
                    {product.name}
                  </h3>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-neutral-900 font-bold text-sm">
                      {formatCurrency(product.new_price)}
                    </span>
                    {discount > 0 && (
                      <span className="text-neutral-400 line-through text-[11px] font-light">
                        {formatCurrency(product.old_price)}
                      </span>
                    )}
                  </div>

                  {/* View Button */}
                  <Link
                    to={`/product/${product.slug}`}
                    className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 border border-neutral-950 bg-transparent text-neutral-950 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-950 hover:text-white transition duration-300 rounded-none"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Xem chi tiết sản phẩm
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default React.memo(ProductsSection);
