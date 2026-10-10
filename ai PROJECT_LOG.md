# PROJECT LOG: Attention-Guided Cross-Sensor Land Cover Classification

Handoff/status document. Written so any collaborator or AI assistant can resume
without prior chat history. Last updated: 2026-10-10.

- Course: AI2002 Artificial Intelligence, FAST-NUCES Lahore, Semester 5
- Group: F26-06 | Track A (Research & Development) | Instructor: Hajra Waheed | TA: Saad Bin Ather
- Repo: github.com/<username>/<repo> (fill in)

## 1. Project in one paragraph
A ViT trained on Sentinel-2 land-cover imagery (EuroSAT) degrades when tested on
Landsat imagery (EuroSAT-L) of the same 10 classes, likely because it relies on
sensor-specific artifacts. Proposed fix, adapted from the TA's CACR paper
(Clinical Attention Consistency Regularization, chest X-ray): add an
attention-consistency penalty during ViT training that anchors attention to
land-cover-relevant regions, using NDVI (vegetation) and NDWI (water) maps,
computable from the multispectral bands, as proxy supervision (CACR used lesion
bounding boxes).

Planned loss (from CACR): `L_total = L_cls + lambda * L_attn`, `L_attn = 1 - AMIL`,
where AMIL = fraction of attention mass inside the target region. Sweep
lambda in {0, 0.1, 0.5, 1.0, 2.0}; lambda=0 is the isolation control.

## 2. Course-formal phases vs our working phases
| Course phase | Status |
|---|---|
| Phase 1: proposal (problem, dataset, papers, scope), PDF named F26-06.pdf | Done (placeholders: member names, repo link) |
| Phase 2: Data Acquisition & Setup (Track A) | Data done; written deliverable pending (check Classroom for format) |

Our informal Colab work: (A) NDVI/NDWI proxy check, (B) baseline cross-sensor
experiment, (C) data caching/setup. All three are complete. Next is the
attention-regularization implementation.

## 3. Datasets
| | Source domain | Target domain |
|---|---|---|
| Name | EuroSAT | EuroSAT-L |
| Sensor | Sentinel-2, 13 bands | Landsat, 8 bands |
| Patch | 64x64 px @ 10 m | 22x22 px @ 30 m (same ~640 m footprint) |
| Access | HF `blanchon/EuroSAT_MSI` (13-band), `blanchon/EuroSAT_RGB`; Zenodo 7711810 | HF `isaaccorley/eurosat-l` (raw zip), paper arXiv:2506.08780 |
| Size | 27,000 | 27,000 (split lists: 16,200 / 5,400 / 5,400) |

Classes (index order used everywhere, alphabetical folder order):
`0 AnnualCrop, 1 Forest, 2 HerbaceousVegetation, 3 Highway, 4 Industrial, 5 Pasture, 6 PermanentCrop, 7 Residential, 8 River, 9 SeaLake`

### Sentinel-2 specifics
- 13-band order: B01,B02,B03,B04,B05,B06,B07,B08,B08A,B09,B10,B11,B12 (0-indexed Blue=1, Green=2, Red=3, NIR=7).
- NDVI = (B08-B04)/(B08+B04); NDWI (McFeeters) = (B03-B08)/(B03+B08).
- Cached subset keeps only B02,B03,B04,B08 as uint16 (indices [1,2,3,7]).

### Landsat specifics (EuroSAT-L)
- Raw zip: `eurosat-l.zip` -> `eurosat-l/<Class>/<Class>_<id>.tif`.
- 8 bands uint16: indices 0-6 = OLI bands 1-7 (Coastal, Blue, Green, Red, NIR, SWIR1, SWIR2), index 7 = thermal (values ~45000, ignore for RGB).
- RGB = indices [3,2,1] (Red, Green, Blue). NIR = index 4.
- Split lists are separate files at the HF repo root (`eurosat-test.txt` etc.), not in the zip. Entries end `.jpg` but files on disk are `.tif`; same stem. Label = filename stem minus trailing `_<id>`.
- The HF auto-parquet of this repo only exposes a `text` column (filenames), no images. Do not use `load_dataset("isaaccorley/eurosat-l")` for pixels.
- Do NOT use the `landsatbench` pip package: its `LandsatDataModule` raises `AttributeError: no attribute 'dataset_class'`.

