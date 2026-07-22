import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState([]);
  const [classrooms, setClassrooms] = useState({});
  const [joinCode, setJoinCode] = useState('');
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const res = await authFetch('/institutes');
      const data = await res.json();
      setInstitutes(data.institutes || []);
    } catch (err) {
      // handled
    }
  };

  const fetchClassrooms = async (instituteId) => {
    try {
      const res = await authFetch(`/classrooms/institute/${instituteId}`);
      const data = await res.json();
      setClassrooms((prev) => ({ ...prev, [instituteId]: data.classrooms || [] }));
    } catch (err) {
      // handled
    }
  };

  const handleJoinInstitute = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await authFetch('/institutes/join', {
        method: 'POST',
        body: JSON.stringify({ instituteId: joinCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setJoinCode('');
      setSuccess('Joined institute successfully!');
      fetchInstitutes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleJoinClassroom = async (classroomId) => {
    try {
      const res = await authFetch(`/classrooms/${classroomId}/join`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      if (selectedInstitute) fetchClassrooms(selectedInstitute);
      setSuccess('Joined classroom!');
    } catch (err) {
      setError(err.message);
    }
  };

  const selectInstitute = (inst) => {
    setSelectedInstitute(inst._id);
    if (!classrooms[inst._id]) {
      fetchClassrooms(inst._id);
    }
  };

  const handleJoinSession = async (classroom) => {
    if (classroom.activeSession) {
      const sessionId = typeof classroom.activeSession === 'object'
        ? classroom.activeSession._id
        : classroom.activeSession;
      navigate(`/session/${sessionId}?classroom=${classroom._id}`);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <h1>Student Dashboard</h1>
          <p style={{ marginTop: '0.25rem' }}>
            Welcome, {user.name}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--color-danger-light)',
              color: '#9f1239',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--color-success-light)',
              color: '#065f46',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {success}
          </div>
        )}

        {/* Join Institute */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Join an Institute</h3>
          <form
            onSubmit={handleJoinInstitute}
            style={{ display: 'flex', gap: '0.75rem' }}
          >
            <input
              className="form-input"
              placeholder="Enter Institute ID"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" type="submit">
              Join
            </button>
          </form>
        </div>

        {/* Institutes */}
        <h2 style={{ marginBottom: '1rem' }}>My Institutes</h2>
        {institutes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏫</div>
            <h3>No institutes joined</h3>
            <p style={{ marginTop: '0.5rem' }}>
              Enter an Institute ID above to join
            </p>
          </div>
        ) : (
          <div className="grid-2">
            {institutes.map((inst) => (
              <div
                key={inst._id}
                className={`card card-interactive ${selectedInstitute === inst._id ? 'pulse-card active' : ''}`}
                onClick={() => selectInstitute(inst)}
              >
                <h3>{inst.name}</h3>
                <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  {inst.members?.length || 0} members
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Classrooms for selected institute */}
        {selectedInstitute && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Classrooms</h2>
            {(classrooms[selectedInstitute] || []).length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <h3>No classrooms available</h3>
              </div>
            ) : (
              <div className="grid-3">
                {(classrooms[selectedInstitute] || []).map((cls) => {
                  const isStudentInClass = cls.students?.some(
                    (s) => (typeof s === 'string' ? s : s._id) === user._id
                  );
                  const hasActiveSession = !!cls.activeSession;

                  return (
                    <div key={cls._id} className="card">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <h4>{cls.name}</h4>
                        {hasActiveSession && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <div className="live-dot" />
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--color-danger)',
                                textTransform: 'uppercase',
                              }}
                            >
                              Live
                            </span>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8125rem', marginBottom: '1rem' }}>
                        by {cls.instructor?.name || 'Instructor'}
                      </p>

                      {!isStudentInClass ? (
                        <button
                          className="btn btn-outline"
                          style={{ width: '100%' }}
                          onClick={() => handleJoinClassroom(cls._id)}
                        >
                          Join Classroom
                        </button>
                      ) : hasActiveSession ? (
                        <button
                          className="btn btn-success"
                          style={{ width: '100%' }}
                          onClick={() => handleJoinSession(cls)}
                        >
                          ▶ Join Live Session
                        </button>
                      ) : (
                        <span
                          className="badge badge-primary"
                          style={{ display: 'block', textAlign: 'center' }}
                        >
                          Enrolled ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
