import React from 'react'
import Promotion from './Promotion';
import Categories from './Categories';
import Featured from './Featured';

const Home = () => {
  return (
    <div>
      <Promotion />
      <hr className='mx-10 my-5 text-xl'/>
      <Categories />
      <hr className='mx-10 my-5 text-xl'/>
      <Featured />
    </div>
  )
}

export default Home;
