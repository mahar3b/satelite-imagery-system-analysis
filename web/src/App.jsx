import { useState } from 'react'
import { AlignmentChart, ClassF1Chart, SweepChart } from './Charts.jsx'
import {
  classF1,
  confusions,
  formulas,
  maskRules,
  meta,
  phases,
  pitch,
  results,
  sensors,
  training,
} from './data.js'
import { vivaQuestions, walkthrough } from './phase3.js'

const nav = [
  ['problem', 'Problem'],
  ['method', 'Method'],
  ['results', 'Results'],
  ['figures', 'Figures'],
  ['analysis', 'Error & fairness'],
  ['walkthrough', 'Walkthrough'],
  ['viva', 'Viva'],
  ['timeline', 'Timeline'],
]

const sweep = results.filter((row) => row.lambda !== null)

function formatLambda(value) {
  if (value == null) return '—'
  return value.toFixed(1)
}

function formatNumber(value, digits = 2) {
  if (value == null) return '—'
  return value.toFixed(digits)
}

export default function App() {
  const [selectedIndex, setSelectedIndex] = useState(1)
  const [figureMode, setFigureMode] = useState('both')
  const selected = sweep[selectedIndex]

  return (
    <>
      <a className="skip" href="#problem">Skip to content</a>
      <header className="nav">
        <a className="brand" href="#top">
          <span>F26-06</span>
          <small>Land cover</small>
        </a>
        <nav aria-label="Main navigation">
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`}>{label}</a>
          ))}
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <p className="kicker">{meta.course} · {meta.school} · Group {meta.group}</p>
          <h1>Cross-sensor land cover, with attention tied to the ground.</h1>
          <p className="lede">{pitch}</p>
          <dl className="stats">
            <div>
              <dt>ResNet-50 accuracy drop</dt>
              <dd>71.8 <span>pts</span></dd>
            </div>
            <div>
              <dt>Landsat accuracy · λ = 0.1</dt>
              <dd>50.19<span>%</span></dd>
            </div>
            <div>
              <dt>Peak attention in the mask</dt>
              <dd>92.22<span>%</span></dd>
            </div>
          </dl>
        </section>

        <Section
          id="problem"
          index="01"
          title="The sensor changes. The land does not."
          lede="Same ten classes, same ~640 m footprint. Sentinel-2 is the camera the model trains on. Landsat is the camera it has to survive."
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
                <p className="gsd">{sensor.gsd}<span> · {sensor.grid}</span></p>
                <p>{sensor.pixels}</p>
                <p className="quiet">{sensor.note}</p>
              </article>
            ))}
          </div>
          <p className="narrow">
            A 15 m river or highway is thinner than one Landsat pixel, so it
            blends into surrounding grass and soil. Local edge filters lose
            texture they trained on; global attention keeps more of the scene.
          </p>
        </Section>

        <Section
          id="method"
          index="02"
          title="Physical masks, then a light penalty."
          lede="Clinical attention regularization used boxes drawn by radiologists. EuroSAT has no boxes, so NDVI and NDWI supply physically grounded proxy masks."
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
                Each 64×64 mask is pooled to the 14×14 patch grid used by the
                transformer. λ = 0 is the same setup with the penalty off.
              </p>
            </div>
            <div>
              <h3 className="block-title">Training</h3>
              <dl className="spec">
                {training.map(([term, detail]) => (
                  <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>
                ))}
              </dl>
            </div>
          </div>
        </Section>

        <Section
          id="results"
          index="03"
          title="Mild regularization is the operating point."
          lede="Attention inside the mask rises across the λ sweep, but Landsat transfer peaks at the unregularized control. λ = 0.1 remains a useful alignment–performance trade-off, not an accuracy gain."
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Model</th><th>λ</th><th>S2 acc</th><th>S2 F1</th>
                  <th>Landsat acc</th><th>Landsat F1</th><th>Acc gap</th><th>AMIL</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={`${row.model}-${row.lambda}`} className={row.optimal ? 'optimal' : undefined}>
                    <td data-label="Model">
                      {row.model}
                      {row.role ? <small>{row.role}</small> : null}
                    </td>
                    <td data-label="λ">{formatLambda(row.lambda)}</td>
                    <td data-label="S2 accuracy">{formatNumber(row.s2)}%</td>
                    <td data-label="S2 macro F1">{formatNumber(row.s2f1)}%</td>
                    <td data-label="Landsat accuracy">{formatNumber(row.landsat)}%</td>
                    <td data-label="Landsat macro F1">{formatNumber(row.f1)}%</td>
                    <td data-label="Accuracy gap">{formatNumber(row.drop)} pts</td>
                    <td data-label="AMIL">{formatNumber(row.amil, 4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="quiet table-note">
            Accuracies and F1 scores are percentages. The accuracy gap is
            Sentinel-2 accuracy minus Landsat accuracy. The ViT sweep shares
            one fine-tune setup; class-wise evaluation is available only for
            the λ = 0 and λ = 0.1 models.
          </p>

          <div className="explorer panel">
            <div className="explorer-head">
              <div>
                <p className="kicker">Interactive result</p>
                <h3>λ Explorer</h3>
              </div>
              <output className="lambda-output" htmlFor="lambda-range">
                λ = {formatLambda(selected.lambda)}
              </output>
            </div>
            <label className="sr-only" htmlFor="lambda-range">Select a tested lambda value</label>
            <input
              id="lambda-range"
              type="range"
              min="0"
              max={sweep.length - 1}
              step="1"
              value={selectedIndex}
              aria-valuetext={`lambda ${formatLambda(selected.lambda)}`}
              onChange={(event) => setSelectedIndex(Number(event.target.value))}
            />
            <div className="range-labels" aria-hidden="true">
              {sweep.map((row, index) => (
                <button
                  type="button"
                  key={row.lambda}
                  className={index === selectedIndex ? 'selected' : ''}
                  onClick={() => setSelectedIndex(index)}
                >
                  {formatLambda(row.lambda)}
                </button>
              ))}
            </div>
            <dl className="explorer-metrics">
              <div><dt>Landsat accuracy</dt><dd>{formatNumber(selected.landsat)}%</dd></div>
              <div><dt>Landsat macro F1</dt><dd>{formatNumber(selected.f1)}%</dd></div>
              <div><dt>Cross-sensor accuracy gap</dt><dd>{formatNumber(selected.drop)} <span>pts</span></dd></div>
              <div><dt>Sentinel-2 accuracy</dt><dd>{formatNumber(selected.s2)}%</dd></div>
            </dl>
            <div className="explorer-class">
              <div className="chart-heading">
                <h4>Per-class Landsat F1 · Phase 4 snapshot</h4>
                <span>Support and F1 change vs its λ = 0 control</span>
              </div>
              <ClassF1Chart classes={classF1} selectedLambda={selected.lambda} />
              <p className="quiet data-caveat">
                These per-class scores are from the notebook’s Phase 4 evaluation
                snapshot; the aggregate sweep above is the separately reported
                Phase 3 sweep. Their aggregate values differ.
              </p>
              {selected.lambda !== 0 && selected.lambda !== 0.1 ? (
                <p className="quiet data-caveat">
                  Per-class metrics were not retained for λ = {formatLambda(selected.lambda)};
                  values are not estimated or interpolated.
                </p>
              ) : null}
            </div>
          </div>

          <div className="chart-grid">
            <article className="panel">
              <div className="chart-heading">
                <h3>Sweep performance</h3>
                <span>Percent · direct labels</span>
              </div>
              <SweepChart data={sweep} />
            </article>
            <article className="panel">
              <div className="chart-heading">
                <h3>Attention alignment</h3>
                <span>Mean AMIL · higher means more mask attention</span>
              </div>
              <AlignmentChart data={sweep} />
            </article>
          </div>
        </Section>

        <Section
          id="figures"
          index="04"
          title="Figures from the experiment."
          lede="Original exported notebook figures, presented with their report context."
        >
          <div className="figure-grid">
            <Figure
              number="Figure 1"
              title="Cross-sensor accuracy and attention alignment vs regularization λ"
              src="/figures/sweep_curve.png"
              alt="Research plot of Landsat accuracy and attention alignment over lambda values."
              caption="Reported sweep curve: Landsat accuracy falls as attention alignment rises. The λ = 0.1 macro-F1 trade-off is shown in the interactive charts above."
            />
            <Figure
              number="Figure 2"
              title="Qualitative attention maps"
              src="/figures/qualitative_attention_maps.png"
              alt="Attention maps comparing baseline and regularized model attention on satellite imagery."
              caption="Qualitative attention maps show the effect of mask-guided regularization on spatial attention."
            />
            <figure className="paper-figure figure-wide">
              <div className={`figure-image figure-comparison ${figureMode !== 'both' ? `focus-${figureMode}` : ''}`}>
                <img
                  src="/figures/phase4_confusion_matrices.png"
                  alt="Normalized Landsat confusion matrices for the baseline ViT and lambda 0.1 regularized ViT."
                />
              </div>
              <figcaption>
                <span className="figure-number">Figure 3</span>
                <strong>Normalized Landsat confusion matrices</strong>
                <span>Rows are true classes; columns are predicted classes. Error patterns shift between the λ = 0 control and λ = 0.1.</span>
              </figcaption>
              <div className="figure-toggle" role="group" aria-label="Confusion matrix comparison view">
                {[
                  ['both', 'Compare both'],
                  ['baseline', 'λ = 0'],
                  ['regularized', 'λ = 0.1'],
                ].map(([mode, label]) => (
                  <button
                    type="button"
                    key={mode}
                    className={figureMode === mode ? 'active' : ''}
                    aria-pressed={figureMode === mode}
                    onClick={() => setFigureMode(mode)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </figure>
            <Figure
              number="Figure 4"
              title="Representative Landsat errors"
              src="/figures/phase4_error_samples.png"
              alt="Four satellite image examples illustrating highway, pasture, river, and annual crop classification errors."
              caption="Examples show narrow roads and waterways, vegetation mixtures, and crop boundaries that become ambiguous at 30 m."
            />
            <Figure
              number="Figure 5"
              title="Class support and sensor-resolution bias"
              src="/figures/phase4_bias_fairness_analysis.png"
              alt="Support-versus-F1 scatter plot and a Sentinel-2 versus Landsat class F1 comparison."
              caption="Class support ranges from 396 pasture tiles to 609 sea/lake tiles. The companion comparison highlights the uneven sensor-resolution effect."
            />
          </div>
        </Section>

        <Section
          id="analysis"
          index="05"
          title="Errors follow boundaries, not just class counts."
          lede="The Landsat test set is imbalanced, but sample support alone does not explain the largest errors. Mixed pixels and coarse spatial resolution shape the failure modes."
        >
          <div className="analysis-grid">
            <article className="panel">
              <p className="kicker">Systematic confusions</p>
              <ul className="confusion-list">
                {confusions.map((item) => (
                  <li key={item.pair}>
                    <div><strong>{item.pair}</strong><span>{item.share}</span></div>
                    <p>{item.cause}</p>
                  </li>
                ))}
              </ul>
              <p className="quiet">
                These are model- and dataset-specific observed error clusters,
                not universal rates. The confusion-matrix figure compares the
                λ = 0 control with λ = 0.1.
              </p>
            </article>
            <article className="panel fairness-note">
              <p className="kicker">Fairness & support</p>
              <h3>396–609 Landsat test samples per class</h3>
              <p>
                The regularized model’s class support/F1 trend has a reported
                slope of −0.007. That near-flat association does not establish
                equal performance: resolution still disproportionately hurts
                narrow rivers, highways, and class boundaries.
              </p>
              <p>
                Macro-F1 weights each of the ten classes equally. It is
                therefore a better complement to accuracy than the majority-
                weighted score alone.
              </p>
              <div className="support-range">
                <span><strong>396</strong> Pasture</span>
                <span className="support-track"><i /></span>
                <span><strong>609</strong> Sea / lake</span>
              </div>
            </article>
          </div>
          <div className="delta-panel panel">
            <div className="chart-heading">
              <h3>Class F1 vs sample support</h3>
              <span>Phase 4 notebook snapshot · λ = 0 compared with λ = 0.1</span>
            </div>
            <ClassF1Chart classes={classF1} selectedLambda={0.1} />
            <p className="quiet">
              Bars show class F1 for λ = 0.1; Δ is the percentage-point change
              from λ = 0. Class support is shown beside each class. Detailed
              per-class scores were not saved for the other sweep settings.
              These outputs are from a separate evaluation snapshot than the
              aggregate Phase 3 sweep above.
            </p>
          </div>
        </Section>

        <Section
          id="walkthrough"
          index="06"
          title="From spectral bands to cross-sensor scores."
          lede="Five notebook stages trace the data through proxy-mask construction, attention regularization, and held-out Landsat evaluation."
        >
          <ol className="walkthrough-list">
            {walkthrough.map((step) => (
              <li className="walkthrough-step panel" key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <pre><code>{step.code}</code></pre>
                <dl className="walkthrough-meta">
                  <div><dt>Tensor shapes</dt><dd>{step.shape}</dd></div>
                  <div><dt>Notebook output</dt><dd>{step.output}</dd></div>
                </dl>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          id="viva"
          index="07"
          title="Questions worth being ready for."
          lede="Open a question to review the study’s rationale, measurements, and limits."
        >
          <div className="viva-list">
            {vivaQuestions.map((item) => (
              <details className="viva-item" key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </Section>

        <Section
          id="timeline"
          index="08"
          title="Five phases, already run."
          lede="The notebooks and report are the full record. This is the order the work actually happened."
        >
          <ol className="timeline">
            {phases.map((phase) => (
              <li key={phase.id}>
                <span>{phase.id}</span>
                <div><h3>{phase.title}</h3><p>{phase.body}</p></div>
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
              <li key={id}>{name}<span>{id}</span></li>
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

function Figure({ number, title, src, alt, caption }) {
  return (
    <figure className="paper-figure">
      <div className="figure-image"><img src={src} alt={alt} loading="lazy" /></div>
      <figcaption>
        <span className="figure-number">{number}</span>
        <strong>{title}</strong>
        <span>{caption}</span>
      </figcaption>
    </figure>
  )
}

function Section({ id, index, title, lede, children }) {
  return (
    <section id={id}>
      <header className="section-head">
        <span>{index}</span>
        <div><h2>{title}</h2><p>{lede}</p></div>
      </header>
      {children}
    </section>
  )
}
