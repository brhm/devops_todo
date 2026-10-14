import React from "react";

export default class AddTodo extends React.Component {
  handleSubmit = (e) => {
    e.preventDefault();
    const todoText = e.currentTarget.elements.namedItem("value").value.trim();
    if (todoText.length > 0) {
      this.props.handleAddTodo(todoText);
      e.target.reset();
    }
  };

  render() {
    return (
      <form
        noValidate
        onSubmit={this.handleSubmit}
        className="new-todo form-group"
      >
        <input
          type="text"
          name="value"
          required
          minLength={1}
          className="form-control"
        />
        <button className="btn btn-primary" type="submit">
          Add Todo
        </button>
      </form>
    );
  }
}
