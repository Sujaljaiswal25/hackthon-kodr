export default function TimerSelect({ value, onChange }) {
  const options = [3, 5, 10];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span
        style={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Timer:
      </span>
      {options.map((t) => (
        <button
          key={t}
          className={`btn btn-sm ${t === value ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => onChange(t)}
          style={{ minWidth: 52 }}
        >
          {t}s
        </button>
      ))}
    </div>
  );
}
