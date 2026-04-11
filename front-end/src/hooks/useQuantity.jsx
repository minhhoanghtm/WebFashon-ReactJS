import { useState } from "react";

export const useQuantity = (stock) => {
    const [quantity, setQuantity] = useState(1);
    const increase = () => {
        setQuantity((prev) => (prev < stock ? prev + 1 : prev));
    };
    const decrease = () => {
        setQuantity((prev) => (prev > 1 ? prev - 1 : prev));
    };

    return { quantity, increase, decrease };
}