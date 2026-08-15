import pandas as pd
import numpy as np
import joblib

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix
)

def main():
    print("=" * 70)
    print("STEP 1: Loading Preprocessed Data (X_train, X_test, y_train, y_test)")
    print("=" * 70)
    
    X_train = pd.read_csv("X_train.csv")
    X_test = pd.read_csv("X_test.csv")
    y_train_df = pd.read_csv("y_train.csv")
    y_test_df = pd.read_csv("y_test.csv")
    
    y_train = y_train_df.values.ravel()
    y_test = y_test_df.values.ravel()
    
    print(f"X_train shape: {X_train.shape}")
    print(f"X_test shape:  {X_test.shape}")
    print(f"y_train shape: {y_train.shape}")
    print(f"y_test shape:  {y_test.shape}")
    
    # Calculate scale_pos_weight for XGBoost
    num_neg = (y_train == 0).sum()
    num_pos = (y_train == 1).sum()
    scale_pos_weight = num_neg / num_pos
    print(f"\nClass balance in y_train: Count(0)={num_neg}, Count(1)={num_pos}")
    print(f"Computed scale_pos_weight for XGBoost: {scale_pos_weight:.6f}")
    
    # Define models
    models = {
        "Logistic Regression": LogisticRegression(class_weight='balanced', max_iter=2000, random_state=42),
        "Decision Tree": DecisionTreeClassifier(class_weight='balanced', random_state=42, max_depth=10),
        "Random Forest": RandomForestClassifier(class_weight='balanced', random_state=42, n_estimators=200),
        "XGBoost": XGBClassifier(random_state=42, scale_pos_weight=scale_pos_weight)
    }
    
    filename_map = {
        "Logistic Regression": "logistic_regression.pkl",
        "Decision Tree": "decision_tree.pkl",
        "Random Forest": "random_forest.pkl",
        "XGBoost": "xgboost.pkl"
    }
    
    results = {}
    
    print("\n" + "=" * 70)
    print("STEP 2: Training Models & Evaluating Performance on Test Set")
    print("=" * 70)
    
    for name, model in models.items():
        print(f"\n--- Training {name} ---")
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        
        if hasattr(model, "predict_proba"):
            y_prob = model.predict_proba(X_test)[:, 1]
        elif hasattr(model, "decision_function"):
            y_prob = model.decision_function(X_test)
        else:
            y_prob = y_pred
            
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred)
        
        results[name] = {
            "Accuracy": acc,
            "Precision": prec,
            "Recall": rec,
            "F1": f1,
            "ROC-AUC": auc
        }
        
        print(f"Accuracy:  {acc:.4f}")
        print(f"Precision: {prec:.4f}")
        print(f"Recall:    {rec:.4f}")
        print(f"F1-score:  {f1:.4f}")
        print(f"ROC-AUC:   {auc:.4f}")
        print("Confusion Matrix:")
        print(cm)
        
        # Save model pkl
        save_path = filename_map[name]
        joblib.dump(model, save_path)
        print(f"Saved model to '{save_path}'")
        
    print("\n" + "=" * 70)
    print("STEP 3: Side-by-Side Model Comparison Summary Table")
    print("=" * 70)
    summary_df = pd.DataFrame(results).T
    summary_df = summary_df[["Accuracy", "Precision", "Recall", "F1", "ROC-AUC"]]
    print(summary_df.to_string())
    
    # Identify best model by Recall
    best_model_by_recall = summary_df["Recall"].idxmax()
    best_recall_score = summary_df.loc[best_model_by_recall, "Recall"]
    
    print("\n" + "=" * 70)
    print(f"BEST MODEL BY RECALL: {best_model_by_recall} (Recall = {best_recall_score:.4f})")
    print("=" * 70)

if __name__ == '__main__':
    main()
