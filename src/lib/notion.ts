export const notionApi = {
  async fetchTodos() {
    const response = await fetch('/api/notion/fetchTodos');
    if (!response.ok) throw new Error('Failed to fetch todos');
    return await response.json();
  },

  async createTodo(text: string) {
    const response = await fetch('/api/notion/createTodo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error('Failed to create todo');
    return await response.json();
  },

  async updateTodo(id: string, data: { text?: string; completed?: boolean }) {
    const response = await fetch('/api/notion/updateTodo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!response.ok) throw new Error('Failed to update todo');
    return true;
  },

  async deleteTodo(id: string) {
    const response = await fetch('/api/notion/deleteTodo', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) throw new Error('Failed to delete todo');
    return true;
  },
};
