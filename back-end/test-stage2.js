import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "./src/configs/db.js";

// Import Repositories
import productRepository from "./src/modules/products/product.repository.js";
import categoryRepository from "./src/modules/categories/category.repository.js";
import userRepository from "./src/modules/users/user.repository.js";
import reviewRepository from "./src/modules/reviews/review.repository.js";

// Import Models for comparison
import Product from "./src/modules/products/product.model.js";
import Category from "./src/modules/categories/category.model.js";
import User from "./src/modules/users/user.model.js";
import Review from "./src/modules/reviews/review.model.js";

dotenv.config({ path: "./.env" });

async function run() {
  console.log("Connecting to Database...");
  await connectDB();
  console.log("Connected to Database.\n");

  const results = [];
  const addResult = (testName, passed, details) => {
    results.push({ testName, status: passed ? "PASSED" : "FAILED", details });
    console.log(`[${passed ? "PASSED" : "FAILED"}] ${testName}: ${details}`);
  };

  try {
    // ----------------------------------------------------
    // VERIFICATION 1: ProductRepository.findWithoutPagination
    // ----------------------------------------------------
    console.log("--- Verifying productRepository.findWithoutPagination() ---");
    const products = await productRepository.findWithoutPagination();
    if (products.length > 0) {
      const isPlain = !(products[0] instanceof mongoose.Document);
      addResult(
        "productRepository.findWithoutPagination() is Lean",
        isPlain,
        `Result count: ${products.length}, isPlainObject: ${isPlain}`
      );
    } else {
      addResult(
        "productRepository.findWithoutPagination() is Lean",
        true,
        "No products found to verify, but query executed successfully."
      );
    }

    // ----------------------------------------------------
    // VERIFICATION 2: ProductRepository.findVariants
    // ----------------------------------------------------
    console.log("\n--- Verifying productRepository.findVariants() ---");
    const variants = await productRepository.findVariants();
    if (variants.length > 0) {
      const isPlain = !(variants[0] instanceof mongoose.Document);
      addResult(
        "productRepository.findVariants() is Lean",
        isPlain,
        `Result count: ${variants.length}, isPlainObject: ${isPlain}`
      );
    } else {
      addResult(
        "productRepository.findVariants() is Lean",
        true,
        "No variants found to verify, but query executed successfully."
      );
    }

    // ----------------------------------------------------
    // VERIFICATION 3: CategoryRepository.findAll
    // ----------------------------------------------------
    console.log("\n--- Verifying categoryRepository.findAll() ---");
    const categories = await categoryRepository.findAll();
    if (categories.length > 0) {
      const isPlain = !(categories[0] instanceof mongoose.Document);
      addResult(
        "categoryRepository.findAll() is Lean",
        isPlain,
        `Result count: ${categories.length}, isPlainObject: ${isPlain}`
      );
    } else {
      addResult(
        "categoryRepository.findAll() is Lean",
        true,
        "No categories found to verify, but query executed successfully."
      );
    }

    // ----------------------------------------------------
    // VERIFICATION 4: UserRepository.findAll & findAllWithoutPassword
    // ----------------------------------------------------
    console.log("\n--- Verifying userRepository.findAll() and findAllWithoutPassword() ---");
    const users = await userRepository.findAll();
    const usersNoPw = await userRepository.findAllWithoutPassword();
    const isUsersPlain = users.length > 0 ? !(users[0] instanceof mongoose.Document) : true;
    const isUsersNoPwPlain = usersNoPw.length > 0 ? !(usersNoPw[0] instanceof mongoose.Document) : true;

    addResult(
      "userRepository.findAll() is Lean",
      isUsersPlain,
      `Result count: ${users.length}, isPlainObject: ${isUsersPlain}`
    );
    addResult(
      "userRepository.findAllWithoutPassword() is Lean",
      isUsersNoPwPlain,
      `Result count: ${usersNoPw.length}, isPlainObject: ${isUsersNoPwPlain}`
    );

    // ----------------------------------------------------
    // VERIFICATION 5: ReviewRepository.find & findReviewsWithUserDetails
    // ----------------------------------------------------
    console.log("\n--- Verifying reviewRepository.find() and findReviewsWithUserDetails() ---");
    const reviews = await reviewRepository.find();
    const isReviewsPlain = reviews.length > 0 ? !(reviews[0] instanceof mongoose.Document) : true;
    addResult(
      "reviewRepository.find() is Lean",
      isReviewsPlain,
      `Result count: ${reviews.length}, isPlainObject: ${isReviewsPlain}`
    );

    // Find a product to get reviews
    let testProductId = null;
    if (reviews.length > 0) {
      testProductId = reviews[0].product_id;
    } else if (products.length > 0) {
      testProductId = products[0]._id;
    }

    if (testProductId) {
      const reviewsWithUser = await reviewRepository.findReviewsWithUserDetails(testProductId);
      const isReviewsWithUserPlain = reviewsWithUser.length > 0 ? !(reviewsWithUser[0] instanceof mongoose.Document) : true;
      let isUserPopulatedPlain = true;
      if (reviewsWithUser.length > 0 && reviewsWithUser[0].user_id) {
        // If user_id is populated, check if it's a plain object
        isUserPopulatedPlain = !(reviewsWithUser[0].user_id instanceof mongoose.Document);
      }
      addResult(
        "reviewRepository.findReviewsWithUserDetails() is Lean and Populated correctly",
        isReviewsWithUserPlain && isUserPopulatedPlain,
        `Result count: ${reviewsWithUser.length}, isPlainObject: ${isReviewsWithUserPlain}, isPopulatedUserPlain: ${isUserPopulatedPlain}`
      );
    } else {
      console.log("Skipping reviewRepository.findReviewsWithUserDetails test - no product ID available");
    }

    // ----------------------------------------------------
    // BENCHMARK AND PERFORMANCE METRICS
    // ----------------------------------------------------
    console.log("\n==================================================");
    console.log("RUNNING BENCHMARK: Document instantiation vs Lean Objects");
    console.log("==================================================");

    // We will query Products with and without lean
    const iterations = 50;
    
    // 1. Without Lean
    const startNonLean = performance.now();
    let docCountNonLean = 0;
    let nonLeanResults = [];
    for (let i = 0; i < iterations; i++) {
      nonLeanResults = await Product.find({});
      docCountNonLean += nonLeanResults.filter(p => p instanceof mongoose.Document).length;
    }
    const endNonLean = performance.now();
    const timeNonLean = endNonLean - startNonLean;

    // 2. With Lean
    const startLean = performance.now();
    let docCountLean = 0;
    let leanResults = [];
    for (let i = 0; i < iterations; i++) {
      leanResults = await Product.find({}).lean();
      docCountLean += leanResults.filter(p => p instanceof mongoose.Document).length;
    }
    const endLean = performance.now();
    const timeLean = endLean - startLean;

    console.log(`\nBenchmark Results (over ${iterations} queries):`);
    console.log(`- WITHOUT .lean():`);
    console.log(`  * Total time: ${timeNonLean.toFixed(2)} ms`);
    console.log(`  * Average query time: ${(timeNonLean / iterations).toFixed(2)} ms`);
    console.log(`  * Mongoose Documents created: ${docCountNonLean}`);
    console.log(`- WITH .lean():`);
    console.log(`  * Total time: ${timeLean.toFixed(2)} ms`);
    console.log(`  * Average query time: ${(timeLean / iterations).toFixed(2)} ms`);
    console.log(`  * Mongoose Documents created: ${docCountLean}`);
    
    const speedup = ((timeNonLean - timeLean) / timeNonLean * 100).toFixed(1);
    console.log(`- Response time reduction: ${speedup}%`);
    console.log(`- Mongoose Document generation reduction: ${((docCountNonLean - docCountLean) / (docCountNonLean || 1) * 100).toFixed(0)}%`);

  } catch (error) {
    console.error("Test execution failed with error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from Database.");
  }
}

run();
