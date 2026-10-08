import React from 'react';
import { CheckSquare, LogOut, User } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-icon">
          <CheckSquare size={20} />
        </div>
        <h1>To-Do Manager</h1>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="user-badge">
            <User size={14} />
            <span>{user.name || 'User'}</span>
            <span className="user-phone">({user.phone})</span>
          </div>
          <button
            onClick={onLogout}
            className="btn btn-secondary"
            title="Log out"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </header>
  );
}
