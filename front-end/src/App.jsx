import "./App.css";
import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import ProductCard from "./components/ProductCard";
import ProductSearch from "./pages/ProductSearch";
import ProductDetail from "./pages/ProductDetail";
function App() {
  const [count, setCount] = useState(0);

  return (
    <BrowserRouter>
        <Routes>
          {/* <Route path="/" element={<Header />} /> */}
          {/* <Route path="/" element={<ProductSearch />} /> */}
          <Route path="/" element={<ProductDetail />} />
          {/* <Route path="/" element={<ProductCard />} /> */}
          {/* <Route path="/" element={<Footer />} /> */}
        </Routes>
    </BrowserRouter>
  );
}

export default App;
