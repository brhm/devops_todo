const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../app");

test("GET /health returns 503 when MongoDB is disconnected", async () => {
  const server = app.listen(0);

  try {
    const address = server.address();
    const response = await fetch(
      `http://127.0.0.1:${address.port}/health`
    );

    const body = await response.json();

    assert.equal(response.status, 503);
    assert.equal(body.status, "unhealthy");
    assert.equal(body.database, "disconnected");
  } finally {
    server.close();
  }
});