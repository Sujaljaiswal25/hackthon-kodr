import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!role) {
      setError('Please select a role');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password, role);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2.5rem' }}>⚡</div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join PulseClass today</p>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--color-danger-light)',
              color: '#9f1239',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role selector */}
          <div className="form-group">
            <label className="form-label">I am a...</label>
            <div className="role-selector">
              <div
                className={`role-option ${role === 'instructor' ? 'selected' : ''}`}
                onClick={() => setRole('instructor')}
              >
                <span className="role-icon">🎓</span>
                Instructor
              </div>
              <div
                className={`role-option ${role === 'student' ? 'selected' : ''}`}
                onClick={() => setRole('student')}
              >
                <span className="role-icon">📚</span>
                Student
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-name">
              Full Name
            </label>
            <input
              id="signup-name"
              className="form-input"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">
              Email
            </label>
            <input
              id="signup-email"
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">
              Password
            </label>
            <input
              id="signup-password"
              className="form-input"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading || !role}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.875rem',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
