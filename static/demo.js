// Demo Page JavaScript - File Upload and Optimization Handler

let selectedFile = null;

// Initialize slider value displays
document.addEventListener('DOMContentLoaded', () => {
    // Population Size Slider
    const populationSlider = document.getElementById('populationSize');
    const populationValue = document.getElementById('populationValue');
    populationSlider.addEventListener('input', (e) => {
        populationValue.textContent = e.target.value;
    });

    // Generations Slider
    const generationsSlider = document.getElementById('generations');
    const generationsValue = document.getElementById('generationsValue');
    generationsSlider.addEventListener('input', (e) => {
        generationsValue.textContent = e.target.value;
    });

    // Mutation Rate Slider
    const mutationSlider = document.getElementById('mutationRate');
    const mutationValue = document.getElementById('mutationValue');
    mutationSlider.addEventListener('input', (e) => {
        mutationValue.textContent = parseFloat(e.target.value).toFixed(2);
    });
});

// File input handler
document.getElementById('fileInput').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

// Drag and drop handlers
const uploadBox = document.getElementById('uploadBox');

uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('dragover');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('dragover');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

// Handle file selection
function handleFileSelect(file) {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValid) {
        showError('يرجى رفع ملف CSV أو Excel فقط');
        return;
    }

    selectedFile = file;
    const fileInfo = document.getElementById('fileInfo');
    const fileInfoContent = document.getElementById('fileInfoContent');
    
    // Show file info with loading state
    fileInfoContent.innerHTML = `
        <div class="file-info-item">
            <span class="file-info-label">اسم الملف:</span>
            <span class="file-info-value">${file.name}</span>
        </div>
        <div class="file-info-item">
            <span class="file-info-label">الحجم:</span>
            <span class="file-info-value">${(file.size / 1024).toFixed(2)} KB</span>
        </div>
        <div class="file-info-item">
            <span class="file-info-label">الحالة:</span>
            <span class="file-info-value">⏳ جارِ التحليل...</span>
        </div>
    `;
    fileInfo.classList.add('active');
    
    // Preview dataset
    const formData = new FormData();
    formData.append('file', file);
    
    fetch('/api/analyze', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showError(data.error);
            fileInfo.classList.remove('active');
            return;
        }
        
        // Update file info with dataset details
        fileInfoContent.innerHTML = `
            <div class="file-info-item">
                <span class="file-info-label">اسم الملف:</span>
                <span class="file-info-value">${file.name}</span>
            </div>
            <div class="file-info-item">
                <span class="file-info-label">الحجم:</span>
                <span class="file-info-value">${(file.size / 1024).toFixed(2)} KB</span>
            </div>
            <div class="file-info-item">
                <span class="file-info-label">عدد الصفوف:</span>
                <span class="file-info-value">${data.total_rows.toLocaleString('ar-EG')}</span>
            </div>
            <div class="file-info-item">
                <span class="file-info-label">عدد الأعمدة:</span>
                <span class="file-info-value">${data.total_features}</span>
            </div>
            <div class="file-info-item">
                <span class="file-info-label">الحالة:</span>
                <span class="file-info-value" style="color: var(--sage-green);">✓ جاهز للتحسين</span>
            </div>
        `;
        
        // Show settings section with animation
        const settingsSection = document.getElementById('settingsSection');
        settingsSection.style.display = 'block';
        setTimeout(() => {
            settingsSection.style.animation = 'slideIn 0.4s ease-out';
        }, 100);
        
        // Enable optimize button
        document.getElementById('optimizeBtn').disabled = false;
    })
    .catch(error => {
        showError('خطأ في قراءة الملف: ' + error.message);
        fileInfo.classList.remove('active');
    });
}

// Show error message
function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = '⚠️ ' + message;
    errorMsg.classList.add('active');
    setTimeout(() => {
        errorMsg.classList.remove('active');
    }, 5000);
}

// Start optimization
function startOptimization() {
    if (!selectedFile) {
        showError('يرجى اختيار ملف أولاً');
        return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('target_column', '');
    formData.append('population_size', document.getElementById('populationSize').value);
    formData.append('generations', document.getElementById('generations').value);
    formData.append('mutation_rate', document.getElementById('mutationRate').value);

    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const optimizeBtn = document.getElementById('optimizeBtn');

    loading.classList.add('active');
    results.classList.remove('active');
    optimizeBtn.disabled = true;

    fetch('/api/optimize', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        loading.classList.remove('active');
        optimizeBtn.disabled = false;

        if (data.error) {
            showError(data.error);
            return;
        }

        displayResults(data);
    })
    .catch(error => {
        loading.classList.remove('active');
        optimizeBtn.disabled = false;
        showError('خطأ في المعالجة: ' + error.message);
    });
}

