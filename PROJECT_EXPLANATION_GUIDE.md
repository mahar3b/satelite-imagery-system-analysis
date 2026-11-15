# PROJECT EXPLANATION & VIVA PREPARATION GUIDE
## Group F26-06 | Attention-Guided Cross-Sensor Land Cover Classification
**Course:** AI2002 Artificial Intelligence, FAST-NUCES Lahore  
**Instructors:** Dr. Hajra Waheed & TA Saad Bin Ather  
**Project Track:** Track A (Research & Development)  
**Team Members:** Mahareb Ammar (24L-2540), Hamza Baqir (24L-2505), Ali Naveed (24L-2579)

---

## 1. THE 30-SECOND ELEVATOR PITCH
> *"Our project tackles cross-sensor domain shift in satellite AI. When a Vision Transformer is trained on sharp 10-meter Sentinel-2 images, its accuracy drops when tested on 30-meter Landsat images because it latches onto camera noise and resolution artifacts. We adapted the CACR framework (originally created for chest X-rays by our TA Saad Bin Ather and Dr. Hajra Waheed) to satellite imagery. Instead of costly manual doctor boxes, we used physical light formulas (NDVI for vegetation and NDWI for water) to penalize the AI whenever its attention wanders outside real ground features. While standard CNNs collapsed by 71.8%, our regularized Vision Transformer maintained 50.2% accuracy and 49.6% Macro-F1, while uncovering a key scientific discovery: the 'Context-Starvation' trade-off, where mild regularization (λ = 0.1) provides the sweet spot between attention grounding and environmental context."*

---

## 2. THE STORY BEHIND OUR PROJECT (The CACR Connection)
### Why did we choose this project?
In healthcare AI, Dr. Hajra Waheed and TA Saad Bin Ather published a paper called **CACR (Clinical Attention Consistency Regularization)**. They showed that AI diagnosing chest X-rays often "cheats" by looking at hospital scanner marks and metal hospital tags rather than actual pneumonia in the lungs. When tested on a new hospital, the model failed. They fixed this by penalizing the model's attention if it looked outside pneumonia bounding boxes.

### How did we connect this to Satellite Imaging?
We realized **the exact same problem happens in space**! 
When an AI looks at European Space Agency **Sentinel-2** satellite pictures, it learns shortcuts tied to Sentinel-2's sharp 10-meter sensors. When tested on NASA/USGS **Landsat** pictures of the exact same 10 land classes, it fails because Landsat is 30-meter resolution (9x more pixelated) with different lighting and sensors.

### The Big Difference Between Our Work and CACR:
- **In CACR:** Radiologists had to manually draw bounding boxes around pneumonia for thousands of patients (very expensive and slow).
- **In Our Work:** Satellite photos cover huge areas where manual boxes don't exist. So, we automated supervision using **physical light physics**:
  - Healthy plants reflect Near-Infrared light and absorb Red light $\to$ **NDVI formula**.
  - Water absorbs Near-Infrared and reflects Green light $\to$ **NDWI formula**.
  - This gave us **free, automatic, physically invariant ground truth masks**!

---

## 3. CORE CONCEPTS EXPLAINED IN SIMPLE TERMS

### A. What is "Domain Shift"?
Imagine training face recognition only on high-end iPhone 15 Pro selfies in studio lighting. If you test it on blurry Android security cameras in dim light, it fails. That gap in camera hardware, lighting, and resolution is **Domain Shift**. Here, Sentinel-2 is the source domain, and Landsat is the target domain.

### B. What is "Ground Sampling Distance" (GSD)?
- **Sentinel-2:** 10 meters per pixel. A 640m × 640m area is a sharp **64×64 pixel image** (4,096 pixels).
- **Landsat:** 30 meters per pixel. That exact same 640m × 640m area is only a **22×22 pixel image** (484 pixels).
- That means Landsat has **9 times fewer pixels**! A narrow 15-meter river or highway is smaller than a single Landsat pixel, so it gets blurred into surrounding grass and soil.

### C. What is AMIL (Attention Mass Inside Land-cover)?
In a Vision Transformer, the model puts "attention weights" (eyeballs) across the 196 image patches. The weights add up to 1.0 (or 100%).
**AMIL** is simply: *What fraction of the model's attention is inside the real target ground mask?*
- If AMIL is 0.40, only 40% of attention is on the real trees/water, and 60% is looking at random sensor noise.
- When we applied our penalty, AMIL rose to **0.922 (92.2%)**, proving the model was successfully forced to look at the ground features!

