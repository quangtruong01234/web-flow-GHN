import nextJest from "next/jest.js";

// next/jest wires up the SWC transform, CSS/asset stubs, tsconfig paths, and the
// .env loading used by the app, so unit tests run with the same toolchain.
const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Unit tests live under src/. Playwright specs in e2e/ are run by Playwright,
  // not Jest.
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/", "<rootDir>/e2e/"],
};

export default createJestConfig(config);
