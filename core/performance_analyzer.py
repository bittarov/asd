"""
Performance Analysis Module
Provides comprehensive evaluation and comparison metrics
"""
import numpy as np
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier


class PerformanceAnalyzer:
    """
    Analyzes and compares feature selection performance
    Generates detailed metrics for visualization
    """
    
    def __init__(self, X, y):
        """
        Initialize analyzer with dataset
        
        Args:
            X: Feature matrix
            y: Target vector
        """
        self.X = X
        self.y = y
        self.n_features = X.shape[1]
    
    def evaluate_feature_set(self, selected_features):
        """
        Evaluate a specific feature subset
        
        Args:
            selected_features: List of feature indices
            
        Returns:
            Dictionary with accuracy metrics
        """
        if len(selected_features) == 0:
            return {'accuracy': 0.0, 'std': 0.0}
        
        X_selected = self.X[:, selected_features]
        
        try:
            skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            model = RandomForestClassifier(n_estimators=30, random_state=42, n_jobs=1)
            scores = cross_val_score(model, X_selected, self.y, cv=skf, 
                                    scoring='accuracy', n_jobs=1)
            
            return {
                'accuracy': float(scores.mean()),
                'std': float(scores.std()),
                'min': float(scores.min()),
                'max': float(scores.max())
            }
        except:
            return {'accuracy': 0.0, 'std': 0.0, 'min': 0.0, 'max': 0.0}
    
    def generate_comparison_data(self, genetic_results):
        """
        Generate comprehensive comparison statistics
        
        Args:
            genetic_results: Results from genetic optimizer
            
        Returns:
            Dictionary with comparison metrics
        """
        feature_count = genetic_results['feature_count']
        total_features = self.n_features
        
        # Calculate efficiency metrics
        reduction_rate = (1 - feature_count / total_features) * 100
        efficiency_score = genetic_results['accuracy'] / (feature_count / total_features)
        
        # Generate performance summary
        return {
            'total_features': int(total_features),
            'selected_features': int(feature_count),
            'reduction_percentage': float(reduction_rate),
            'accuracy': float(genetic_results['accuracy']),
            'efficiency_score': float(efficiency_score),
            'fitness_score': float(genetic_results['fitness_score'])
        }
    
    def generate_evolution_analysis(self, history):
        """
        Analyze evolution progress for visualization
        
        Args:
            history: Evolution history from genetic optimizer
            
        Returns:
            Processed data for charts
        """
        generations = [h['generation'] for h in history]
        best_fitness = [h['best_fitness'] for h in history]
        avg_fitness = [h['avg_fitness'] for h in history]
        best_accuracy = [h['best_accuracy'] for h in history]
        avg_accuracy = [h['avg_accuracy'] for h in history]
        feature_counts = [h['feature_count'] for h in history]
        diversity = [h['diversity'] for h in history]
        mutation_rates = [h['mutation_rate'] for h in history]
        
        return {
            'generations': generations,
            'best_fitness': best_fitness,
            'avg_fitness': avg_fitness,
            'best_accuracy': best_accuracy,
            'avg_accuracy': avg_accuracy,
            'feature_counts': feature_counts,
            'diversity': diversity,
            'mutation_rates': mutation_rates
        }
    
    def calculate_feature_importance_estimation(self, selected_features):
        """
        Estimate relative importance of selected features
        Using quick Random Forest importance
        
        Args:
            selected_features: List of selected feature indices
            
        Returns:
            List of importance scores
        """
        if len(selected_features) == 0:
            return []
        
        X_selected = self.X[:, selected_features]
        
        try:
            model = RandomForestClassifier(n_estimators=30, random_state=42, n_jobs=1)
            model.fit(X_selected, self.y)
            importances = model.feature_importances_
            
            # Normalize to percentage
            importance_percentages = (importances / importances.sum() * 100).tolist()
            
            return importance_percentages
        except:
            return [100.0 / len(selected_features)] * len(selected_features)

