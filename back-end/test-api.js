import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

// Test user data
let testData = {
  user: {
    email: 'test@gmail.com',
    passWord: 'Test@123',
    firstName: 'Test',
    lastName: 'User',
    userName: 'testuser'
  },
  accessToken: null,
  refreshToken: null,
  userId: null,
  categoryId: null,
  productId: null,
  productItemId: null,
  cartId: null,
  orderId: null
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

// Interceptor to add token
api.interceptors.request.use((config) => {
  if (testData.accessToken) {
    config.headers.Authorization = `Bearer ${testData.accessToken}`;
  }
  return config;
});

// Test functions
const tests = {
  // ============== AUTH TESTS ==============
  async testSignUp() {
    try {
      console.log('\n✅ Testing Sign Up...');
      const response = await api.post('/auth/signUp', {
        email: testData.user.email,
        passWord: testData.user.passWord,
        firstName: testData.user.firstName,
        lastName: testData.user.lastName,
        userName: testData.user.userName
      });
      console.log('✓ Sign Up Success:', response.status);
      return true;
    } catch (error) {
      console.error('✗ Sign Up Failed:', error.response?.data || error.message);
      return false;
    }
  },

  async testSendOTP() {
    try {
      console.log('\n✅ Testing Send OTP...');
      const response = await api.post('/auth/sendOTP', {
        email: testData.user.email
      });
      console.log('✓ Send OTP Success:', response.data.message);
      return true;
    } catch (error) {
      console.error('✗ Send OTP Failed:', error.response?.data || error.message);
      return false;
    }
  },

  async testVerifyOTP() {
    try {
      console.log('\n✅ Testing Verify OTP...');
      const response = await api.post('/auth/verify-otp', {
        email: testData.user.email,
        otp: '123456'
      });
      console.log('✓ Verify OTP Success:', response.data.message);
      return true;
    } catch (error) {
      console.error('✗ Verify OTP Failed:', error.response?.data || error.message);
      return false;
    }
  },

  async testSignIn() {
    try {
      console.log('\n✅ Testing Sign In...');
      const response = await api.post('/auth/signIn', {
        userName: testData.user.userName,
        passWord: testData.user.passWord
      });
      testData.accessToken = response.data.accessToken;
      testData.userId = response.data.userId;
      console.log('✓ Sign In Success:', response.data.message);
      console.log('✓ Access Token:', testData.accessToken.substring(0, 20) + '...');
      return true;
    } catch (error) {
      console.error('✗ Sign In Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // ============== CATEGORY TESTS ==============
  async testGetCategories() {
    try {
      console.log('\n✅ Testing Get Categories...');
      const response = await api.get('/categories');
      console.log('✓ Get Categories Success, Count:', response.data.length);
      if (response.data.length > 0) {
        testData.categoryId = response.data[0]._id;
      }
      return true;
    } catch (error) {
      console.error('✗ Get Categories Failed:', error.response?.data || error.message);
      return false;
    }
  },

  async testCreateCategory() {
    try {
      console.log('\n✅ Testing Create Category...');
      const response = await api.post('/categories', {
        name: 'Test Category',
        description: 'Test Category Description'
      });
      testData.categoryId = response.data._id;
      console.log('✓ Create Category Success:', response.data.name);
      return true;
    } catch (error) {
      console.error('✗ Create Category Failed:', error.response?.data || error.message);
      return false;
    }
  },

  async testUpdateCategory() {
    try {
      console.log('\n✅ Testing Update Category...');
      if (!testData.categoryId) {
        console.log('⊘ Skipping - No category ID');
        return false;
      }
      const response = await api.put(`/categories/${testData.categoryId}`, {
        name: 'Updated Test Category'
      });
      console.log('✓ Update Category Success:', response.data.name);
      return true;
    } catch (error) {
      console.error('✗ Update Category Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // ============== PRODUCT TESTS ==============
  async testGetProducts() {
    try {
      console.log('\n✅ Testing Get Products...');
      const response = await api.get('/products');
      console.log('✓ Get Products Success, Count:', response.data.length);
      if (response.data.length > 0) {
        testData.productId = response.data[0]._id;
      }
      return true;
    } catch (error) {
      console.error('✗ Get Products Failed:', error.response?.data || error.message);
      return false;
    }
  },

  async testCreateProduct() {
    try {
      console.log('\n✅ Testing Create Product...');
      if (!testData.categoryId) {
        console.log('⊘ Skipping - No category ID');
        return false;
      }
      const response = await api.post('/products', {
        name: 'Test Product',
        slug: 'test-product-' + Date.now(),
        categoryId: testData.categoryId,
        description: 'Test Product Description',
        price: 299000,
        image: 'https://via.placeholder.com/300'
      });
      testData.productId = response.data._id;
      console.log('✓ Create Product Success:', response.data.name);
      return true;
    } catch (error) {
      console.error('✗ Create Product Failed:', error.response?.data || error.message);
      return false;
    }
  },

  async testUpdateProduct() {
    try {
      console.log('\n✅ Testing Update Product...');
      if (!testData.productId) {
        console.log('⊘ Skipping - No product ID');
        return false;
      }
      const response = await api.put(`/products/${testData.productId}`, {
        name: 'Updated Test Product',
        price: 349000
      });
      console.log('✓ Update Product Success:', response.data.name);
      return true;
    } catch (error) {
      console.error('✗ Update Product Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // ============== PRODUCT ITEMS TESTS ==============
  async testGetProductItems() {
    try {
      console.log('\n✅ Testing Get Product Items...');
      const response = await api.get('/product_items');
      console.log('✓ Get Product Items Success, Count:', response.data.length);
      if (response.data.length > 0) {
        testData.productItemId = response.data[0]._id;
      }
      return true;
    } catch (error) {
      console.error('✗ Get Product Items Failed:', error.response?.data || error.message);
      return false;
    }
  },

  async testCreateProductItem() {
    try {
      console.log('\n✅ Testing Create Product Item...');
      if (!testData.productId) {
        console.log('⊘ Skipping - No product ID');
        return false;
      }
      const response = await api.post('/product_items', {
        productId: testData.productId,
        size: 'M',
        color: 'Red',
        quantity: 50,
        price: 299000
      });
      testData.productItemId = response.data._id;
      console.log('✓ Create Product Item Success, Size:', response.data.size);
      return true;
    } catch (error) {
      console.error('✗ Create Product Item Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // ============== CART TESTS ==============
  async testGetCart() {
    try {
      console.log('\n✅ Testing Get Cart...');
      const response = await api.get('/cart');
      console.log('✓ Get Cart Success, Items:', response.data.items?.length || 0);
      return true;
    } catch (error) {
      console.error('✗ Get Cart Failed:', error.response?.data || error.message);
      return false;
    }
  },

  async testAddToCart() {
    try {
      console.log('\n✅ Testing Add to Cart...');
      if (!testData.productItemId) {
        console.log('⊘ Skipping - No product item ID');
        return false;
      }
      const response = await api.post('/cart', {
        productItemId: testData.productItemId,
        quantity: 2
      });
      console.log('✓ Add to Cart Success:', response.data.message || 'Item added');
      return true;
    } catch (error) {
      console.error('✗ Add to Cart Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // ============== ORDER TESTS ==============
  async testGetOrders() {
    try {
      console.log('\n✅ Testing Get Orders...');
      if (!testData.userId) {
        console.log('⊘ Skipping - No user ID');
        return false;
      }
      const response = await api.get(`/order/${testData.userId}`);
      console.log('✓ Get Orders Success, Count:', response.data.length);
      if (response.data.length > 0) {
        testData.orderId = response.data[0]._id;
      }
      return true;
    } catch (error) {
      console.error('✗ Get Orders Failed:', error.response?.data || error.message);
      return false;
    }
  },

  async testCreateOrder() {
    try {
      console.log('\n✅ Testing Create Order...');
      if (!testData.userId) {
        console.log('⊘ Skipping - No user ID');
        return false;
      }
      const response = await api.post('/order', {
        userId: testData.userId,
        totalPrice: 598000,
        status: 'pending',
        shippingAddress: '123 Test Street, Test City'
      });
      testData.orderId = response.data._id;
      console.log('✓ Create Order Success, ID:', testData.orderId);
      return true;
    } catch (error) {
      console.error('✗ Create Order Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // ============== USER TESTS ==============
  async testGetCurrentUser() {
    try {
      console.log('\n✅ Testing Get Current User...');
      const response = await api.get('/user/me');
      console.log('✓ Get Current User Success:', response.data.fullName);
      return true;
    } catch (error) {
      console.error('✗ Get Current User Failed:', error.response?.data || error.message);
      return false;
    }
  },

  async testUpdateProfile() {
    try {
      console.log('\n✅ Testing Update Profile...');
      const response = await api.put('/user/updateProfile', {
        fullName: 'Test User Updated',
        address: [{
          fullName: 'Test User',
          phone: '0912345678',
          city: 'Ha Noi',
          district: 'Ba Dinh',
          detail: '123 Test Street'
        }]
      });
      console.log('✓ Update Profile Success:', response.data.message || 'Profile updated');
      return true;
    } catch (error) {
      console.error('✗ Update Profile Failed:', error.response?.data || error.message);
      return false;
    }
  }
};

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting API Tests...');
  console.log('================================================');

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Auth tests
  if (await tests.testSignUp()) results.passed++; else results.failed++;
  if (await tests.testSendOTP()) results.passed++; else results.failed++;
  if (await tests.testVerifyOTP()) results.passed++; else results.failed++;
  if (await tests.testSignIn()) results.passed++; else results.failed++;

  // Category tests
  if (await tests.testGetCategories()) results.passed++; else results.failed++;
  if (await tests.testCreateCategory()) results.passed++; else results.failed++;
  if (await tests.testUpdateCategory()) results.passed++; else results.failed++;

  // Product tests
  if (await tests.testGetProducts()) results.passed++; else results.failed++;
  if (await tests.testCreateProduct()) results.passed++; else results.failed++;
  if (await tests.testUpdateProduct()) results.passed++; else results.failed++;

  // Product items tests
  if (await tests.testGetProductItems()) results.passed++; else results.failed++;
  if (await tests.testCreateProductItem()) results.passed++; else results.failed++;

  // Cart tests
  if (await tests.testGetCart()) results.passed++; else results.failed++;
  if (await tests.testAddToCart()) results.passed++; else results.failed++;

  // Order tests
  if (await tests.testGetOrders()) results.passed++; else results.failed++;
  if (await tests.testCreateOrder()) results.passed++; else results.failed++;

  // User tests
  if (await tests.testGetCurrentUser()) results.passed++; else results.failed++;
  if (await tests.testUpdateProfile()) results.passed++; else results.failed++;

  console.log('\n================================================');
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⊘ Skipped: ${results.skipped}`);
  console.log('================================================\n');
}

// Run tests
await runAllTests();
