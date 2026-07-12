use("webfashion");

const categoryResult = db.categories.insertOne({
  name: "Thời trang unisex",
  image: "https://via.placeholder.com/300",
  slug: "thoi-trang-unisex",
  createdAt: new Date(),
  updatedAt: new Date(),
});
const categoryId = categoryResult.insertedId;
print("Category created: " + categoryId);

const productSlugs = [
  "ao-khoac-bomber", "ao-khoac-hoodie", "ao-khoac-da",
  "ao-polo-basic", "ao-polo-soc", "ao-polo-slimfit",
  "sneaker-trang-basic", "sneaker-chunky", "sneaker-the-thao",
  "quan-jean-baggy", "quan-cargo", "quan-jogger-the-thao",
];

const products = productSlugs.map(function (slug) {
  return {
    name: slug.split("-").join(" "),
    name_no_accents: slug.split("-").join(" "),
    category_id: categoryId,
    slug: slug,
    description: "San pham test cho load testing: " + slug,
    old_price: 250000,
    new_price: 200000,
    stock: 100,
    weight: 0.5,
    sold: 0,
    rating: 0,
    is_active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
});

const productResult = db.products.insertMany(products);
const insertedIds = Object.values(productResult.insertedIds);
print("Products created: " + insertedIds.length);

const firstProductId = insertedIds[0];
const variantResult = db.product_variants.insertOne({
  product_id: firstProductId,
  color: "Den",
  size: "M",
  stock: 50,
  image_url: "https://via.placeholder.com/300",
  createdAt: new Date(),
  updatedAt: new Date(),
});

print("PRODUCT_ID = " + firstProductId);
print("VARIANT_ID = " + variantResult.insertedId);