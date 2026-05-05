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
    this.update();
  }

  update() {
    if (!this._domNode || !this._domNode.parentNode) return;

    const active = document.activeElement;
    const shouldRestoreFocus =
      active instanceof HTMLElement && this._domNode.contains(active);

    const activeId = shouldRestoreFocus ? active.getAttribute("id") : null;
    const activeSelection =
      shouldRestoreFocus &&
      active instanceof HTMLInputElement &&
      typeof active.selectionStart === "number" &&
      typeof active.selectionEnd === "number"
        ? {
            start: active.selectionStart,
            end: active.selectionEnd,
            direction: active.selectionDirection ?? "none",
          }
        : null;

    const next = this.render();
    this._domNode.replaceWith(next);
    this._domNode = next;

    if (activeId) {
      const el = this._domNode.querySelector(`#${activeId}`);
      if (el instanceof HTMLElement) {
        el.focus();
        if (activeSelection && el instanceof HTMLInputElement) {
          el.setSelectionRange(
            activeSelection.start,
            activeSelection.end,
            activeSelection.direction
          );
        }
      }
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
        { id: 1, text: "Сделать домашку", completed: false },
        { id: 2, text: "Сделать практику", completed: false },
        { id: 3, text: "Пойти домой", completed: false },
      ],
      nextId: 4,
      newTodoText: "",
    };

    this._tasksById = new Map();

    this.onAddTask = this.onAddTask.bind(this);
    this.onAddInputChange = this.onAddInputChange.bind(this);
    this.onToggleTask = this.onToggleTask.bind(this);
    this.onDeleteTask = this.onDeleteTask.bind(this);
  }

  onAddTask() {
    const text = (this.state.newTodoText ?? "").trim();
    if (!text) return;

    const nextTodo = {
      id: this.state.nextId,
      text,
      completed: false,
    };

    this.setState({
      todos: [...this.state.todos, nextTodo],
      nextId: this.state.nextId + 1,
      newTodoText: "",
    });
  }

  onAddInputChange(event) {
    this.setState({ newTodoText: event.target.value });
  }

  onToggleTask(todoId) {
    this.setState({
      todos: this.state.todos.map((t) =>
        t.id === todoId ? { ...t, completed: !t.completed } : t
      ),
    });
  }

  onDeleteTask(todoId) {
    this._tasksById.delete(todoId);
    this.setState({
      todos: this.state.todos.filter((t) => t.id !== todoId),
    });
  }

  render() {
    const tasks = this.state.todos.map((todo) => {
      let task = this._tasksById.get(todo.id);
      if (!task) {
        task = new Task({
          todo,
          onToggle: this.onToggleTask,
          onDelete: this.onDeleteTask,
        });
        this._tasksById.set(todo.id, task);
      } else {
        task.props.todo = todo;
      }

      task._domNode = task.render();
      return task._domNode;
    });

    return createElement("div", { class: "todo-list" }, [
      createElement("h1", {}, "TODO List"),
      new AddTask({
        value: this.state.newTodoText,
        onAddTask: this.onAddTask,
        onAddInputChange: this.onAddInputChange,
      }).getDomNode(),
      createElement("ul", { id: "todos" }, tasks),
    ]);
  }
}

class AddTask extends Component {
  constructor({ value, onAddTask, onAddInputChange }) {
    super();
    this.value = value ?? "";
    this.onAddTask = onAddTask;
    this.onAddInputChange = onAddInputChange;
  }

  render() {
    return createElement("div", { class: "add-todo" }, [
      createElement(
        "input",
        {
          id: "new-todo",
          type: "text",
          placeholder: "Задание",
          value: this.value,
        },
        null,
        [(el) => el.addEventListener("input", this.onAddInputChange)]
      ),
      createElement("button", { id: "add-btn" }, "+", [
        (el) => el.addEventListener("click", this.onAddTask),
      ]),
    ]);
  }
}

class Task extends Component {
  constructor(props) {
    super();
    this.props = props;
    this.state = { confirmDelete: false };

    this.onToggleChange = this.onToggleChange.bind(this);
    this.onDeleteClick = this.onDeleteClick.bind(this);
  }

  onToggleChange() {
    this.props.onToggle(this.props.todo.id);
    if (this.state.confirmDelete) this.setState({ confirmDelete: false });
  }

  onDeleteClick() {
    if (!this.state.confirmDelete) {
      this.setState({ confirmDelete: true });
      return;
    }
    this.props.onDelete(this.props.todo.id);
  }

  render() {
    const { todo } = this.props;
    const isConfirm = !!this.state.confirmDelete;

    return createElement(
      "li",
      { "data-id": todo.id, class: todo.completed ? "completed" : "" },
      [
        createElement("input", { type: "checkbox" }, null, [
          (el) => {
            if (el instanceof HTMLInputElement) el.checked = !!todo.completed;
          },
          (el) => el.addEventListener("change", this.onToggleChange),
        ]),
        createElement("label", {}, todo.text),
        createElement(
          "button",
          { style: isConfirm ? "background:red;color:white;" : "" },
          isConfirm ? "Удалить!" : "Удалить",
          [(el) => el.addEventListener("click", this.onDeleteClick)]
        ),
      ]
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.appendChild(new TodoList().getDomNode());
});
