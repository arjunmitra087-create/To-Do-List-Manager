import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthView from './components/AuthView';
import TodoListView from './components/TodoListView';
import { authStorage } from './api';
import { Info } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'about'

  useEffect(() => {
    const savedUser = authStorage.getUser();
    const token = authStorage.getToken();
    if (savedUser && token) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    authStorage.clearAuth();
    setUser(null);
    setActiveTab('tasks');
  };

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading To-Do Manager...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={handleLogout} />

      {!user ? (
        <AuthView onAuthSuccess={handleAuthSuccess} />
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <button
              type="button"
              className={`filter-btn ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              My Tasks
            </button>
            <button
              type="button"
              className={`filter-btn ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              <Info size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              API Info
            </button>
          </div>

          {activeTab === 'tasks' ? (
            <TodoListView />
          ) : (
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Workshop Architecture</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                This is a minimal full-stack To-Do application built for a 45-minute workshop.
              </p>
              <ul style={{ color: 'var(--text-muted)', fontSize: '0.85rem', paddingLeft: '1.25rem', lineHeight: '1.8' }}>
                <li><strong>Backend:</strong> Node.js + Express with 5 minimal endpoints.</li>
                <li><strong>Auth:</strong> Minimoth OTP API with JWT session tokens.</li>
                <li><strong>Database:</strong> 3 data entities (<code>User</code>, <code>Todo</code>, <code>OtpRecord</code>).</li>
                <li><strong>Frontend:</strong> React + Vite with responsive CSS.</li>
              </ul>
            </div>
          )}
        </>
      )}

      <footer className="footer-note">
        To-Do List Manager &bull; Minimoth OTP Auth &bull; 45-Min Workshop
      </footer>
    </div>
  );
}
