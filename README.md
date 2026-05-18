# Book Average Rating Prediction

A supervised regression project that predicts the average reader rating of books (0–5 scale) using classical machine learning techniques and Scikit-learn.

---

## Dataset

**Source:** Goodreads Books (`books.csv`)

| Property | Value |
|---|---|
| Raw rows | 11,123 |
| Cleaned rows | 11,119 |
| Raw columns | 12 |
| Target variable | `average_rating` (mean: 3.93, std: 0.35) |

### Raw Features

| Column | Type | Description |
|---|---|---|
| `bookID` | int | Unique identifier |
| `title` | str | Book title (used for series detection) |
| `authors` | str | Author(s) separated by `/` |
| `average_rating` | float | **Target** — mean reader rating |
| `isbn` / `isbn13` | str | ISBN identifiers |
| `language_code` | str | 27 unique language codes |
| `num_pages` | int | Page count |
| `ratings_count` | int | Total ratings received |
| `text_reviews_count` | int | Written reviews count |
| `publication_date` | str | `M/D/YYYY` format |
| `publisher` | str | Publisher name (2,289 unique) |

---

## Project Pipeline

```
Data Loading → Cleaning → EDA → Feature Engineering → Preprocessing → Model Comparison → Hyperparameter Tuning → Final Evaluation
```

### 1. Data Cleaning
- Drop rows where `average_rating == 0` or `num_pages == 0`
- Parse and validate publication dates; keep years in [1800, 2026]
- Merge English language variants (`eng`, `en-US`, `en-GB`, `en-CA`)
- Remove duplicate rows

### 2. Exploratory Data Analysis
- Target distribution (histogram, boxplot, QQ-plot)
- Correlation analysis (Pearson)
- Log-transformations of skewed engagement features
- Language & publisher distributions
- Rating trends over time
- Series vs. stand-alone book comparison

### 3. Feature Engineering (19 new features)

| Group | Features |
|---|---|
| Temporal | `publication_year`, `book_age`, `era` |
| Language | `is_english`, `language_group` |
| Author | `author_count`, `is_multi_author` |
| Series | `is_series`, `series_number`, `is_late_series` |
| Engagement | `log_ratings`, `log_text_reviews`, `review_ratio`, `log_review_ratio`, `pop_x_rating`, `popularity_tier` |
| Quality | `bayesian_rating` |
| Size | `log_pages`, `page_bucket` |
| Publisher | `is_top_publisher`, `publisher_avg_rating` |

### 4. Preprocessing Pipeline
- **Numeric:** `SimpleImputer` (median) → `RobustScaler`
- **Categorical:** `OneHotEncoder`
- Built with `sklearn.pipeline.Pipeline` + `ColumnTransformer`

### 5. Model Comparison (14 models, 5-fold CV)

| Category | Models |
|---|---|
| Linear | Linear Regression, Ridge, Lasso, ElasticNet, HuberRegressor |
| Tree-Based | Decision Tree, Random Forest, Extra Trees, Bagging, Gradient Boosting, AdaBoost, HistGradientBoosting |
| Other | KNN (k=10), SVR (RBF kernel) |

**Evaluation metrics:** RMSE, MAE, R², MAPE

### 6. Hyperparameter Tuning
`RandomizedSearchCV` applied to the top 3 models from cross-validation.

**Best model — HistGradientBoosting:**

| Parameter | Value |
|---|---|
| `l2_regularization` | 0.84 |
| `learning_rate` | 0.058 |
| `max_depth` | 8 |
| `max_iter` | 548 |
| `min_samples_leaf` | 12 |

---

## Tech Stack

| Category | Libraries |
|---|---|
| Data processing | `pandas`, `numpy` |
| Visualization | `matplotlib`, `seaborn` |
| Statistics | `scipy.stats` |
| Machine learning | `scikit-learn` |
| Utilities | `re`, `warnings` |

> **Constraint:** Scikit-learn models only — no deep learning frameworks.

---

## Files

```
Project/
├── book_ranking_prediction.ipynb   # Main notebook (79 cells)
└── books.csv                       # Goodreads dataset (11,119 rows)
```

---

## How to Run

1. Install dependencies:
   ```bash
   pip install pandas numpy matplotlib seaborn scipy scikit-learn jupyter
   ```

2. Launch the notebook:
   ```bash
   jupyter notebook book_ranking_prediction.ipynb
   ```

3. Run all cells in order (top → bottom).

---

## Context

This project was developed as part of the **Machine Learning with Python** course at DSTI (Data Science Tech Institute). It demonstrates end-to-end ML workflow best practices: data cleaning, exploratory analysis, feature engineering, systematic model benchmarking, and hyperparameter optimization.
