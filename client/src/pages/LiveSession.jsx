import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import QuestionTemplates from '../components/QuestionTemplates';
import TimerSelect from '../components/TimerSelect';
import LiveAnalytics from '../components/LiveAnalytics';
import StudentPulse from '../components/StudentPulse';
import SessionReport from '../components/SessionReport';

export default function LiveSession() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const classroomId = searchParams.get('classroom');
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();
  const { socket, connected } = useSocket();

  const [participantCount, setParticipantCount] = useState(0);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [timer, setTimer] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [pollHistory, setPollHistory] = useState([]);

  const isInstructor = user?.role === 'instructor';

  // Join session room
  useEffect(() => {
    if (!socket || !connected || !sessionId) return;

    socket.emit('join-session', { sessionId });

    // Socket listeners
    socket.on('participant-update', ({ count }) => {
      setParticipantCount(count);
    });

    socket.on('pulse-launched', (poll) => {
      setCurrentPoll(poll);
      setSubmitted(false);
      setAnalytics(null);
    });

    socket.on('pulse-closed', ({ pollId, analytics: a }) => {
      setAnalytics(a);
      setCurrentPoll((prev) => {
        if (prev && prev.pollId === pollId) {
          return { ...prev, closed: true };
        }
        return prev;
      });
      setPollHistory((prev) => [
        { pollId, analytics: a, closedAt: new Date() },
        ...prev,
      ]);
    });

    socket.on('analytics-update', ({ pollId, analytics: a }) => {
      setCurrentPoll((prev) => {
        if (!prev || prev.pollId === pollId) {
          setAnalytics(a);
        }
        return prev;
      });
    });

    socket.on('session-ended', () => {
      setSessionEnded(true);
    });

    socket.on('response-submitted', () => {
      setSubmitted(true);
    });

    socket.on('response-error', ({ message }) => {
      // Could show a toast here
    });

    return () => {
      socket.off('participant-update');
      socket.off('pulse-launched');
      socket.off('pulse-closed');
      socket.off('analytics-update');
      socket.off('session-ended');
      socket.off('response-submitted');
      socket.off('response-error');
    };
  }, [socket, connected, sessionId]);

  // Launch a pulse question
  const handleLaunch = useCallback(
    ({ question, category, responseType }) => {
      if (!socket || !isInstructor) return;
      socket.emit('launch-pulse', {
        sessionId,
        question,
        category,
        responseType,
        timer,
      });
    },
    [socket, sessionId, timer, isInstructor]
  );

  // Submit student response
  const handleStudentSubmit = useCallback(
    (answer) => {
      if (!socket || !currentPoll) return;
      socket.emit('submit-response', {
        pollId: currentPoll.pollId,
        answer,
      });
    },
    [socket, currentPoll]
  );

  // End session
  const handleEndSession = async () => {
    try {
      await authFetch(`/sessions/${sessionId}/end`, { method: 'POST' });
      socket?.emit('end-session', { sessionId });
      setSessionEnded(true);
    } catch (err) {
      // handled
    }
  };

  // Session ended state
  if (sessionEnded) {
    if (isInstructor) {
      return (
        <div className="page">
          <SessionReport sessionId={sessionId} />
        </div>
      );
    }

    return (
      <div className="page">
        <div className="container">
          <div className="waiting-state">
            <div style={{ fontSize: '4rem' }}>✅</div>
            <h2>Session Ended</h2>
            <p>The instructor has ended this live session.</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ======== INSTRUCTOR VIEW ========
  if (isInstructor) {
    return (
      <div className="page">
        <div className="container">
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="live-dot" />
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--color-danger)',
                    textTransform: 'uppercase',
                    fontSize: '0.8125rem',
                  }}
                >
                  Live Session
                </span>
              </div>
              <span className="badge badge-success">
                {participantCount} students
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <TimerSelect value={timer} onChange={setTimer} />
              <button className="btn btn-danger btn-sm" onClick={handleEndSession}>
                End Session
              </button>
            </div>
          </div>

          {/* Current Poll + Analytics */}
          {currentPoll && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                }}
              >
                <h3>Current Pulse</h3>
                <span className={`badge ${currentPoll.closed ? 'badge-warning' : 'badge-success'}`}>
                  {currentPoll.closed ? 'Closed' : 'Active'}
                </span>
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  marginBottom: '1.25rem',
                  padding: '1rem',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {currentPoll.question}
              </div>
              <LiveAnalytics
                analytics={analytics}
                responseType={currentPoll.responseType}
              />
            </div>
          )}

          {/* Question Templates */}
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>
              {currentPoll ? '🔄 Launch Next Question' : '⚡ Launch a Pulse'}
            </h2>
          </div>
          <QuestionTemplates onLaunch={handleLaunch} disabled={false} />
        </div>
      </div>
    );
  }

  // ======== STUDENT VIEW ========
  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '2rem',
          }}
        >
          <div className="live-dot" />
          <h2>Live Session</h2>
          <span className="badge badge-success">{participantCount} online</span>
        </div>

        {/* Current poll or waiting */}
        {currentPoll && !currentPoll.closed ? (
          <StudentPulse
            poll={currentPoll}
            onSubmit={handleStudentSubmit}
            submitted={submitted}
          />
        ) : (
          <div className="waiting-state">
            <div className="waiting-dots">
              <span />
              <span />
              <span />
            </div>
            <h2>Waiting for next pulse...</h2>
            <p style={{ maxWidth: 360 }}>
              Your instructor will launch the next question shortly. Stay on this
              page.
            </p>
          </div>
        )}

        {/* Show last poll results */}
        {currentPoll?.closed && analytics && (
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Last Pulse Results</h3>
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontWeight: 500,
              }}
            >
              {currentPoll.question}
            </div>
            <LiveAnalytics
              analytics={analytics}
              responseType={currentPoll.responseType}
            />
          </div>
        )}
      </div>
    </div>
  );
}
