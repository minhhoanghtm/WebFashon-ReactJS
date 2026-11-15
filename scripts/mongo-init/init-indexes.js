// ==============================================================================
// REACT-WebFashion — MongoDB Production Database Initialization & Indexes
// Executed automatically on container first initialization by /docker-entrypoint-initdb.d
// ==============================================================================

db = db.getSiblingDB('webfashion');

print('Initializing WebFashion production database collections and indexes...');

// 1. Users collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ createdAt: -1 });

// 2. Products collection
db.products.createIndex({ slug: 1 }, { unique: true, sparse: true });
db.products.createIndex({ category: 1, status: 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ isFeatured: 1 });
db.products.createIndex({ name: "text", description: "text" });

// 3. Orders collection
db.orders.createIndex({ orderCode: 1 }, { unique: true, sparse: true });
db.orders.createIndex({ user: 1, createdAt: -1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });

// 4. Reviews collection
db.reviews.createIndex({ product: 1, status: 1 });
db.reviews.createIndex({ user: 1 });

// 5. Audit & Tracking collection
db.trackingevents.createIndex({ sessionId: 1 });
db.trackingevents.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // TTL 30 days

print('WebFashion production database indexes successfully initialized!');
