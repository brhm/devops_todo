const test = require("node:test");
const assert = require("node:assert/strict");
const { mock } = require("node:test");

const app = require("../app");
const { Todo } = require("../models/todos/todo");

test("GET /api/ returns todo list", async () => {
  const fakeTodos = [
    { _id: "todo-1", text: "Learn Docker" },
    { _id: "todo-2", text: "Learn Kubernetes" },
  ];

  const findMock = mock.method(Todo, "find", async () => fakeTodos);

  const server = app.listen(0);

  try {
    const address = server.address();

    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/`
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.deepEqual(body.data, fakeTodos);
    assert.equal(findMock.mock.callCount(), 1);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });

    findMock.mock.restore();
  }
});

test("POST /api/todos creates a new todo", async () => {
  const savedTodo = {
    _id: "todo-3",
    text: "Learn Terraform",
  };

  const saveMock = mock.method(
    Todo.prototype,
    "save",
    async () => savedTodo
  );

  const server = app.listen(0);

  try {
    const address = server.address();

    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/todos`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "Learn Terraform",
        }),
      }
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.deepEqual(body.data, savedTodo);
    assert.equal(saveMock.mock.callCount(), 1);

    // Check the data passed to Mongoose
    assert.equal(
      saveMock.mock.calls[0].this.text,
      "Learn Terraform"
    );
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) =>
        error ? reject(error) : resolve()
      );
    });

    saveMock.mock.restore();
  }
});
test("POST /api/todos rejects missing text", async () => {
  const saveMock = mock.method(
    Todo.prototype,
    "save",
    async function () {
      await this.validate();
      return this;
    }
  );

  const server = app.listen(0);

  try {
    const address = server.address();

    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/todos`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(saveMock.mock.callCount(), 1);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) =>
        error ? reject(error) : resolve()
      );
    });

    saveMock.mock.restore();
  }
});