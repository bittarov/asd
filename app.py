"""
AlgoGenius - Intelligent Feature Optimization Platform
Main Application Server
"""
import os

# Configure single-threaded execution
os.environ['JOBLIB_MULTIPROCESSING'] = '0'
os.environ['LOKY_MAX_CPU_COUNT'] = '1'

from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
from werkzeug.utils import secure_filename
from core import GeneticFeatureOptimizer, PerformanceAnalyzer

# Initialize Flask application
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB max
app.config['SECRET_KEY'] = 'algogenius-genetic-optimization-2025'

# Create upload directory
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}


def validate_file(filename):
    """
    Validate uploaded file extension
    
    Args:
        filename: Name of uploaded file
        
    Returns:
        Boolean indicating validity
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():
    """
    Main landing page
    """
    return render_template('index.html')


@app.route('/members')
def members():
    """
    Team members page
    """
    return render_template('members.html')


@app.route('/algorithms')
def algorithms():
    """
    Algorithms information page
    """
    return render_template('algorithms.html')


@app.route('/course-info')
def course_info():
    """
    Course information page
    """
    return render_template('course_info.html')


@app.route('/demo')
def demo():
    """
    Interactive demo page
    """
    return render_template('demo.html')


@app.route('/api/analyze', methods=['POST'])
def analyze_dataset():
    """
    API endpoint to analyze uploaded dataset
    Returns basic statistics
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not validate_file(file.filename):
            return jsonify({'error': 'Only CSV and Excel files supported'}), 400
        
        # Read dataset
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        if file_ext == 'csv':
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file, engine='openpyxl' if file_ext == 'xlsx' else None)
        
        # Extract metadata
        columns = df.columns.tolist()
        
        return jsonify({
            'success': True,
            'columns': columns,
            'total_rows': int(df.shape[0]),
            'total_features': int(df.shape[1]),
            'column_types': df.dtypes.astype(str).to_dict()
        })
    
    except Exception as e:
        return jsonify({'error': f'Analysis error: {str(e)}'}), 500


@app.route('/api/optimize', methods=['POST'])
def optimize_features():
    """
    Main optimization endpoint using enhanced genetic algorithm
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not validate_file(file.filename):
            return jsonify({'error': 'Only CSV and Excel files supported'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Load dataset
        file_ext = filename.rsplit('.', 1)[1].lower()
        if file_ext == 'csv':
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath, engine='openpyxl' if file_ext == 'xlsx' else None)
        
        # Extract parameters
        target_column = request.form.get('target_column')
        if not target_column or target_column not in df.columns:
            target_column = df.columns[-1]
        
        population_size = int(request.form.get('population_size', 60))
        generations = int(request.form.get('generations', 50))
        mutation_rate = float(request.form.get('mutation_rate', 0.15))
        
        # Prepare data
        X = df.drop(columns=[target_column]).select_dtypes(include=[np.number])
        y = df[target_column]
        
        # Handle missing values
        X = X.fillna(X.mean())
        
        # Convert categorical target to numeric
        if y.dtype == 'object':
            y = pd.Categorical(y).codes
        
        # Run genetic optimization
        optimizer = GeneticFeatureOptimizer(
            X.values, y.values,
            population_size=population_size,
            generations=generations,
            initial_mutation_rate=mutation_rate
        )
        
        genetic_results = optimizer.evolve()
        
        # Add feature names
        genetic_results['feature_names'] = [X.columns[i] for i in genetic_results['selected_features']]
        
        # Performance analysis
        analyzer = PerformanceAnalyzer(X.values, y.values)
        comparison_data = analyzer.generate_comparison_data(genetic_results)
        evolution_data = analyzer.generate_evolution_analysis(genetic_results['evolution_history'])
        feature_importance = analyzer.calculate_feature_importance_estimation(
            genetic_results['selected_features']
        )
        
        # Prepare comprehensive results
        results = {
            'success': True,
            'dataset_info': {
                'total_rows': int(df.shape[0]),
                'total_features': int(X.shape[1]),
                'target_column': target_column
            },
            'optimization': genetic_results,
            'performance': comparison_data,
            'evolution': evolution_data,
            'feature_importance': feature_importance,
            'parameters': {
                'population_size': population_size,
                'generations': generations,
                'mutation_rate': mutation_rate
            }
        }
        
        # Clean up
        os.remove(filepath)
        
        return jsonify(results)
    
    except Exception as e:
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': f'Optimization error: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