### Cached data on Google Drive (`MyDrive/satellite_project/`)
| File | Content |
|---|---|
| `s2_train.npz` | x (7000,64,64,4) uint16 [B02,B03,B04,B08], y (7000,); 700/class from train split |
| `s2_test.npz` | x (2000,64,64,4), y; 200/class from test split |
| `dataset_stats.csv` | class counts per split |
| `eurosat-l.zip`, `eurosat-test.txt` | Landsat data and test split list |

Class counts: S2 train 700 each; S2 test 200 each; Landsat test (5,400 total):
AnnualCrop 596, Forest 608, HerbaceousVegetation 573, Highway 496, Industrial 501,
Pasture 396, PermanentCrop 538, Residential 554, River 529, SeaLake 609.
0 NaNs in cached S2. NDVI max hits 1.0 (some Red=0 no-data pixels): mask/clip these when building targets.

## 4. Experiment A: is NDVI/NDWI a usable proxy signal? (150 imgs/class, streamed from blanchon/EuroSAT_MSI)
Class-level mean NDVI / NDWI:
| Class | NDVI | NDWI |
|---|---|---|
| AnnualCrop | 0.368 | -0.390 |
| Forest | 0.717 | -0.573 |
| HerbaceousVegetation | 0.381 | -0.367 |
| Highway | 0.446 | -0.398 |
| Industrial | 0.232 | -0.213 |
| Pasture | 0.654 | -0.548 |
| PermanentCrop | 0.380 | -0.386 |
| Residential | 0.351 | -0.323 |
| River | 0.331 | -0.206 |
| SeaLake | -0.237 | 0.451 |

ANOVA p ~ 0 for both (F=560 NDVI, F=998 NDWI), but with n=150/class that is weak
evidence on its own.

Findings:
- Only Forest, Pasture (high NDVI) and SeaLake (water) separate cleanly at whole-image-mean level. The other 7 classes overlap heavily in NDVI 0.23-0.45.
- Cause: 640 m patches are dominated by background vegetation (a river or road is a thin strip).
- Pixel-level heatmaps (3 samples each, Highway/River/Residential) reversed part of this: River NDWI traces the channel sharply (usable); Highway shows the road as a low-NDVI band (partial); Residential is flat/textured with no clean structure (genuinely weak). Industrial likely similar to Residential (not yet checked at pixel level).
- Conclusion: the proxy works at pixel level for water/roads/vegetation; dense built-up texture is the honest limitation for the failure analysis.

## 5. Experiment B: baseline cross-sensor degradation
Setup:
- Models: ResNet-50 (torchvision IMAGENET1K_V2), ViT-B/16 (torchvision IMAGENET1K_V1). DenseNet-121 dropped for compute (optional extension).
- Frozen backbone, new linear head only (linear probing). Adam lr 1e-3, 5 epochs, batch 64.
- Train: 700/class subset of `blanchon/EuroSAT_RGB` train split. Sentinel-2 test: full 5,400 test split of the same dataset.
- Input: resize to 224, ImageNet mean/std normalization.
- Landsat input: RGB from indices [3,2,1], per-image contrast stretch (2nd/98th percentile computed over all 3 channels together), uint8, then same transform as Sentinel-2. Test = 5,400 images from `eurosat-test.txt`.

Results (accuracy):
| Model | Sentinel-2 | Landsat | Drop |
|---|---|---|---|
| ResNet-50 | 91.56% | 19.76% | -71.8 pts |
| ViT-B/16 | 95.13% | 51.30% | -43.8 pts |

