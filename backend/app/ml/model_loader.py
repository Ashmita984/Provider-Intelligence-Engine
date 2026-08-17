import os
import joblib
from pathlib import Path
from ..core.config import settings

class ModelLoader:
    def __init__(self):
        self.models_dir = settings.MODEL_DIR

    def find_model_path(self, filename: str) -> str:
        paths_to_check = [
            self.models_dir / filename,
            Path("backend/app/ml/models") / filename,
            Path("backend") / filename,
            Path(filename),
            Path("..") / filename,
        ]
        for path in paths_to_check:
            if path.exists():
                return str(path)
        return None

    def load_pickle(self, filename: str):
        path = self.find_model_path(filename)
        if path:
            return joblib.load(path)
        print(f"Warning: Model file '{filename}' not found.")
        return None

model_loader = ModelLoader()
