import { useState, useEffect } from 'react';

export default function StudentPulse({
  poll,
  onSubmit,
  submitted,
}) {
  const [timeLeft, setTimeLeft] = useState(poll.timer);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const progress = poll.timer > 0 ? (timeLeft / poll.timer) * 100 : 0;
  const isExpired = timeLeft <= 0;

  const handleSubmit = (answer) => {
    if (submitted || isExpired) return;
    setSelectedAnswer(answer);
    onSubmit(answer);
  };

  return (
    <div
      className="card"
      style={{
        maxWidth: 500,
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      {/* Timer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div
          className="timer-ring"
          style={{
            '--progress': `${progress}%`,
          }}
        >
          <span>{timeLeft}</span>
        </div>
      </div>

      {/* Question */}
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.375rem' }}>
        {poll.question}
      </h2>

      {/* Response buttons */}
      {submitted ? (
        <div
          style={{
            padding: '1.5rem',
            background: 'var(--color-success-light)',
            borderRadius: 'var(--radius-md)',
            color: '#065f46',
            fontWeight: 600,
          }}
        >
          ✅ Response submitted!
        </div>
      ) : isExpired ? (
        <div
          style={{
            padding: '1.5rem',
            background: 'var(--color-warning-light)',
            borderRadius: 'var(--radius-md)',
            color: '#92400e',
            fontWeight: 600,
          }}
        >
          ⏰ Time is up!
        </div>
      ) : poll.responseType === 'yesno' ? (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            className="btn btn-lg btn-success"
            style={{ flex: 1, maxWidth: 180, fontSize: '1.125rem' }}
            onClick={() => handleSubmit('yes')}
          >
            👍 YES
          </button>
          <button
            className="btn btn-lg btn-danger"
            style={{ flex: 1, maxWidth: 180, fontSize: '1.125rem' }}
            onClick={() => handleSubmit('no')}
          >
            👎 NO
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              className={`btn btn-lg ${
                selectedAnswer === String(rating) ? 'btn-primary' : 'btn-outline'
              }`}
              style={{ minWidth: 56 }}
              onClick={() => handleSubmit(String(rating))}
            >
              {rating} ⭐
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
