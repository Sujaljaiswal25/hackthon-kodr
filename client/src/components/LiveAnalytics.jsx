export default function LiveAnalytics({ analytics, responseType }) {
  if (!analytics) return null;

  const { totalStudents, totalResponses, participation, distribution } =
    analytics;

  return (
    <div>
      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-value">{totalStudents}</div>
          <div className="stat-label">Students Joined</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalResponses}</div>
          <div className="stat-label">Responses</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-value"
            style={{
              color:
                participation >= 80
                  ? 'var(--color-success)'
                  : participation >= 50
                    ? 'var(--color-warning)'
                    : 'var(--color-danger)',
            }}
          >
            {participation}%
          </div>
          <div className="stat-label">Participation</div>
        </div>
      </div>

      {/* Distribution */}
      {responseType === 'yesno' && distribution && (
        <div>
          <div className="analytics-bar">
            {distribution.yes > 0 && (
              <div
                className="analytics-bar-fill analytics-bar-yes"
                style={{ width: `${distribution.yes}%` }}
              >
                YES {distribution.yes}%
              </div>
            )}
            {distribution.no > 0 && (
              <div
                className="analytics-bar-fill analytics-bar-no"
                style={{ width: `${distribution.no}%` }}
              >
                NO {distribution.no}%
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.5rem',
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <span>
              ✅ Yes: {distribution.yesCount || 0}
            </span>
            <span>
              ❌ No: {distribution.noCount || 0}
            </span>
          </div>
        </div>
      )}

      {responseType === 'rating' && distribution && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5].map((rating) => {
            const data = distribution[rating] || { count: 0, percentage: 0 };
            return (
              <div
                key={rating}
                style={{
                  flex: 1,
                  minWidth: 60,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 0.5rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                  {'⭐'.repeat(rating)}
                </div>
                <div
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                  }}
                >
                  {data.count}
                </div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {data.percentage}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
