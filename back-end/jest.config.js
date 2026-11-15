export default {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  clearMocks: true,
  setupFiles: ["./src/test/setupEnv.js"],
  setupFilesAfterEnv: ["./src/test/afterEnv.js"],
  globalTeardown: "./src/test/globalTeardown.js",
};
