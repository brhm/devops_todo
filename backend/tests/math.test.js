const test = require("node:test");
const assert = require("node:assert/strict");

const { add } = require("../utils/math");

test("add should return the sum of two numbers", () => {
  assert.equal(add(2, 3), 5);
});

test("add should handle negative numbers", () => {
  assert.equal(add(-2, -3), -5);
});