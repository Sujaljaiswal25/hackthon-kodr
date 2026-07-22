import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LiveAnalytics from './LiveAnalytics';

export default function SessionReport({ sessionId }) {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await authFetch(`/sessions/${sessionId}/report`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setReport(data);
      } catch (err) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [sessionId, authFetch]);

  if (loading) return <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>Loading report...</div>;
  if (error) return <div className="container" style={{ padding: '2rem 0', color: 'var(--color-danger)' }}>{error}</div>;
  if (!report) return null;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Session Report</h2>
          <p style={{ marginTop: '0.25rem' }}>Review student responses for this session.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Back to Dashboard
        </button>
      </div>

      {report.polls.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>No polls launched</h3>
          <p>This session ended without any questions asked.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {report.polls.map((poll) => {
            // Figure out who needs help (answered 'no' or low rating 1-2)
            const strugglingStudents = poll.responses.filter((r) => {
              if (poll.responseType === 'yesno') return r.answer === 'no';
              if (poll.responseType === 'rating') return r.answer === '1' || r.answer === '2';
              return false;
            });

            return (
              <div key={poll._id} className="card">
                <div style={{ marginBottom: '1.5rem' }}>
                  <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
                    {poll.category}
                  </span>
                  <h3 style={{ fontSize: '1.25rem' }}>{poll.question}</h3>
                </div>

                <div className="grid-2">
                  <div>
                    <h4 style={{ marginBottom: '1rem', fontSize: '0.9375rem', color: 'var(--color-text-secondary)' }}>
                      Students who need attention
                    </h4>
                    {strugglingStudents.length === 0 ? (
                      <div style={{ padding: '1rem', background: 'var(--color-success-light)', color: '#065f46', borderRadius: 'var(--radius-md)' }}>
                        ✅ No students flagged for this question.
                      </div>
                    ) : (
                      <div style={{ background: 'var(--color-danger-light)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                          {strugglingStudents.map((r, i) => (
                            <li key={i} style={{ padding: '0.5rem 0', borderBottom: i < strugglingStudents.length - 1 ? '1px solid rgba(159, 18, 57, 0.2)' : 'none', color: '#9f1239', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                              <span>{r.student?.name || 'Unknown Student'}</span>
                              <span style={{ fontSize: '0.8125rem', opacity: 0.8 }}>Answer: {r.answer.toUpperCase()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 style={{ marginBottom: '1rem', fontSize: '0.9375rem', color: 'var(--color-text-secondary)' }}>
                      Response Summary
                    </h4>
                    <div style={{ padding: '1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
                        {poll.responses.length}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>
                        Total Responses
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
