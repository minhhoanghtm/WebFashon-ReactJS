import React, { useEffect, useState } from 'react'
import Promotion from './Promotion';
import Categories from './Categories';
import Featured from './Featured';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getAllProductService } from '@/services/product.service';
import { getAllCategoriesService } from '@/services/category.service';

const Home = () => {
  useDocumentTitle('Trang Chủ');
  const [products, setProducts] =useState([]);
const [categories, setCategories] = useState([]);
const [selectedCategory, setSelectedCategory] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      //Call api products
      const productRes = await getAllProductService();
      // productRes is the data array (services unwrap response), so use it directly
      setProducts(productRes || []);

      //call api categories
      const categoryRes = await getAllCategoriesService();
      setCategories(categoryRes || []);
    };
    fetchData();
  }, []);
  return (
    <div>
      <Promotion />
      <hr className='mx-10 my-6 border-gray-200"'/>
      <Categories categories={categories} onSelectCategory={setSelectedCategory}/>
      <hr className='mx-10 my-6 border-gray-200"'/>
      <Featured products={products} selectedCategory={selectedCategory} title={`${selectedCategory?.name || 'Sản phẩm nổi bật'}`} />
    </div>
  )
}

export default Home;
