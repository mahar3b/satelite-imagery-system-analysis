import {
  classF1,
  formulas,
  maskRules,
  meta,
  phases,
  pitch,
  results,
  sensors,
  training,
} from './data.js'

const nav = [
  ['problem', 'Problem'],
  ['method', 'Method'],
  ['results', 'Results'],
  ['timeline', 'Timeline'],
]

function formatLambda(value) {
  if (value == null) return '—'
  return Number.isInteger(value) ? value.toFixed(1) : String(value)
}

function formatNumber(value, digits) {
  if (value == null) return '—'
  return value.toFixed(digits)
}

export default function App() {
  return (
    <>
      <a className="skip" href="#problem">
        Skip to content
      </a>
      <header className="nav">
        <a className="brand" href="#top">
          <span>F26-06</span>
          <small>Land cover</small>
        </a>
        <nav>
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <p className="kicker">
            {meta.course} · {meta.school} · Group {meta.group}
          </p>
          <h1>Cross-sensor land cover, with attention tied to the ground.</h1>
          <p className="lede">{pitch}</p>
          <dl className="stats">
            <div>
              <dt>ResNet drop</dt>
              <dd>71.8 pt</dd>
            </div>
            <div>
              <dt>Landsat accuracy at λ = 0.1</dt>
              <dd>50.2%</dd>
            </div>
            <div>
              <dt>Peak attention in the mask</dt>
              <dd>92.2%</dd>
            </div>
          </dl>
        </section>

        <Section
          id="problem"
          index="01"
          title="The sensor changes. The land does not."
          lede="Same ten classes, same 640 m footprint. Sentinel-2 is the camera the model trains on. Landsat is the camera it has to survive."
        >
          <div className="sensor-row">
            {sensors.map((sensor) => (
              <article key={sensor.name} className="sensor">
                <div
                  className="chip"
                  style={{
                    width: sensor.size,
                    height: sensor.size,
                    backgroundSize: `${sensor.cell}px ${sensor.cell}px`,
                  }}
                  aria-hidden="true"
                />
                <p className="role">{sensor.role}</p>
                <h3>{sensor.name}</h3>
                <p className="gsd">
                  {sensor.gsd}
                  <span> · {sensor.grid}</span>
                </p>
                <p>{sensor.pixels}</p>
                <p className="quiet">{sensor.note}</p>
              </article>
            ))}
          </div>
          <p className="narrow">
            A 15 m river or a highway is thinner than one Landsat pixel, so it
            blends into the grass and soil around it. Local edge filters, the
            kind ResNet relies on, lose the texture they trained on. Global
            attention keeps more of the scene, which is why the fix is built on
            a Vision Transformer.
          </p>
        </Section>

        <Section
          id="method"
          index="02"
          title="Physical masks, then a light penalty."
          lede="Clinical attention regularization used boxes drawn by radiologists. EuroSAT has no boxes. NDVI and NDWI are computed from bands the satellite already recorded."
        >
          <div className="formula-grid">
            {formulas.map(([name, expr, about]) => (
              <article key={name}>
                <h3>{name}</h3>
                <p className="formula">{expr}</p>
                <p>{about}</p>
              </article>
            ))}
          </div>
          <div className="split">
            <div>
              <h3 className="block-title">Mask rules</h3>
              <ul className="rules">
                {maskRules.map(([name, classes, rule]) => (
                  <li key={name}>
                    <strong>{name}</strong>
                    <span>{classes}</span>
                    <code>{rule}</code>
                  </li>
                ))}
              </ul>
              <p className="quiet">
                Each 64×64 mask is pooled to the 14×14 patch grid the
                transformer actually attends over. λ = 0 uses the same tiles and
                the same schedule with the penalty turned off, so a gain at
                λ = 0.1 is the penalty itself.
              </p>
            </div>
            <div>
              <h3 className="block-title">Training</h3>
              <dl className="spec">
                {training.map(([term, detail]) => (
                  <div key={term}>
                    <dt>{term}</dt>
                    <dd>{detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Section>

        <Section
          id="results"
          index="03"
          title="Mild regularization is the operating point."
          lede="Attention inside the mask climbs the whole way to λ = 2. Landsat macro-F1 peaks at λ = 0.1, then falls as the model loses riverbanks, road shoulders, and other context."
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Model</th>
                  <th>λ</th>
                  <th>S2 acc</th>
                  <th>S2 F1</th>
                  <th>Landsat acc</th>
                  <th>Landsat F1</th>
                  <th>Drop</th>
                  <th>AMIL</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={`${row.model}-${row.lambda}`} className={row.optimal ? 'optimal' : undefined}>
                    <td>
                      {row.model}
                      {row.role ? <small>{row.role}</small> : null}
                    </td>
                    <td>{formatLambda(row.lambda)}</td>
                    <td>{formatNumber(row.s2, 2)}</td>
                    <td>{formatNumber(row.s2f1, 2)}</td>
                    <td>{formatNumber(row.landsat, 2)}</td>
                    <td>{formatNumber(row.f1, 2)}</td>
                    <td>{formatNumber(row.drop, 2)}</td>
                    <td>{formatNumber(row.amil, 4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="quiet table-note">
            Accuracies are percent. ResNet-50 is the convolutional baseline
            from the linear probe. The ViT rows share one fine-tune: the head
            plus the last two encoder blocks. Macro-F1 treats the ten classes
            equally. Landsat support runs from 396 pasture tiles to 609 sea/lake
            tiles, so accuracy alone is a little kind to the easy classes.
          </p>
          <h3 className="block-title">Landsat F1, easiest and hardest</h3>
          <div className="meters">
            {classF1.map((item) => (
              <div key={item.name} className={`meter ${item.tone}`}>
                <span>{item.name}</span>
                <div className="track">
                  <div style={{ width: `${item.f1}%` }} />
                </div>
                <span className="num">{item.f1.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="timeline"
          index="04"
          title="Five phases, already run."
          lede="The notebook and the report are the full record. This is the order the work actually happened."
        >
          <ol className="timeline">
            {phases.map((phase) => (
              <li key={phase.id}>
                <span>{phase.id}</span>
                <div>
                  <h3>{phase.title}</h3>
                  <p>{phase.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      </main>

      <footer>
        <div>
          <p className="kicker">Group {meta.group}</p>
          <ul className="team">
            {meta.team.map(([name, id]) => (
              <li key={id}>
                {name}
                <span>{id}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p>{meta.track}</p>
          <p className="quiet">{meta.instructors}</p>
          <a href={meta.repo}>Project repository</a>
        </div>
      </footer>
    </>
  )
}

function Section({ id, index, title, lede, children }) {
  return (
    <section id={id}>
      <header className="section-head">
        <span>{index}</span>
        <div>
          <h2>{title}</h2>
          <p>{lede}</p>
        </div>
      </header>
      {children}
    </section>
  )
}
