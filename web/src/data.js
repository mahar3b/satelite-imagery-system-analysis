export const meta = {
  course: 'AI2002',
  school: 'FAST-NUCES Lahore',
  group: 'F26-06',
  track: 'Track A · Research & Development',
  instructors: 'Dr. Hajra Waheed and TA Saad Bin Ather',
  repo: 'https://github.com/mahar3b/satelite-imagery-system-analysis',
  team: [
    ['Mahareb Ammar', '24L-2540'],
    ['Hamza Baqir', '24L-2505'],
    ['Ali Naveed', '24L-2579'],
  ],
}

export const pitch =
  'A Vision Transformer trained on sharp 10 m Sentinel-2 images loses accuracy on 30 m Landsat images of the same ten land classes, because it latches onto sensor noise and resolution. We adapted clinical attention regularization to satellite imagery: NDVI and NDWI supply free physical masks, and a light penalty (λ = 0.1) keeps attention on the ground without starving the model of surrounding context.'

export const sensors = [
  {
    name: 'Sentinel-2',
    role: 'Source domain',
    gsd: '10 m',
    grid: '64×64',
    pixels: '4,096 pixels',
    note: 'EuroSAT, 13 bands. The model trains here.',
    size: 128,
    cell: 4,
  },
  {
    name: 'Landsat',
    role: 'Target domain',
    gsd: '30 m',
    grid: '22×22',
    pixels: '484 pixels',
    note: 'EuroSAT-L, same ~640 m footprint. Nine times fewer pixels.',
    size: 44,
    cell: 8,
  },
]

export const formulas = [
  ['NDVI', '(NIR − Red) / (NIR + Red)', 'Vegetation. High where plants reflect near-infrared.'],
  ['NDWI', '(Green − NIR) / (Green + NIR)', 'Water. High where water reflects green and absorbs NIR.'],
  ['AMIL', 'Σ Aᵢ · Mᵢ', 'Share of [CLS] attention that lands inside the proxy mask.'],
  ['Loss', 'L_cls + λ (1 − AMIL)', 'Classification, plus a penalty when attention leaves the mask.'],
]

export const maskRules = [
  ['Vegetation', 'Annual crop, forest, herbaceous, pasture, permanent crop', 'NDVI > 0.38'],
  ['Water', 'River, sea / lake', 'NDWI > 0'],
  ['Built-up', 'Highway, industrial, residential', 'NDVI < 0.25'],
]

export const training = [
  ['Backbone', 'ViT-B/16, ImageNet-1K weights'],
  ['Attention', 'Block 12, [CLS] row, 14×14 patches'],
  ['Trainable', 'Classifier head and the last two encoder blocks'],
  ['Optimizer', 'AdamW, head 1e-3, blocks 5e-5, decay 1e-4'],
  ['Schedule', 'Batch 64, 5 epochs, mixed precision on a T4'],
  ['Sweep', 'λ in {0, 0.1, 0.5, 1.0, 2.0}. λ = 0 is the control'],
]

export const results = [
  { model: 'ResNet-50', lambda: null, s2: 91.56, s2f1: 89.41, landsat: 19.76, f1: 17.82, drop: 71.8, amil: null },
  { model: 'ViT-B/16', lambda: 0, s2: 97.05, s2f1: 96.98, landsat: 50.43, f1: 49.35, drop: 46.62, amil: 0.5991, role: 'Control' },
  { model: 'ViT-B/16', lambda: 0.1, s2: 97.0, s2f1: 96.92, landsat: 50.19, f1: 49.62, drop: 46.81, amil: 0.6835, role: 'Operating point', optimal: true },
  { model: 'ViT-B/16', lambda: 0.5, s2: 96.85, s2f1: 96.79, landsat: 48.8, f1: 47.92, drop: 48.05, amil: 0.8724 },
  { model: 'ViT-B/16', lambda: 1, s2: 96.6, s2f1: 96.51, landsat: 46.54, f1: 45.3, drop: 50.06, amil: 0.9026 },
  { model: 'ViT-B/16', lambda: 2, s2: 96.35, s2f1: 96.22, landsat: 46.33, f1: 44.91, drop: 50.02, amil: 0.9222, role: 'Over-regularized' },
]

export const classF1 = [
  { name: 'Forest', f1: 84.2, tone: 'easy' },
  { name: 'Sea / lake', f1: 77.8, tone: 'easy' },
  { name: 'Highway', f1: 41.5, tone: 'hard' },
  { name: 'River', f1: 40.1, tone: 'hard' },
  { name: 'Pasture', f1: 35.2, tone: 'hard' },
]

export const phases = [
  {
    id: '01',
    title: 'Proposal and proxy check',
    body: 'Streamed 150 EuroSAT images per class. NDVI (F = 560) and NDWI (F = 998) separate vegetation and water strongly enough to use as masks.',
  },
  {
    id: '02',
    title: 'Data and baselines',
    body: 'Cached the multispectral tiles and fixed pitch-black Landsat reads with a 2–98% contrast stretch. A ResNet-50 linear probe fell from 91.6% to 19.8%. ViT-B/16 held 51.3%.',
  },
  {
    id: '03',
    title: 'Attention hook and λ sweep',
    body: 'Unfroze the head and the last two blocks, then swept the attention penalty. AMIL rose monotonically from 0.599 to 0.922. λ = 0.1 was the operating point.',
  },
  {
    id: '04',
    title: 'Evaluation and fairness',
    body: 'Macro-F1, confusion matrices, and three failure clusters: mixed vegetation, thin rivers, and asphalt versus roofs. Class support does not explain the errors. Resolution does.',
  },
  {
    id: '05',
    title: 'Paper and defense',
    body: 'IEEE-style report, the Colab notebook, and the viva guide. The site you are reading is the public face of that package.',
  },
]
