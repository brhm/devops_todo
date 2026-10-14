const express = require("express");
const serverResponses = require("../utils/helpers/responses");
const messages = require("../config/messages");
const { Todo } = require("../models/todos/todo");

const routes = (app) => {
  const router = express.Router();

  // Create a new todo
  router.post("/todos", async (req, res) => {
    try {
      const todo = new Todo({
        text: req.body.text,
      });

      const result = await todo.save();

      return serverResponses.sendSuccess(
        res,
        messages.SUCCESSFUL,
        result
      );
    } catch (error) {
      return serverResponses.sendError(
        res,
        messages.BAD_REQUEST,
        error
      );
    }
  });

  // Get all todos
  router.get("/", async (req, res) => {
    try {
      const todos = await Todo.find({}, { __v: 0 });

      return serverResponses.sendSuccess(
        res,
        messages.SUCCESSFUL,
        todos
      );
    } catch (error) {
      return serverResponses.sendError(
        res,
        messages.BAD_REQUEST,
        error
      );
    }
  });

  app.use("/api", router);
};

module.exports = routes;