// Display results
function displayResults(data) {
    const results = document.getElementById('results');
    results.classList.add('active');
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Display metrics
    displayMetrics(data);
    
    // Draw evolution chart
    drawEvolutionChart(data.evolution);
    
    // Draw diversity chart
    drawDiversityChart(data.evolution);
    
    // Draw feature importance chart
    drawFeatureImportanceChart(data.optimization.feature_names, data.feature_importance);
    
    // Display features
    displayFeatures(data.optimization.feature_names);
}

// Display metrics cards
function displayMetrics(data) {
    const metricsGrid = document.getElementById('metricsGrid');
    const accuracy = (data.optimization.accuracy * 100).toFixed(2);
    const reduction = data.performance.reduction_percentage.toFixed(1);
    const efficiency = data.performance.efficiency_score.toFixed(2);
    
    metricsGrid.innerHTML = `
        <div class="metric-card">
            <div class="metric-value">${accuracy}%</div>
            <div class="metric-label">دقة النموذج</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${data.optimization.feature_count}</div>
            <div class="metric-label">السمات المختارة</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${reduction}%</div>
            <div class="metric-label">نسبة التقليل</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${efficiency}</div>
            <div class="metric-label">معامل الكفاءة</div>
        </div>
    `;
}

// Draw evolution progress chart
function drawEvolutionChart(evolutionData) {
    const chart = new LineChart('evolutionChart');
    
    const data = {
        x: evolutionData.generations,
        y: [
            {
                values: evolutionData.best_accuracy.map(v => v * 100),
                color: '#948979',
                showArea: true
            },
            {
                values: evolutionData.avg_accuracy.map(v => v * 100),
                color: '#DFD0B8',
                showArea: true
            }
        ]
    };
    
    chart.draw(data, {
        xLabel: 'الجيل',
        yLabel: 'الدقة (%)'
    });
    
    chart.createLegend('evolutionLegend', [
        { color: '#948979', label: 'أفضل دقة' },
        { color: '#DFD0B8', label: 'متوسط الدقة' }
    ]);
}

// Draw diversity and mutation rate chart
function drawDiversityChart(evolutionData) {
    const chart = new LineChart('diversityChart');
    
    const data = {
        x: evolutionData.generations,
        y: [
            {
                values: evolutionData.diversity,
                color: '#66BB6A',
                showArea: false
            },
            {
                values: evolutionData.mutation_rates,
                color: '#42A5F5',
                showArea: false
            }
        ]
    };
    
    chart.draw(data, {
        xLabel: 'الجيل',
        yLabel: 'القيمة'
    });
    
    chart.createLegend('diversityLegend', [
        { color: '#66BB6A', label: 'التنوع الجيني' },
        { color: '#42A5F5', label: 'معدل الطفرة' }
    ]);
}

// Draw feature importance bar chart
function drawFeatureImportanceChart(featureNames, importanceValues) {
    const chart = new BarChart('importanceChart');
    
    // Show top 10 features only for clarity
    const top10Indices = importanceValues
        .map((val, idx) => ({ val, idx }))
        .sort((a, b) => b.val - a.val)
        .slice(0, Math.min(10, importanceValues.length))
        .map(item => item.idx);
    
    const topFeatures = top10Indices.map(i => featureNames[i]);
    const topImportance = top10Indices.map(i => importanceValues[i]);
    
    // Generate gradient colors
    const colors = topImportance.map((val, idx) => {
        const ratio = val / Math.max(...topImportance);
        const r = Math.round(148 + (223 - 148) * ratio);
        const g = Math.round(137 + (208 - 137) * ratio);
        const b = Math.round(121 + (184 - 121) * ratio);
        return `rgb(${r}, ${g}, ${b})`;
    });
    
    const data = {
        labels: topFeatures,
        values: topImportance,
        colors: colors
    };
    
    chart.draw(data);
}

// Display selected features
function displayFeatures(featureNames) {
    document.getElementById('featuresCount').textContent = featureNames.length;
    
    const featuresList = document.getElementById('featuresList');
    featuresList.innerHTML = featureNames
        .map((name, idx) => `<div class="feature-item">${idx + 1}. ${name}</div>`)
        .join('');
}

