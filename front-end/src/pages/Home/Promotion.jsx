import { Carousel } from "antd";
import React from "react";
import { Link } from "react-router-dom";

 const data = [
    {
      _id: "1",
      image: "https://png.pngtree.com/png-clipart/20200721/original/pngtree-flash-sale-promotion-poster-template-png-image_4924968.jpg",
      type: "product",
      target_id: "123",
      position: "home_slider",
      status: "active",
    },
    {
      _id: "2",
      image: "https://img.freepik.com/premium-vector/flash-sale-modern-banner-template-design_535749-147.jpg?w=826",
      type: "category",
      target_id: "456",
      position: "home_slider",
      status: "active",
    },
    {
      _id: "3",
      image: "https://treobangron.com.vn/wp-content/uploads/2022/09/banner-khuyen-mai-42.jpg",
      type: "external",
      target_id: "https://example.com",
      position: "home_slider",
      status: "active",
    },
  ];
const Promotion = () => {
 
  return (
    <div className="w-full px-2">
      <div className="rounded-xl overflow-hidden shadow-md">
      <Carousel autoplay>
        {data.map((item) => {
            return (
                <Link key={item._id} to={`/${item.type}/${item.target_id}`}>
                    <img src={item.image} alt="Promotion" className="w-full h-full object-cover"/>
                </Link>
            );
        })}
        </Carousel>
        </div>
    </div>
  );
};

export default Promotion;
