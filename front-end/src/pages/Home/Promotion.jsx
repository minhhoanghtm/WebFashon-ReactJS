import { Carousel } from "antd";
import React from "react";
import { Link } from "react-router-dom";

 const data = [
    {
      _id: "1",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNbry9WS7Tc7qoaySeYGFGrs9KCKNXprXBhQ&s",
      type: "product",
      target_id: "123",
      position: "home_slider",
      status: "active",
    },
    {
      _id: "2",
      image: "https://cdn.hostingviet.vn/data/tinymce/2023/hinh-nen-may-tinh-4k-1.jpg",
      type: "category",
      target_id: "456",
      position: "home_slider",
      status: "active",
    },
    {
      _id: "3",
      image: "https://i.pinimg.com/736x/41/23/a5/4123a5bfbb500a592f1e88fb151a8dfd.jpg",
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
