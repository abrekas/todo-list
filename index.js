function createElement(tag, attributes, children, callbacks) {
  const element = document.createElement(tag);

  if (attributes) {
    Object.keys(attributes).forEach((key) => {
      element.setAttribute(key, attributes[key]);
    });
  }

  if (Array.isArray(children)) {
    children.forEach((child) => {
      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        element.appendChild(child);
      }
    });
  } else if (typeof children === "string") {
    element.appendChild(document.createTextNode(children));
  } else if (children instanceof HTMLElement) {
    element.appendChild(children);
  }

  if (Array.isArray(callbacks)) {
    callbacks.forEach((cb) => {
      if (typeof cb === "function") cb(element);
    });
  }

  return element;
}

class Component {
  constructor() {
  }

  setState(patch) {
    this.state = { ...(this.state ?? {}), ...(patch ?? {}) };

    if (this._domNode && this._domNode.parentNode) {
      const next = this.render();
      this._domNode.replaceWith(next);
      this._domNode = next;
    }
  }

  getDomNode() {
    this._domNode = this.render();
    return this._domNode;
  }
}

class TodoList extends Component {
  constructor() {
    super();

    this.state = {
      todos: [
        { id: "hw", text: "Сделать домашку", completed: false },
        { id: "practice", text: "Сделать практику", completed: false },
        { id: "home", text: "Пойти домой", completed: false },
      ],
      newTodoText: "",
    };

    this.onAddTask = this.onAddTask.bind(this);
    this.onAddInputChange = this.onAddInputChange.bind(this);
  }

  onAddTask() {
    const text = (this.state.newTodoText ?? "").trim();
    if (!text) return;

    const nextTodo = {
      id: `todo-${Date.now()}`,
      text,
      completed: false,
    };

    this.setState({
      todos: [...this.state.todos, nextTodo],
      newTodoText: "",
    });
  }

  onAddInputChange(event) {
    this.setState({ newTodoText: event.target.value });
  }

  render() {
    const tasks = this.state.todos.map((todo) =>
      createElement("li", { "data-id": todo.id }, [
        createElement("input", { type: "checkbox" }),
        createElement("label", {}, todo.text),
        createElement("button", {}, "🗑️"),
      ])
    );

    return createElement("div", { class: "todo-list" }, [
      createElement("h1", {}, "TODO List"),
      createElement("div", { class: "add-todo" }, [
        createElement(
          "input",
          {
            id: "new-todo",
            type: "text",
            placeholder: "Задание",
            value: this.state.newTodoText,
          },
          null,
          [(el) => el.addEventListener("input", this.onAddInputChange)]
        ),
        createElement("button", { id: "add-btn" }, "+", [
          (el) => el.addEventListener("click", this.onAddTask),
        ]),
      ]),
      createElement("ul", { id: "todos" }, tasks),
    ]);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.appendChild(new TodoList().getDomNode());
});
