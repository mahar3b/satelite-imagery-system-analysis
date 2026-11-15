function chartPoint(index, count, value, min, max) {
  const x = 56 + (index * 570) / (count - 1)
  const y = 228 - ((value - min) / (max - min)) * 174
  return [x, y]
}

export function SweepChart({ data }) {
  const series = [
    { key: 'landsat', label: 'Landsat accuracy', color: 'var(--accent)' },
    { key: 'f1', label: 'Landsat macro F1', color: 'var(--ochre)' },
    { key: 's2', label: 'Sentinel-2 accuracy', color: 'var(--muted)' },
  ]
  const yTicks = [40, 50, 60, 70, 80, 90, 100]

  return (
    <div className="chart-frame">
      <svg className="chart" viewBox="0 0 680 292" role="img" aria-labelledby="sweep-title sweep-desc">
        <title id="sweep-title">Accuracy and macro F1 across the lambda sweep</title>
        <desc id="sweep-desc">Sentinel-2 and Landsat accuracy and Landsat macro F1 for all five tested lambda values.</desc>
        {yTicks.map((tick) => {
          const y = 228 - ((tick - 40) / 60) * 174
          return (
            <g key={tick}>
              <line className="chart-gridline" x1="56" x2="626" y1={y} y2={y} />
              <text className="chart-tick" x="46" y={y + 4} textAnchor="end">{tick}</text>
            </g>
          )
        })}
        <line className="chart-axis" x1="56" x2="626" y1="228" y2="228" />
        {data.map((row, index) => {
          const [x] = chartPoint(index, data.length, 40, 40, 100)
          return (
            <g key={row.lambda}>
              <line className="chart-gridline chart-grid-vertical" x1={x} x2={x} y1="54" y2="228" />
              <text className="chart-tick" x={x} y="249" textAnchor="middle">{row.lambda.toFixed(1)}</text>
            </g>
          )
        })}
        {series.map((item) => {
          const points = data.map((row, index) =>
            chartPoint(index, data.length, row[item.key], 40, 100),
          )
          return (
            <g key={item.key}>
              <polyline
                className="chart-line"
                points={points.map(([x, y]) => `${x},${y}`).join(' ')}
                stroke={item.color}
              />
              {points.map(([x, y], index) => (
                <g key={`${item.key}-${data[index].lambda}`}>
                  <circle className="chart-dot" cx={x} cy={y} r="4" fill={item.color} />
                  <text
                    className="chart-value"
                    x={x}
                    y={y - (item.key === 'f1' ? 24 : 9)}
                    textAnchor="middle"
                  >
                    {data[index][item.key].toFixed(1)}
                  </text>
                </g>
              ))}
            </g>
          )
        })}
        <text className="chart-axis-title" x="341" y="283" textAnchor="middle">Regularization strength λ</text>
      </svg>
      <ul className="chart-legend">
        {series.map((item) => (
          <li key={item.key}>
            <span style={{ backgroundColor: item.color }} />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AlignmentChart({ data }) {
  const max = 1
  const bars = data.map((row, index) => ({
    ...row,
    x: 86 + index * 112,
    height: (row.amil / max) * 155,
  }))

  return (
    <div className="chart-frame alignment-chart">
      <svg className="chart" viewBox="0 0 680 245" role="img" aria-labelledby="amil-title amil-desc">
        <title id="amil-title">Attention mass inside mask across the lambda sweep</title>
        <desc id="amil-desc">AMIL rises from 0.5991 at lambda zero to 0.9222 at lambda two.</desc>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = 194 - tick * 155
          return (
            <g key={tick}>
              <line className="chart-gridline" x1="48" x2="644" y1={y} y2={y} />
              <text className="chart-tick" x="40" y={y + 4} textAnchor="end">{tick.toFixed(2)}</text>
            </g>
          )
        })}
        {bars.map((bar) => (
          <g key={bar.lambda}>
            <rect
              className="chart-bar"
              x={bar.x}
              y={194 - bar.height}
              width="54"
              height={bar.height}
              rx="1"
            />
            <text className="chart-value" x={bar.x + 27} y={188 - bar.height} textAnchor="middle">
              {bar.amil.toFixed(4)}
            </text>
            <text className="chart-tick" x={bar.x + 27} y="216" textAnchor="middle">
              {bar.lambda.toFixed(1)}
            </text>
          </g>
        ))}
        <text className="chart-axis-title" x="341" y="240" textAnchor="middle">Regularization strength λ</text>
      </svg>
    </div>
  )
}

export function ClassF1Chart({ classes, selectedLambda }) {
  const available = selectedLambda === 0 || selectedLambda === 0.1
  const baseline = selectedLambda === 0
  const value = (item) => (baseline ? item.baseline : item.regularized)
  const max = 100

  return (
    <div className="class-chart" role="list" aria-label={`Per-class Landsat F1 at lambda ${selectedLambda.toFixed(1)}`}>
      {classes.map((item) => (
        <div className="class-chart-row" key={item.name} role="listitem">
          <div className="class-chart-label">
            <span>{item.name}</span>
            <small>{item.support} test tiles</small>
          </div>
          <div className="class-chart-track">
            {available ? <span className="class-chart-fill" style={{ width: `${(value(item) / max) * 100}%` }} /> : null}
          </div>
          <strong>{available ? `${value(item).toFixed(2)}%` : 'n/a'}</strong>
          {available ? (
            <span className={`class-delta ${item.regularized >= item.baseline ? 'positive' : 'negative'}`}>
              Δ {(item.regularized - item.baseline) > 0 ? '+' : ''}{(item.regularized - item.baseline).toFixed(2)}
            </span>
          ) : <span className="class-delta">—</span>}
        </div>
      ))}
    </div>
  )
}