### D. What is the "Context Starvation" Discovery?
This is our biggest scientific finding:
- In chest X-rays, pneumonia is a localized spot. Tighter attention is almost always better.
- In satellite photos, **land cover requires surrounding context!** 
  - How do you know a thin blue line is a river? Because it has riverbanks on both sides!
  - How do you know a grey line is a highway? Because it has road shoulders and interchanges!
- When we penalized the AI too heavily (λ = 1.0 or 2.0), the model developed **tunnel vision** (attention collapsed to single pixels). It lost the surrounding riverbanks and roadsides, so Landsat accuracy dropped from 50.4% down to 46.3%.
- **Conclusion:** A gentle nudge (**λ = 0.1**) is the sweet spot. It boosted attention alignment by 10% without starving the AI of context.

### E. Why did we have an "Isolation Control" (λ = 0)?
Whenever you introduce a new loss function alongside extra multispectral data (NIR bands), someone might ask: *"Did your model improve because of the loss function, or just because you gave it extra data?"*
To prove it, we ran **λ = 0**. This model had the exact same data, exact same resolution, and exact same training time, but zero attention penalty. Any change when λ > 0 is strictly proven to come from the attention penalty!

---

## 4. PHASE-BY-PHASE TIMELINE (WHAT WE DID, WHEN, AND HOW)

| Phase | Milestone | What We Did & Key Result |
|---|---|---|
| **Phase 1** | **Proposal & Proxy Verification** | Streamed 150 images/class from Hugging Face EuroSAT. Ran ANOVA tests confirming that NDVI (F=560) and NDWI (F=998) strongly separate vegetation and water. |
| **Phase 2** | **Data Setup & Baseline Failure** | Downloaded Landsat EuroSAT-L. Solved the pitch-black raw image bug with 2%-98% contrast stretching. Trained ResNet-50 and ViT-B/16 baselines. **Proved the problem is real:** ResNet dropped by 71.8% (down to 19.8%), while ViT dropped by 43.8% (to 51.3%). Cached 7,000 train and 2,000 test multispectral tiles to Google Drive. |
| **Phase 3** | **Model Building & Lambda Sweep** | Created `ViTWithAttention`. Engineered a PyTorch hook on block 12 to unlock attention weights. Implemented AMIL loss. Swept λ ∈ {0, 0.1, 0.5, 1.0, 2.0} on Colab T4 GPU. Discovered AMIL monotonic rise (0.599 to 0.922) and the Context Starvation trade-off. |
| **Phase 4** | **Evaluation & Fairness Audit** | Evaluated Macro F1, Precision, Recall across all 10 classes. Plotted normalized confusion matrices. Analyzed 3 failure clusters (vegetation mixing, narrow river blur, asphalt vs shingles). Completed fairness audit on class imbalance (396 to 609 support) and 10m vs 30m resolution bias. |
| **Phase 5** | **Final Synthesis & Deliverables** | Synthesized the complete IEEE-style technical paper (`F26-06.docx` / `F26-06.pdf`), verified notebook reproducibility, and created this defense guide. |

---

## 5. HIGH-LEVEL CODE WALKTHROUGH (`satelite_system.ipynb`)

You do not need to memorize every line of code. Just know what the 6 major blocks do:

### Part 1: Dataset Loader & Mask Generator (Phase 3 Cells 1 & 4)
- Loads cached `.npz` files (7,000 train, 2,000 test) from Google Drive.
- `compute_proxy_target_mask`: Takes Sentinel-2 bands [Blue, Green, Red, NIR] and calculates NDVI and NDWI. If it's a river or lake, it thresholds NDWI > 0; if it's forest or crops, NDVI > 0.38; if it's highway or buildings, NDVI < 0.25. Downsamples the 64×64 mask to a 14×14 grid (196 tokens).
- `LandsatEuroSATDataset`: Reads raw Landsat 8-band `.tif` files, extracts RGB bands, applies 2%-98% percentile contrast stretching so images aren't black, and resizes to 224×224.

### Part 2: Custom ViT Model with Attention Hook (Phase 3 Cell 2)
- Takes pretrained `models.vit_b_16(weights='IMAGENET1K_V1')`.
- Replaces the final classifier head with a 10-class linear layer.
- **The Hook:** PyTorch's native ViT sets `need_weights=False` to run fast. We override block 12's forward pass with `need_weights=True` so it outputs the `(Batch, 197, 197)` attention matrix. We grab row 0 (the `[CLS]` token) across the 196 patches.

