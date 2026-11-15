export const walkthrough = [
  {
    title: '1. Align the sensor inputs',
    description:
      'Load the cached Sentinel-2 subset and map its multispectral bands into RGB for the ViT. Landsat test tiles use the corresponding OLI RGB bands. Both loaders use the same ten class labels and 224 × 224 model input.',
    code: `# Sentinel-2 cache: [B02, B03, B04, B08]
rgb = bands[:, :, [2, 1, 0]]
lo, hi = np.percentile(rgb, [2, 98])
rgb_norm = np.clip((rgb - lo) / (hi - lo + 1e-6), 0, 1)`,
    shape: 'S2 cache: (7,000, 64, 64, 4) train; (2,000, 64, 64, 4) test. Landsat: (8, 22, 22) per tile → RGB → 224 × 224.',
    output:
      'The test loaders contain 2,000 balanced Sentinel-2 tiles and 5,400 Landsat tiles. Class labels match; scene-level split alignment is not verified in the project notes.',
  },
  {
    title: '2. Compute spectral indices and proxy masks',
    description:
      'Use Sentinel-2 green, red, and near-infrared channels to create class-specific physical proxies. Resize the 64 × 64 binary mask to the ViT’s 14 × 14 patch grid.',
    code: `ndvi = (nir - red) / (nir + red + 1e-6)
ndwi = (green - nir) / (green + nir + 1e-6)
if label_idx in [8, 9]:
    mask_64 = (ndwi > 0.0).astype(np.float32)
elif label_idx in [3, 4, 7]:
    mask_64 = (ndvi < 0.25).astype(np.float32)
else:
    mask_64 = (ndvi > 0.38).astype(np.float32)
mask_pil = Image.fromarray((mask_64 * 255).astype(np.uint8))
mask_pil = mask_pil.resize((14, 14), Image.BILINEAR)
mask_14 = np.asarray(mask_pil) / 255.0 > 0.3`,
    shape: 'Bands: (64, 64, 4) → proxy mask: (14, 14) → flattened mask: (196,).',
    output:
      'NDVI > 0.38 marks vegetation; NDWI > 0 marks River and SeaLake; NDVI < 0.25 marks Highway, Industrial, and Residential. Degenerate masks fall back to all-valid.',
  },
  {
    title: '3. Expose [CLS]-to-patch attention',
    description:
      'The final ViT encoder block returns its attention weights. From the 197 tokens (one [CLS] token and 196 image patches), keep the [CLS]-to-patch row for the regularizer.',
    code: `attn_out, attn = last_block.self_attention(
    norm1, norm1, norm1, need_weights=True,
    average_attn_weights=True)
cls_to_patches = attn[:, 0, 1:]`,
    shape: 'Input: (B, 3, 224, 224) → attention: (B, 197, 197) → selected attention: (B, 196).',
    output:
      'The classifier returns ten class logits per tile. The head and last two encoder blocks are trainable so attention can respond to the regularization signal.',
  },
  {
    title: '4. Train with AMIL at λ = 0.1',
    description:
      'AMIL is the attention probability mass inside the proxy mask. Penalize attention outside the mask while retaining the ordinary classification objective.',
    code: `        amil = (attn_cls * mask_binary).sum(dim=1)
    loss_attn = 1.0 - amil
    lambda_reg = 0.1
    loss_total = loss_cls + lambda_reg * loss_attn`,
    shape: 'Per batch: attention and mask (B, 196) → scalar mean AMIL and scalar training loss.',
    output:
      'At λ = 0.1, reported S2 AMIL rises from 0.5991 at λ = 0 to 0.6835. Landsat accuracy is 50.19% (vs 50.43% at λ = 0); Landsat macro-F1 is 49.62% (vs 49.35%).',
  },
  {
    title: '5. Evaluate on held-out Landsat tiles',
    description:
      'Read the Landsat EuroSAT-L test split without training on it. Select OLI RGB bands, apply the 2nd–98th percentile contrast stretch, then run the same ViT image transform and compute target-domain metrics.',
    code: `arr = src.read().astype(np.float32)  # (8, 22, 22)
rgb = np.stack([arr[3], arr[2], arr[1]], axis=-1)
lo, hi = np.percentile(rgb, 2), np.percentile(rgb, 98)
rgb_norm = np.clip((rgb - lo) / (hi - lo + 1e-6), 0, 1)
img = Image.fromarray((rgb_norm * 255).astype(np.uint8))
return self.transform(img), label`,
    shape: 'Target test set: 5,400 tiles over ten classes; model input per tile: (3, 224, 224).',
    output:
      'At λ = 0.1, the reported cross-sensor accuracy gap is 46.81 percentage points. Pasture support is 396; SeaLake support is 609, so macro-F1 complements overall accuracy.',
  },
]

export const vivaQuestions = [
  {
    question: 'What is the cross-sensor domain shift, and what did the experiment test?',
    answer:
      'The model is trained and validated on Sentinel-2 imagery, then tested on Landsat imagery with the same ten land-cover labels but a different sensor and coarser pixels. The experiment measures whether learned features transfer across sensors; it does not claim that every Sentinel-2 tile is scene-matched to a Landsat tile.',
  },
  {
    question: 'Why choose λ = 0.1?',
    answer:
      'It is a measured alignment–performance trade-off, not an accuracy improvement: S2 AMIL increases from 0.5991 to 0.6835, Landsat accuracy changes from 50.43% to 50.19%, and Landsat macro-F1 changes from 49.35% to 49.62%. Larger penalties raise AMIL further but reduce target performance, consistent with context starvation.',
  },
  {
    question: 'Why does 10 m versus 30 m resolution matter?',
    answer:
      'A roughly 640 m Sentinel-2 tile has 64 × 64 pixels; the Landsat tile covers a similar footprint with 22 × 22 pixels—484 versus 4,096 samples, or about an 8.5-fold pixel-count difference. Rivers and highways can be narrower than a Landsat pixel, so their reflectance mixes with surrounding land and weakens boundary cues.',
  },
  {
    question: 'What are the main limitations?',
    answer:
      'NDVI and NDWI are proxies rather than ground-truth annotations, especially for heterogeneous built-up areas. Only ten classes and one target sensor are evaluated; the training subset is limited, and the repository notes that scene-level split alignment has not been verified. Attention alignment is not causal evidence that the model reasons correctly.',
  },
]
