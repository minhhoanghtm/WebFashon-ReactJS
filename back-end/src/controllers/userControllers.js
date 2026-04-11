import User from "../models/User.js";

// export const getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find();
//     res.status(200).json(users);
//   } catch (error) {
//     console.error("Lỗi khi gọi getAllUsers:", error);
//     res.status(500).json({ message: "Lỗi hệ thống" });
//   }
// };

// export const addUser = async (req, res) => {
//   try {
//     const newUser = await User.create(req.body);
//     res.status(201).json(newUser);
//   } catch (error) {
//     console.error("Lỗi khi gọi addUser:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

export const authMe = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json(user);
  } catch (error) {
    console.error("Lỗi khi gọi authMe:", error);
    res.status(500).json({ message: error.message });
  }
}