// components/TodoList.tsx
import React, { useEffect, useState } from 'react';
import { notionApi } from '../lib/notion'; // Шлях до вашого notion.ts файлу

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Завантаження todos при монтуванні компонента
  useEffect(() => {
    loadTodos();
  }, []);

  // Функція для завантаження todos
  const loadTodos = async () => {
    try {
      setIsLoading(true);
      const fetchedTodos = await notionApi.fetchTodos();
      setTodos(fetchedTodos);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Функція для створення нового todo
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    try {
      const newTodo = await notionApi.createTodo(newTodoText);
      setTodos(prev => [...prev, newTodo]);
      setNewTodoText('');
    } catch (error) {
      console.error('Failed to create todo:', error);
    }
  };

  // Функція для оновлення статусу todo
  const handleToggleTodo = async (todo: Todo) => {
    try {
      await notionApi.updateTodo(todo.id, {
        completed: !todo.completed
      });
      setTodos(prev =>
        prev.map(t =>
          t.id === todo.id ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  // Функція для видалення todo
  const handleDeleteTodo = async (id: string) => {
    try {
      await notionApi.deleteTodo(id);
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-4">Todo List</h1>

      {/* Форма для створення нового todo */}
      <form onSubmit={handleCreateTodo} className="mb-4">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add new todo"
          className="w-full p-2 border rounded"
        />
        <button 
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Add Todo
        </button>
      </form>

      {/* Список todos */}
      <ul className="space-y-2">
        {todos.map(todo => (
          <li key={todo.id} className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleTodo(todo)}
                className="mr-2"
              />
              <span className={todo.completed ? 'line-through' : ''}>
                {todo.text}
              </span>
            </div>
            <button
              onClick={() => handleDeleteTodo(todo.id)}
              className="px-2 py-1 text-red-500"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}