import mongoose from "mongoose";

export const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      result = await callback(session);
    });
  } finally {
    await session.endSession();
  }
  return result;
};
