import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Trash2, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

export default function TodoListView() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newText, setNewText] = useState('');
  const [priority, setPriority] = useState('normal');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getTodos();
      setTodos(data.todos || []);
    } catch (err) {
      setError(err.message || 'Failed to load todos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      setError('');
      const res = await api.createTodo(newText.trim(), priority);
      setTodos((prev) => [res.todo, ...prev]);
      setNewText('');
      setPriority('normal');
    } catch (err) {
      setError(err.message || 'Failed to add task.');
    }
  };

  const handleToggle = async (todo) => {
    try {
      const updatedStatus = !todo.completed;
      // Optimistic update
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, completed: updatedStatus } : t))
      );
      await api.updateTodo(todo.id, { completed: updatedStatus });
    } catch (err) {
      setError(err.message || 'Failed to update task.');
      fetchTodos(); // rollback on failure
    }
  };

  const handleDelete = async (id) => {
    try {
      // Optimistic delete
      setTodos((prev) => prev.filter((t) => t.id !== id));
      await api.deleteTodo(id);
    } catch (err) {
      setError(err.message || 'Failed to delete task.');
      fetchTodos();
    }
  };

  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className="glass-card">
      {/* Create Todo Form */}
      <form onSubmit={handleCreate} className="todo-create-form">
        <div className="todo-create-row">
          <input
            type="text"
            className="input-field"
            placeholder="What needs to be done today?"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            style={{ flex: 1 }}
          />
          <select
            className="priority-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            title="Priority"
          >
            <option value="low">🟢 Low</option>
            <option value="normal">🟡 Normal</option>
            <option value="high">🔴 High</option>
          </select>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!newText.trim()}
          >
            <Plus size={18} />
            <span>Add</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Stats Controls */}
      <div className="controls-bar">
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({todos.length})
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Done ({completedCount})
          </button>
        </div>

        <span className="stats-text">
          {activeCount === 0 && todos.length > 0 ? '✨ All caught up!' : `${activeCount} pending task(s)`}
        </span>
      </div>

      {/* Todo Items */}
      {loading ? (
        <div className="empty-state">Loading your tasks...</div>
      ) : filteredTodos.length === 0 ? (
        <div className="empty-state">
          {filter === 'all'
            ? 'No tasks yet. Create one above to get started!'
            : `No ${filter} tasks found.`}
        </div>
      ) : (
        <div className="todo-list">
          {filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className={`todo-item ${todo.completed ? 'completed' : ''}`}
            >
              <div className="todo-left">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => handleToggle(todo)}
                  title={todo.completed ? 'Mark as incomplete' : 'Mark as completed'}
                  style={{ padding: '0.2rem', display: 'flex' }}
                >
                  {todo.completed ? (
                    <CheckCircle2 size={20} color="#10b981" />
                  ) : (
                    <Circle size={20} color="#94a3b8" />
                  )}
                </button>
                <span className="todo-text">{todo.text}</span>
              </div>

              <div className="todo-right">
                <span className={`priority-badge ${todo.priority || 'normal'}`}>
                  {todo.priority || 'normal'}
                </span>

                <button
                  type="button"
                  className="btn-danger-ghost"
                  onClick={() => handleDelete(todo.id)}
                  title="Delete task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
