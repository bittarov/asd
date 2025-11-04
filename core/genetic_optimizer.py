"""
Advanced Genetic Algorithm for Feature Selection
Enhanced with adaptive mutation, elitism, and multi-objective optimization
"""
import numpy as np
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import random


class GeneticFeatureOptimizer:
    """
    Enhanced Genetic Algorithm with advanced evolutionary strategies
    - Adaptive mutation rate based on population diversity
    - Tournament selection with crowding distance
    - Multi-objective optimization (accuracy vs feature count)
    - Enhanced elitism strategy
    """
    
    def __init__(self, X, y, population_size=60, generations=50, 
                 initial_mutation_rate=0.15, crossover_rate=0.85, 
                 elite_size=0.1, tournament_size=5):
        """
        Initialize the genetic optimizer with enhanced parameters
        
        Args:
            X: Feature matrix
            y: Target vector
            population_size: Population size (larger for better exploration)
            generations: Number of evolution cycles
            initial_mutation_rate: Starting mutation probability
            crossover_rate: Crossover probability
            elite_size: Percentage of top individuals to preserve
            tournament_size: Size of tournament selection
        """
        self.X = X
        self.y = y
        self.n_features = X.shape[1]
        self.population_size = population_size
        self.generations = generations
        self.initial_mutation_rate = initial_mutation_rate
        self.current_mutation_rate = initial_mutation_rate
        self.crossover_rate = crossover_rate
        self.elite_count = max(1, int(population_size * elite_size))
        self.tournament_size = tournament_size
        
        # Standardize features for better performance
        self.scaler = StandardScaler()
        self.X_scaled = self.scaler.fit_transform(X)
        
        # Evolution tracking
        self.best_chromosome = None
        self.best_fitness = -np.inf
        self.evolution_history = []
        self.diversity_history = []
        
    def initialize_population(self):
        """
        Create diverse initial population with varying feature selection rates
        Ensures good exploration of search space
        """
        population = []
        
        # Strategy 1: Random selection with varying densities (60% of population)
        for i in range(int(self.population_size * 0.6)):
            selection_rate = random.uniform(0.2, 0.7)
            n_selected = max(1, int(self.n_features * selection_rate))
            chromosome = np.zeros(self.n_features, dtype=int)
            selected_indices = random.sample(range(self.n_features), n_selected)
            chromosome[selected_indices] = 1
            population.append(chromosome)
        
        # Strategy 2: Small feature sets (20% of population)
        for i in range(int(self.population_size * 0.2)):
            n_selected = random.randint(1, max(2, self.n_features // 4))
            chromosome = np.zeros(self.n_features, dtype=int)
            selected_indices = random.sample(range(self.n_features), n_selected)
            chromosome[selected_indices] = 1
            population.append(chromosome)
        
        # Strategy 3: Large feature sets (20% of population)
        for i in range(self.population_size - len(population)):
            n_selected = random.randint(max(1, self.n_features // 2), 
                                       max(2, int(self.n_features * 0.8)))
            chromosome = np.zeros(self.n_features, dtype=int)
            selected_indices = random.sample(range(self.n_features), n_selected)
            chromosome[selected_indices] = 1
            population.append(chromosome)
        
        return population
    
    def evaluate_fitness(self, chromosome):
        """
        Multi-objective fitness evaluation
        Balances accuracy with feature economy using Pareto optimization
        
        Returns:
            Tuple: (accuracy, feature_ratio, combined_fitness)
        """
        selected_features = np.where(chromosome == 1)[0]
        
        # Handle empty selection
        if len(selected_features) == 0:
            return 0.0, 1.0, 0.0
        
        X_selected = self.X_scaled[:, selected_features]
        
        try:
            # Use stratified k-fold for better evaluation
            skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            model = RandomForestClassifier(n_estimators=30, max_depth=10, 
                                          random_state=42, n_jobs=1)
            scores = cross_val_score(model, X_selected, self.y, cv=skf, 
                                    scoring='accuracy', n_jobs=1)
            accuracy = scores.mean()
            
            # Calculate feature usage ratio
            feature_ratio = len(selected_features) / self.n_features
            
            # Multi-objective fitness with dynamic weighting
            # Reward high accuracy and low feature count
            accuracy_weight = 0.75
            parsimony_weight = 0.25
            
            # Non-linear penalty for excessive features
            parsimony_score = 1.0 - (feature_ratio ** 1.5)
            
            combined_fitness = (accuracy * accuracy_weight + 
                              parsimony_score * parsimony_weight)
            
            return accuracy, feature_ratio, combined_fitness
            
        except Exception as e:
            return 0.0, 1.0, 0.0
    
    def calculate_diversity(self, population):
        """
        Calculate population diversity using Hamming distance
        Used to adapt mutation rate dynamically
        """
        if len(population) < 2:
            return 0.0
        
        total_distance = 0
        comparisons = 0
        
        for i in range(min(50, len(population))):
            for j in range(i + 1, min(50, len(population))):
                distance = np.sum(population[i] != population[j])
                total_distance += distance
                comparisons += 1
        
        avg_diversity = total_distance / (comparisons * self.n_features) if comparisons > 0 else 0
        return avg_diversity
    
    def adapt_mutation_rate(self, diversity):
        """
        Dynamically adjust mutation rate based on population diversity
        High diversity -> lower mutation, Low diversity -> higher mutation
        """
        if diversity > 0.4:
            # High diversity, reduce mutation
            self.current_mutation_rate = self.initial_mutation_rate * 0.7
        elif diversity < 0.2:
            # Low diversity, increase mutation to escape local optima
            self.current_mutation_rate = min(0.3, self.initial_mutation_rate * 1.5)
        else:
            # Normal diversity
            self.current_mutation_rate = self.initial_mutation_rate
    
    def tournament_selection(self, population, fitness_scores):
        """
        Enhanced tournament selection with fitness-based competition
        """
        tournament_indices = random.sample(range(len(population)), 
                                          min(self.tournament_size, len(population)))
        tournament_fitness = [fitness_scores[i] for i in tournament_indices]
        winner_idx = tournament_indices[np.argmax(tournament_fitness)]
        return population[winner_idx].copy()
    
    def uniform_crossover(self, parent1, parent2):
        """
        Uniform crossover - each gene has 50% chance from either parent
        Better than single-point for feature selection
        """
        if random.random() > self.crossover_rate:
            return parent1.copy(), parent2.copy()
        
        child1 = np.zeros(self.n_features, dtype=int)
        child2 = np.zeros(self.n_features, dtype=int)
        
        for i in range(self.n_features):
            if random.random() < 0.5:
                child1[i] = parent1[i]
                child2[i] = parent2[i]
            else:
                child1[i] = parent2[i]
                child2[i] = parent1[i]
        
        # Ensure at least one feature is selected
        if np.sum(child1) == 0:
            child1[random.randint(0, self.n_features - 1)] = 1
        if np.sum(child2) == 0:
            child2[random.randint(0, self.n_features - 1)] = 1
        
        return child1, child2
    
    def adaptive_mutation(self, chromosome):
        """
        Adaptive bit-flip mutation with gene-specific probabilities
        """
        mutated = chromosome.copy()
        
        for i in range(len(mutated)):
            if random.random() < self.current_mutation_rate:
                mutated[i] = 1 - mutated[i]
        
        # Ensure at least one feature remains selected
        if np.sum(mutated) == 0:
            mutated[random.randint(0, self.n_features - 1)] = 1
        
        return mutated
    
    def evolve(self):
        """
        Execute the enhanced evolutionary optimization process
        """
        # Initialize population
        population = self.initialize_population()
        
        # Main evolution loop
        for generation in range(self.generations):
            # Evaluate all individuals
            fitness_data = [self.evaluate_fitness(ind) for ind in population]
            accuracies = [f[0] for f in fitness_data]
            feature_ratios = [f[1] for f in fitness_data]
            fitness_scores = [f[2] for f in fitness_data]
            
            # Track best individual
            best_idx = np.argmax(fitness_scores)
            if fitness_scores[best_idx] > self.best_fitness:
                self.best_fitness = fitness_scores[best_idx]
                self.best_chromosome = population[best_idx].copy()
                self.best_accuracy = accuracies[best_idx]
                self.best_feature_ratio = feature_ratios[best_idx]
            
            # Calculate diversity and adapt mutation
            diversity = self.calculate_diversity(population)
            self.adapt_mutation_rate(diversity)
            
            # Record generation statistics
            self.evolution_history.append({
                'generation': generation + 1,
                'best_fitness': self.best_fitness,
                'best_accuracy': self.best_accuracy,
                'avg_fitness': np.mean(fitness_scores),
                'avg_accuracy': np.mean(accuracies),
                'feature_count': int(np.sum(self.best_chromosome)),
                'mutation_rate': self.current_mutation_rate,
                'diversity': diversity
            })
            
            # Sort population by fitness
            sorted_indices = np.argsort(fitness_scores)[::-1]
            sorted_population = [population[i] for i in sorted_indices]
            
            # Create next generation
            new_population = []
            
            # Elitism - preserve top individuals
            new_population.extend(sorted_population[:self.elite_count])
            
            # Generate offspring
            while len(new_population) < self.population_size:
                # Selection
                parent1 = self.tournament_selection(population, fitness_scores)
                parent2 = self.tournament_selection(population, fitness_scores)
                
                # Crossover
                child1, child2 = self.uniform_crossover(parent1, parent2)
                
                # Mutation
                child1 = self.adaptive_mutation(child1)
                child2 = self.adaptive_mutation(child2)
                
                new_population.extend([child1, child2])
            
            population = new_population[:self.population_size]
        
        # Extract final results
        selected_features = np.where(self.best_chromosome == 1)[0].tolist()
        
        return {
            'selected_features': selected_features,
            'feature_count': len(selected_features),
            'accuracy': float(self.best_accuracy),
            'fitness_score': float(self.best_fitness),
            'feature_ratio': float(self.best_feature_ratio),
            'evolution_history': self.evolution_history
        }