Notes:
- A first Landsat attempt using literal USGS reflectance scaling (`DN*0.0000275-0.2`, then *255) gave 12.4% / 16.4%. Images were nearly black (reflectance 0.04-0.26 mapped to 10-65/255). The contrast stretch fixed it. Treat stretch choice as a preprocessing variable worth documenting.
- Visual check of Landsat samples: real structure visible, strong green bias, SeaLake sample showed no visible water (coarser resolution dilutes small water bodies).
- Interpretation: cross-sensor drop confirmed; ViT retains far more than ResNet, which supports building the fix on ViT.

## 6. Key decisions and known caveats
- Scope cut for compute (free Colab T4, no local GPU): 2 models, ~7,000-image training subset, linear probing for baselines. State as limitations in the report.
- Baselines (Experiment B) used the RGB dataset; Phase 3 needs NIR, so it must use the cached 4-band npz. Re-derive RGB from the npz (bands [2,1,0] of the cache = R,G,B) so images and NDVI/NDWI masks are the same patches. Baseline numbers may need re-running on the npz pipeline for a consistent comparison.
- Sentinel-2 test sets differ: baselines used the full 5,400 RGB test split; the cached npz test is a 2,000-image subset. Use one consistently when comparing.
- Split alignment is unverified: `blanchon` splits and the EuroSAT-L split lists may not match. Same patch IDs could appear in Sentinel-2 train and Landsat test. Verify by comparing filenames, or build both from one split.
- Methodological nuance (state in report): in CACR the lesion-annotated data was external, so the lambda=0 control isolated the data from the penalty. Here NDVI/NDWI come from bands already in EuroSAT, so lambda=0 isolates computing-but-not-using the signal, not data availability. Do not overclaim.
- Landsat test is class-imbalanced (396-609); report per-class or macro metrics, not only overall accuracy.
- Attention is a feature-consistency constraint, not a causal explanation (as in CACR).

## 7. Open design decisions (Phase 3, not yet made)
- Class-to-mask mapping: which index defines the "relevant region" per class (NDVI high for vegetation classes, NDWI high for SeaLake/River, undefined/weak for built-up). Options: per-class mapping, or a combined mask.
- Attention source: attention rollout (CACR) vs last-layer attention; patch grid 14x14 at 224 input; masks need pooling to the patch grid.
- Training regime: CACR used two stages (pretrain with penalty, fine-tune without). Here likely single-stage fine-tuning with penalty on Sentinel-2. The penalty needs gradients through attention, so the backbone cannot stay frozen as in the baselines (heavier compute, likely multiple Colab sessions).
- Metrics: cross-sensor accuracy (and AUROC if feasible), IoU and AMIL vs NDVI/NDWI masks, per-class failure analysis, attention-map figures (baseline vs regularized).

## 8. How to resume (Colab)
Do not "Run all": it retrains models. Fresh-runtime order:
1. `pip install datasets pandas matplotlib scipy numpy rasterio`
2. Mount Drive; `SAVE = "/content/drive/MyDrive/satellite_project"`
3. Load cache: `d = np.load(f"{SAVE}/s2_train.npz"); x, y = d["x"], d["y"]`
4. Landsat: copy `eurosat-l.zip` and `eurosat-test.txt` from `SAVE` to local disk, unzip.
5. Run experiments.

Free-tier limits: ~12 h sessions, idle disconnects, informal GPU quota. Fallback: Kaggle notebooks (~30 GPU-h/week). Save checkpoints to Drive every epoch.

## 9. Reference papers
- Ather, Waheed, Abbas, Khan. Clinical Attention Consistency Regularization for Cross-domain Generalization in Chest X-Ray Diagnosis (methodological template, TA's paper).
- Helber et al. 2019, EuroSAT, arXiv:1709.00029
- Landsat-Bench, arXiv:2506.08780
- Dosovitskiy et al. 2021, ViT, arXiv:2010.11929
- He et al. 2016, ResNet, arXiv:1512.03385

## 10. Notes for AI assistants picking this up
- Verified (ran in Colab): sections 3 to 5, including every number listed.
- Not yet verified: split alignment, Industrial pixel-level behavior, anything in section 7.
- User prefers dense bullet answers, minimal code comments, files over inline text, and flags of risk before building on a step.
- User is a 5th-semester student: explain ML concepts simply, standard PyTorch is fine.
