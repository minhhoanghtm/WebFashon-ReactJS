import CartItem from "../models/CartItem.js";
import Cart from "../models/Cart.js";

export const addCartItem = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { product_id, variant_id, quantity = 1, price } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    if (!product_id || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu sản phẩm để thêm vào giỏ hàng",
      });
    }

    let cart = await Cart.findOne({ user_id: userId });

    if (!cart) {
      cart = await Cart.create({ user_id: userId });
    }

    const cartId = cart._id;
    const normalizedVariantId = variant_id || null;

    const existingItem = await CartItem.findOne({
      cart_id: cartId,
      product_id,
      variant_id: normalizedVariantId,
    });

    let item;

    if (existingItem) {
      existingItem.quantity += Number(quantity);
      item = await existingItem.save();
    } else {
      item = await CartItem.create({
        cart_id: cartId,
        product_id,
        variant_id: normalizedVariantId,
        quantity: Number(quantity),
        price: Number(price),
      });
    }

    // 🔥 recalc cart
    const cartItems = await CartItem.find({ cart_id: cartId });

    const totalItems = cartItems.reduce(
      (sum, i) => sum + (i.quantity || 0),
      0
    );

    const totalPrice = cartItems.reduce(
      (sum, i) => sum + (i.price || 0) * (i.quantity || 0),
      0
    );

    const updatedCart = await Cart.findByIdAndUpdate(
      cartId,
      {
        total_items: totalItems,
        total_price: totalPrice,
      },
      { new: true }
    );

    const populatedItems = await CartItem.find({ cart_id: cartId })
      .populate("product_id")
      .populate({
        path: "variant_id",
        options: { strictPopulate: false },
      });

    res.status(200).json({
      success: true,
      message: "Thêm vào giỏ hàng thành công",
      data: populatedItems,
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Lỗi khi gọi addCartItem:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

export const getCartItems = async (req, res) => {
  try {
    const { cartId } = req.params;

    const cartItems = await CartItem.find({ cart_id: cartId })
      .populate("product_id")
      .populate({
        path: "variant_id",
        options: { strictPopulate: false }
      });

    res.status(200).json({
      success: true,
      data: cartItems
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const cartItem = await CartItem.findById(id);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm trong giỏ hàng"
      });
    }
        const cartId = cartItem.cart_id;
        
        await CartItem.findByIdAndUpdate(id, req.body);
        
        // Fetch updated cart items and calculate total
        const updatedItems = await CartItem.find({ cart_id: cartId })
            .populate("product_id")
            .populate({
                path: "variant_id",
                options: { strictPopulate: false }
            });
        
        const total = updatedItems.reduce((sum, item) => 
            sum + (item.price || 0) * (item.quantity || 0), 0
        );
        
        // Update cart with new totals
        const updatedCart = await Cart.findByIdAndUpdate(
            cartId,
            {
                total_items: updatedItems.length,
                total_price: total
            },
            { new: true }
        );
        
        res.status(200).json({
            success: true,
            message: "Cập nhật sản phẩm trong giỏ hàng thành công",
            data: updatedItems,
            cart: updatedCart,
            total
        });
    } catch (error) {
        console.error("Lỗi khi gọi updateCartItem:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi hệ thống"
        });
    }
}

export const deleteCartItem = async (req, res) => { 
    try {
        const { id } = req.params;
        const cartItem = await CartItem.findById(id);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm trong giỏ hàng"
      });
    }
        const cartId = cartItem.cart_id;
        
        await CartItem.findByIdAndDelete(id);
        
        // Fetch updated cart items and calculate total
        const updatedItems = await CartItem.find({ cart_id: cartId })
            .populate("product_id")
            .populate({
                path: "variant_id",
                options: { strictPopulate: false }
            });
        
        const total = updatedItems.reduce((sum, item) => 
            sum + (item.price || 0) * (item.quantity || 0), 0
        );
        
        // Update cart with new totals
        const updatedCart = await Cart.findByIdAndUpdate(
            cartId,
            {
                total_items: updatedItems.length,
                total_price: total
            },
            { new: true }
        );
        
        res.status(200).json({
            success: true,
            message: "Xóa sản phẩm khỏi giỏ hàng thành công",
            data: updatedItems,
            cart: updatedCart,
            total
        });
    } catch (error) {
        console.error("Lỗi khi gọi deleteCartItem:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi hệ thống"
        });
    }
}
