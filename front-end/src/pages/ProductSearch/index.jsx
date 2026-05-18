import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom';
import FilterProduct from './FilterProduct'
import SearchResults from './SearchResults'
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { searchProductsService } from '@/services/product.service';

const ProductSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const searchQuery = searchParams.get('search') || '';
  const category = searchParams.get('category') || null;
  const minPrice = searchParams.get('minPrice') || null;
  const maxPrice = searchParams.get('maxPrice') || null;
  const rating = searchParams.get('rating') || null;
  const sort = searchParams.get('sort') || 'newest';
  
  useDocumentTitle(`${searchQuery}`);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchProducts = async () => {
      if (searchQuery.trim() || category || minPrice || maxPrice || rating) {
        setLoading(true);
        try {
          const params = {
            search: searchQuery,
            ...(category && { category }),
            ...(minPrice && { minPrice }),
            ...(maxPrice && { maxPrice }),
            ...(rating && { rating }),
            ...(sort && { sort }),
          };
          
          const productsRes = await searchProductsService(params);
          setProducts(productsRes.data || []);
          console.log('Search results:', productsRes.data);
        } catch (error) {
          console.error('Lỗi khi tìm kiếm:', error);
          setProducts([]);
        } finally {
          setLoading(false);
        }
      } else {
        setProducts([]);
      }
    };
    fetchProducts();
  }, [searchQuery, category, minPrice, maxPrice, rating, sort]);

  // Xử lý khi lọc sản phẩm
  const handleApplyFilter = (filters) => {
    const newParams = new URLSearchParams(searchParams);
    
    // Cập nhật filter parameters
    if (filters.category) {
      newParams.set('category', filters.category);
    } else {
      newParams.delete('category');
    }
    
    if (filters.minPrice && filters.minPrice > 0) {
      newParams.set('minPrice', filters.minPrice);
    } else {
      newParams.delete('minPrice');
    }
    
    if (filters.maxPrice && filters.maxPrice < 1000000) {
      newParams.set('maxPrice', filters.maxPrice);
    } else {
      newParams.delete('maxPrice');
    }
    
    if (filters.rating) {
      newParams.set('rating', filters.rating);
    } else {
      newParams.delete('rating');
    }
    
    setSearchParams(newParams);
  };

  // Xử lý khi sắp xếp sản phẩm
  const handleApplySort = (sortValue) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sortValue);
    setSearchParams(newParams);
  };

  return (
    <div className='flex flex-col lg:flex-row'>
      <div className='w-full lg:w-1/5'>
        <FilterProduct onFilter={handleApplyFilter} />
      </div>
      <div className='w-full lg:w-4/5'>
        <SearchResults products={products} loading={loading} onSort={handleApplySort} currentSort={sort} />
      </div>
    </div>
  )
}

export default ProductSearch
