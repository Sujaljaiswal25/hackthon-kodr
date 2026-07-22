const TEMPLATES = {
  understanding: {
    label: 'Understanding Check',
    icon: '🧠',
    questions: [
      { question: 'Did everyone understand the concept?', responseType: 'yesno' },
      { question: 'Are you able to follow?', responseType: 'yesno' },
      { question: 'Was this topic difficult?', responseType: 'yesno' },
    ],
  },
  revision: {
    label: 'Revision Check',
    icon: '🔄',
    questions: [
      { question: 'Should I explain this topic again?', responseType: 'yesno' },
      { question: 'Need another example?', responseType: 'yesno' },
      { question: 'Would you like a quick revision?', responseType: 'yesno' },
    ],
  },
  pace: {
    label: 'Pace Check',
    icon: '⏱️',
    questions: [
      { question: 'Is the pace comfortable?', responseType: 'yesno' },
      { question: 'Ready for the next topic?', responseType: 'yesno' },
      { question: 'Is the pace too fast?', responseType: 'yesno' },
    ],
  },
  doubt: {
    label: 'Doubt Check',
    icon: '❓',
    questions: [
      { question: 'Are you facing any doubts?', responseType: 'yesno' },
      { question: 'Need mentor support?', responseType: 'yesno' },
      { question: 'Want more practice questions?', responseType: 'yesno' },
    ],
  },
  feedback: {
    label: 'Session Feedback',
    icon: '📊',
    questions: [
      { question: "Was today's session useful?", responseType: 'yesno' },
      { question: 'Rate your understanding.', responseType: 'rating' },
    ],
  },
};

export default function QuestionTemplates({ onLaunch, disabled }) {
  return (
    <div>
      {Object.entries(TEMPLATES).map(([category, { label, icon, questions }]) => (
        <div className="template-category" key={category}>
          <div className="template-category-title">
            {icon} {label}
          </div>
          <div className="grid-3">
            {questions.map((q, idx) => (
              <button
                key={idx}
                className="pulse-card"
                disabled={disabled}
                onClick={() => onLaunch({ ...q, category })}
                style={{
                  textAlign: 'left',
                  border: 'none',
                  font: 'inherit',
                }}
              >
                <div
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    color: 'var(--color-text)',
                    marginBottom: '0.375rem',
                  }}
                >
                  {q.question}
                </div>
                <span className={`badge ${q.responseType === 'rating' ? 'badge-warning' : 'badge-primary'}`}>
                  {q.responseType === 'rating' ? '⭐ Rating 1-5' : '✓ Yes / No'}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
