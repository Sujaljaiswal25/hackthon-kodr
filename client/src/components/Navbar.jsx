import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        ⚡ Pulse<span>Class</span>
      </Link>
      <div className="navbar-actions">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: connected
                ? 'var(--color-success)'
                : 'var(--color-text-muted)',
            }}
          />
          {connected ? 'Connected' : 'Offline'}
        </div>
        <span className="badge badge-primary">{user.role}</span>
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
          }}
        >
          {user.name}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
