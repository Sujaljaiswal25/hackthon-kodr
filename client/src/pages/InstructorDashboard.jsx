import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function InstructorDashboard() {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState([]);
  const [classrooms, setClassrooms] = useState({});
  const [newInstituteName, setNewInstituteName] = useState('');
  const [newClassroomName, setNewClassroomName] = useState('');
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [showCreateInstitute, setShowCreateInstitute] = useState(false);
  const [showCreateClassroom, setShowCreateClassroom] = useState(false);
  const [error, setError] = useState('');

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

  const handleCreateInstitute = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await authFetch('/institutes', {
        method: 'POST',
        body: JSON.stringify({ name: newInstituteName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNewInstituteName('');
      setShowCreateInstitute(false);
      fetchInstitutes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!selectedInstitute) return;
    setError('');
    try {
      const res = await authFetch('/classrooms', {
        method: 'POST',
        body: JSON.stringify({
          name: newClassroomName,
          instituteId: selectedInstitute,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNewClassroomName('');
      setShowCreateClassroom(false);
      fetchClassrooms(selectedInstitute);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStartSession = async (classroomId) => {
    try {
      const res = await authFetch('/sessions/start', {
        method: 'POST',
        body: JSON.stringify({ classroomId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      navigate(`/session/${data.session._id}?classroom=${classroomId}`);
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

  return (
    <div className="page">
      <div className="container">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1>Dashboard</h1>
            <p style={{ marginTop: '0.25rem' }}>
              Welcome back, {user.name}
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateInstitute(true)}
          >
            + New Institute
          </button>
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

        {/* Create Institute Modal */}
        {showCreateInstitute && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Create Institute</h3>
            <form onSubmit={handleCreateInstitute} style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                className="form-input"
                placeholder="Institute name"
                value={newInstituteName}
                onChange={(e) => setNewInstituteName(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" type="submit">
                Create
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setShowCreateInstitute(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Institutes list */}
        {institutes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏫</div>
            <h3>No institutes yet</h3>
            <p style={{ marginTop: '0.5rem' }}>
              Create your first institute to get started
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                  }}
                >
                  <h3>{inst.name}</h3>
                  <span className="badge badge-primary">
                    ID: {inst.instituteId}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem' }}>
                  {inst.members?.length || 0} members
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Selected institute classrooms */}
        {selectedInstitute && (
          <div style={{ marginTop: '2rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <h2>Classrooms</h2>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowCreateClassroom(true)}
              >
                + New Classroom
              </button>
            </div>

            {showCreateClassroom && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <form
                  onSubmit={handleCreateClassroom}
                  style={{ display: 'flex', gap: '0.75rem' }}
                >
                  <input
                    className="form-input"
                    placeholder="Classroom name (e.g., DSA, System Design)"
                    value={newClassroomName}
                    onChange={(e) => setNewClassroomName(e.target.value)}
                    required
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary" type="submit">
                    Create
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => setShowCreateClassroom(false)}
                  >
                    Cancel
                  </button>
                </form>
              </div>
            )}

            {(classrooms[selectedInstitute] || []).length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <h3>No classrooms yet</h3>
                <p style={{ marginTop: '0.5rem' }}>
                  Create a classroom to start teaching
                </p>
              </div>
            ) : (
              <div className="grid-3">
                {(classrooms[selectedInstitute] || []).map((cls) => (
                  <div key={cls._id} className="card">
                    <h4 style={{ marginBottom: '0.5rem' }}>{cls.name}</h4>
                    <p style={{ fontSize: '0.8125rem', marginBottom: '1rem' }}>
                      {cls.students?.length || 0} students
                    </p>
                    <button
                      className="btn btn-success"
                      style={{ width: '100%' }}
                      onClick={() => handleStartSession(cls._id)}
                    >
                      ▶ Start Live Session
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