### Part 3: The AMIL Loss Function (Phase 3 Cell 2)
- Multiplies the `[CLS]` attention weights by the binary proxy mask.
- Sums the attention inside the mask: $\text{AMIL} = \sum A_i \cdot M_i$.
- Returns $\mathcal{L}_{\text{attn}} = 1 - \text{AMIL}$.

### Part 4: The Training Engine (Phase 3 Cell 3)
- Unfreezes the classifier head ($lr = 10^{-3}$) and the last two transformer blocks ($lr = 5 \times 10^{-5}$).
- Uses **AdamW** optimizer and **Automatic Mixed Precision (AMP)** to run fast on the Colab T4 GPU (~75 seconds per 5-epoch run).
- Minimizes $\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{cls}} + \lambda \mathcal{L}_{\text{attn}}$.

### Part 5: Multi-Metric Evaluation Engine (Phase 4 Cell 1)
- Evaluates the model on test sets without computing gradients (`@torch.no_grad()`).
- Computes Overall Accuracy, Macro F1, Weighted F1, Per-class Precision/Recall/F1, and normalized Confusion Matrices.

### Part 6: Visualization Generators (Phase 4 Cells 4, 5, 6)
- Plots the Side-by-Side Confusion Matrices (Baseline vs Regularized).
- Plots the Support Count vs F1 trendline (class imbalance check) and the 10m vs 30m resolution bar chart.
- Extracts and plots actual misclassified Landsat image tiles with AI confidence.

---

## 6. KEY NUMBERS YOU SHOULD MEMORIZE

1. **The Cross-Sensor Drop:**
   - ResNet-50 dropped **71.8%** (from 91.6% down to 19.8% on Landsat).
   - ViT-B/16 dropped **46.6%** (from 97.1% down to 50.4% on Landsat).
   - ViT beat ResNet by **+30.7% accuracy** on the new satellite!
2. **Attention Alignment (AMIL):**
   - Rose monotonically from **59.9% (at λ=0) up to 92.2% (at λ=2.0)**.
3. **The Best Regularizer:**
   - **λ = 0.1** gave the highest Landsat Macro-F1 (**49.62%**), boosting attention alignment by nearly 10% without triggering context starvation.
4. **Resolution Difference:**
   - Sentinel-2: 10m GSD (64×64 px = 4,096 px).
   - Landsat: 30m GSD (22×22 px = 484 px). A **9-fold drop in pixel density**!
5. **Easiest vs Hardest Classes on Landsat:**
   - **Easiest:** Forest (84.2% F1) and SeaLake (77.8% F1) because they cover huge continuous areas.
   - **Hardest:** Pasture (35.2% F1), River (40.1% F1), and Highway (41.5% F1) because thin shapes get blurred at 30 meters.

---

## 7. TOP 12 VIVA / ORAL DEFENSE QUESTIONS & WINNING ANSWERS

### Q1: Why did you adapt the CACR paper to satellite imagery?
**Answer:** *"In our course, Dr. Hajra and Sir Saad showed that in medical X-rays, models latch onto hospital-specific scanner artifacts rather than true disease patterns. We realized that Earth Observation has the exact same shortcut learning problem: satellite models latch onto sensor-specific resolution and optical noise instead of true land cover. We adapted CACR to space by replacing manual lesion boxes with automated physical multispectral formulas (NDVI and NDWI)."*

### Q2: Why did ResNet-50 fail so badly (19.8%) compared to ViT-B/16 (50.4%)?
**Answer:** *"ResNet uses fixed, local 3×3 convolutional filters. It relies heavily on high-frequency edge textures and sharp pixel transitions. When we moved from 10m Sentinel-2 to blurry 30m Landsat (a 9x pixel drop), those local edge textures vanished, causing ResNet to collapse to near-random guessing. In contrast, Vision Transformers use global multi-head self-attention across the whole image, allowing them to dynamically weight spatial relationships and preserve high-level semantic meaning."*

