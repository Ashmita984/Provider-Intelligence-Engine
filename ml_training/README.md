# ML Training Scripts

Scripts used to train, evaluate, and export the machine learning models used by the backend API.

> **Note**: These scripts are for **offline training only** — the backend loads pre-trained `.pkl` models from `backend/app/ml/models/` at runtime.

## Scripts

| Script | Purpose |
|--------|---------|
| `prepare_split.py` | Prepares train/test splits from the raw decision dataset |
| `train_classifiers.py` | Trains access-gap classifiers (Logistic Regression, Decision Tree, Random Forest, XGBoost) |
| `train_anomaly.py` | Trains Isolation Forest anomaly detector on supply data |
| `train_anomaly_ratio.py` | Trains anomaly detector using supply/demand ratio features |
| `run_clustering.py` | Runs KMeans clustering on geographic areas |
| `split_anomaly_direction.py` | Analyzes anomaly direction (shortage vs surplus) |
| `geospatial_analysis.py` | Computes geospatial distances between providers and service areas |

## How to Run

```bash
# From the project root
cd ml_training

# 1. Prepare data splits
python prepare_split.py

# 2. Train classifiers
python train_classifiers.py

# 3. Train anomaly detectors
python train_anomaly.py
python train_anomaly_ratio.py

# 4. Run clustering
python run_clustering.py
```

Trained models are saved as `.pkl` files. Copy them to `backend/app/ml/models/` for the API to use.

## Data Dependencies

- Input data: `../data/raw/` and `../data/processed/`
- Train/test splits: `../data/splits/`
