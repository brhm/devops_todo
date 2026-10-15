const test = require("node:test");
const assert = require("node:assert/strict");
const { Todo } = require("../models/todos/todo");

test("Todo should accept valid text", () => {
  const todo = new Todo({ text: "Learn Kubernetes" });

  const error = todo.validateSync();

  assert.equal(error, undefined);
  assert.equal(todo.text, "Learn Kubernetes");
});

test("Todo should reject missing text", () => {
  const todo = new Todo({});

  const error = todo.validateSync();

  assert.ok(error);
  assert.ok(error.errors.text);
});

test("Todo should reject text longer than 500 characters", () => {
  const todo = new Todo({ text: "A".repeat(501) });

  const error = todo.validateSync();

  assert.ok(error);
  assert.ok(error.errors.text);
});

test("Todo should trim whitespace", () => {
  const todo = new Todo({ text: "  Learn Docker  " });

  assert.equal(todo.text, "Learn Docker");
});