### Q3: What is AMIL and why is it differentiable?
**Answer:** *"AMIL stands for Attention Mass Inside Land-cover. It is the dot product between the [CLS] token's softmax attention weights across the 196 patch tokens and our binary proxy mask M. Because softmax attention is continuous and differentiable, minimizing (1 - AMIL) directly sends backpropagation gradients into the Key and Query projection matrices of the transformer encoder."*

### Q4: Why did you use an isolation control (λ = 0)?
**Answer:** *"Because in Phase 3, we introduced 4-band multispectral data to calculate NDVI/NDWI. If we only compared against standard RGB ViT, a reviewer could argue that any gain came from the extra multispectral data rather than our attention loss. Running λ = 0 used the exact same multispectral data and training schedule with zero penalty, scientifically proving that improvements at λ = 0.1 are strictly caused by attention regularization."*

### Q5: Why did Landsat accuracy decrease when you pushed λ to 1.0 and 2.0?
**Answer:** *"This is our central theoretical insight: the Context-Starvation trade-off. In chest X-rays, pneumonia is an isolated focal spot, so tighter attention is almost always better. But in satellite imaging, land cover requires surrounding context: a river is identified by its riverbanks, and a highway is identified by road shoulders and interchanges. High λ forced attention to collapse onto single pixels, starving the classifier of surrounding context. λ = 0.1 was the optimal balance."*

### Q6: Why did you unfreeze the last 2 encoder blocks instead of just the classification head?
**Answer:** *"If the transformer backbone is completely frozen, the attention weights are static constants with respect to trainable parameters. The attention loss (1 - AMIL) would produce zero gradients! By unfreezing the last 2 encoder blocks with a gentle learning rate (5e-5), the query and key projection layers were able to adapt and steer attention without destroying pretrained feature representations."*

### Q7: Why did you report Macro F1 instead of just Overall Accuracy?
**Answer:** *"In Landsat EuroSAT-L, the test set is imbalanced: Sea/Lake has 609 images while Pasture only has 396. Overall accuracy overweights easy majority classes like Forest and SeaLake, giving an artificially rosy picture (+1.08% higher). Macro F1 calculates F1 for each class independently and averages them equally, ensuring minority classes like Pasture are held to the same standard."*

### Q8: Why was Pasture the worst performing class (35.2% F1)?
**Answer:** *"Pasture suffered from intra-vegetation spectral mixing. In Landsat's 30-meter resolution, a single pixel covers 900 square meters, blending grass blades, bare soil, and weeds together into a single reflectance value. 38% of mistaken pastures were predicted as HerbaceousVegetation (wild grass) and 24% as AnnualCrop. Without sharp 10m field boundaries, the AI cannot distinguish grazing pasture from wild grasslands."*

### Q9: What was the pitch-black image problem and how did you solve it?
**Answer:** *"When we first loaded raw Landsat uint16 GeoTIFFs using USGS reflectance formulas, the reflectance values (0.04 to 0.26) mapped to tiny numbers (10 to 65 out of 255), making photos look almost black, and the model scored only 12%. We engineered a dynamic 2%–98% percentile min-max contrast stretch that expanded the dynamic range across RGB channels, restoring normal contrast and raising baseline accuracy to over 50%."*

### Q10: Why didn't you use manual bounding boxes like the CACR paper?
**Answer:** *"Manual bounding boxes in remote sensing are practically impossible to obtain at scale—EuroSAT contains 27,000 tiles. Furthermore, land cover is continuous (e.g., a forest or lake has irregular organic borders, not rectangles). Using NDVI and NDWI formulas allowed us to generate continuous, physically grounded ground truth masks automatically with zero manual labor."*

### Q11: What is the fairness audit you conducted?
**Answer:** *"We audited two dimensions of fairness:
1. Class Imbalance: We plotted test support vs. F1-score and found a flat trendline (slope -0.007), proving our model does not discriminate against classes simply because they have fewer samples.
2. Resolution Bias: We showed that the 9x drop in pixel density creates a structural resolution bias that penalizes narrow linear objects (Highways and Rivers) while leaving large areal objects (Forests) unaffected."*

### Q12: What would you do next if you had more time (Future Work)?
**Answer:** *"Two things:
1. Soft-margin attention loss: Instead of a hard penalty outside the mask, use a Gaussian blur or soft margin around the proxy mask to explicitly protect surrounding context (riverbanks and road shoulders) and prevent context starvation.
2. Multi-sensor extension: Test on commercial ultra-high-resolution satellites like PlanetScope (3m) and coarser sensors like MODIS (250m)."*
