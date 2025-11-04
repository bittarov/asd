// Custom SVG Chart Library - No External Dependencies
// Pure JavaScript implementation for performance visualization

class SVGChart {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = this.container.clientWidth || 800;
        this.height = this.container.clientHeight || 400;
        this.padding = { top: 40, right: 40, bottom: 60, left: 70 };
        this.colors = {
            primary: '#948979',
            secondary: '#DFD0B8',
            accent1: '#66BB6A',
            accent2: '#42A5F5',
            grid: '#393E46',
            text: '#DFD0B8'
        };
    }

    createSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', this.width);
        svg.setAttribute('height', this.height);
        svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        return svg;
    }

    createPath(d, stroke, strokeWidth = 2, fill = 'none') {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('stroke', stroke);
        path.setAttribute('stroke-width', strokeWidth);
        path.setAttribute('fill', fill);
        path.classList.add('chart-line');
        return path;
    }

    createCircle(cx, cy, r, fill) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', fill);
        circle.classList.add('chart-point');
        return circle;
    }

    createRect(x, y, width, height, fill) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('fill', fill);
        rect.classList.add('chart-bar');
        return rect;
    }

    createText(x, y, text, fontSize = 12, fill = null) {
        const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textEl.setAttribute('x', x);
        textEl.setAttribute('y', y);
        textEl.setAttribute('font-size', fontSize);
        textEl.setAttribute('fill', fill || this.colors.text);
        textEl.classList.add('axis-label');
        textEl.textContent = text;
        return textEl;
    }

    createLine(x1, y1, x2, y2, stroke, strokeWidth = 1, dasharray = '') {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', stroke);
        line.setAttribute('stroke-width', strokeWidth);
        if (dasharray) line.setAttribute('stroke-dasharray', dasharray);
        return line;
    }

    drawGrid(svg, xScale, yScale, xTicks, yTicks) {
        // Vertical grid lines
        xTicks.forEach(tick => {
            const x = xScale(tick);
            const line = this.createLine(x, this.padding.top, x, 
                this.height - this.padding.bottom, this.colors.grid, 1, '5,5');
            line.classList.add('grid-line');
            svg.appendChild(line);
        });

        // Horizontal grid lines
        yTicks.forEach(tick => {
            const y = yScale(tick);
            const line = this.createLine(this.padding.left, y, 
                this.width - this.padding.right, y, this.colors.grid, 1, '5,5');
            line.classList.add('grid-line');
            svg.appendChild(line);
        });
    }

    drawAxes(svg, xScale, yScale, xTicks, yTicks, xLabel, yLabel) {
        // X-axis
        const xAxis = this.createLine(this.padding.left, this.height - this.padding.bottom,
            this.width - this.padding.right, this.height - this.padding.bottom,
            this.colors.primary, 2);
        xAxis.classList.add('axis-line');
        svg.appendChild(xAxis);

        // Y-axis
        const yAxis = this.createLine(this.padding.left, this.padding.top,
            this.padding.left, this.height - this.padding.bottom,
            this.colors.primary, 2);
        yAxis.classList.add('axis-line');
        svg.appendChild(yAxis);

        // X-axis ticks and labels
        xTicks.forEach(tick => {
            const x = xScale(tick);
            const tickLine = this.createLine(x, this.height - this.padding.bottom,
                x, this.height - this.padding.bottom + 6, this.colors.primary, 2);
            svg.appendChild(tickLine);
            
            const label = this.createText(x, this.height - this.padding.bottom + 20, 
                Math.round(tick), 11);
            label.setAttribute('text-anchor', 'middle');
            svg.appendChild(label);
        });

        // Y-axis ticks and labels
        yTicks.forEach(tick => {
            const y = yScale(tick);
            const tickLine = this.createLine(this.padding.left - 6, y,
                this.padding.left, y, this.colors.primary, 2);
            svg.appendChild(tickLine);
            
            const label = this.createText(this.padding.left - 10, y + 4, 
                tick.toFixed(2), 11);
            label.setAttribute('text-anchor', 'end');
            svg.appendChild(label);
        });

        // Axis labels
        if (xLabel) {
            const xLabelEl = this.createText(this.width / 2, this.height - 10, 
                xLabel, 14, this.colors.secondary);
            xLabelEl.setAttribute('text-anchor', 'middle');
            xLabelEl.setAttribute('font-weight', 'bold');
            svg.appendChild(xLabelEl);
        }

        if (yLabel) {
            const yLabelEl = this.createText(20, this.height / 2, yLabel, 14, 
                this.colors.secondary);
            yLabelEl.setAttribute('text-anchor', 'middle');
            yLabelEl.setAttribute('transform', `rotate(-90, 20, ${this.height / 2})`);
            yLabelEl.setAttribute('font-weight', 'bold');
            svg.appendChild(yLabelEl);
        }
    }

    createLegend(legendId, items) {
        const legend = document.getElementById(legendId);
        if (!legend) return;
        
        legend.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'legend-item';
            
            const color = document.createElement('div');
            color.className = 'legend-color';
            color.style.background = item.color;
            
            const label = document.createElement('span');
            label.className = 'legend-label';
            label.textContent = item.label;
            
            div.appendChild(color);
            div.appendChild(label);
            legend.appendChild(div);
        });
    }
}

class LineChart extends SVGChart {
    draw(data, options = {}) {
        this.container.innerHTML = '';
        const svg = this.createSVG();

        const xData = data.x;
        const yDataSets = data.y;

        // Calculate scales
        const xMin = Math.min(...xData);
        const xMax = Math.max(...xData);
        const allYValues = yDataSets.flatMap(ds => ds.values);
        const yMin = Math.min(...allYValues) * 0.9;
        const yMax = Math.max(...allYValues) * 1.1;

        const xScale = (x) => this.padding.left + 
            ((x - xMin) / (xMax - xMin)) * (this.width - this.padding.left - this.padding.right);
        const yScale = (y) => this.height - this.padding.bottom - 
            ((y - yMin) / (yMax - yMin)) * (this.height - this.padding.top - this.padding.bottom);

        // Generate ticks
        const xTicks = this.generateTicks(xMin, xMax, 8);
        const yTicks = this.generateTicks(yMin, yMax, 6);

        // Draw grid
        this.drawGrid(svg, xScale, yScale, xTicks, yTicks);

        // Draw lines and areas
        yDataSets.forEach((dataset, idx) => {
            // Area fill
            if (dataset.showArea) {
                let areaPath = `M ${xScale(xData[0])} ${this.height - this.padding.bottom}`;
                xData.forEach((x, i) => {
                    areaPath += ` L ${xScale(x)} ${yScale(dataset.values[i])}`;
                });
                areaPath += ` L ${xScale(xData[xData.length - 1])} ${this.height - this.padding.bottom} Z`;
                
                const area = this.createPath(areaPath, 'none', 0, dataset.color);
                area.style.opacity = '0.2';
                area.classList.add('chart-area');
                svg.appendChild(area);
            }

            // Line
            let linePath = `M ${xScale(xData[0])} ${yScale(dataset.values[0])}`;
            xData.forEach((x, i) => {
                if (i > 0) {
                    linePath += ` L ${xScale(x)} ${yScale(dataset.values[i])}`;
                }
            });
            const line = this.createPath(linePath, dataset.color, 3);
            svg.appendChild(line);

            // Points
            xData.forEach((x, i) => {
                const circle = this.createCircle(xScale(x), yScale(dataset.values[i]), 
                    4, dataset.color);
                
                // Tooltip on hover
                circle.addEventListener('mouseenter', (e) => {
                    circle.setAttribute('r', 6);
                    this.showTooltip(e, dataset.values[i].toFixed(4), x);
                });
                circle.addEventListener('mouseleave', () => {
                    circle.setAttribute('r', 4);
                    this.hideTooltip();
                });
                
                svg.appendChild(circle);
            });
        });

        // Draw axes
        this.drawAxes(svg, xScale, yScale, xTicks, yTicks, 
            options.xLabel || '', options.yLabel || '');

        this.container.appendChild(svg);
    }

    generateTicks(min, max, count) {
        const step = (max - min) / (count - 1);
        const ticks = [];
        for (let i = 0; i < count; i++) {
            ticks.push(min + step * i);
        }
        return ticks;
    }

    showTooltip(event, value, x) {
        // Simple tooltip implementation
        const tooltip = document.createElement('div');
        tooltip.id = 'chart-tooltip';
        tooltip.style.position = 'fixed';
        tooltip.style.background = '#393E46';
        tooltip.style.color = '#DFD0B8';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '6px';
        tooltip.style.fontSize = '12px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '10000';
        tooltip.style.border = '2px solid #948979';
        tooltip.textContent = `Gen ${x}: ${value}`;
        tooltip.style.left = event.pageX + 10 + 'px';
        tooltip.style.top = event.pageY - 30 + 'px';
        document.body.appendChild(tooltip);
    }

    hideTooltip() {
        const tooltip = document.getElementById('chart-tooltip');
        if (tooltip) tooltip.remove();
    }
}

class BarChart extends SVGChart {
    draw(data, options = {}) {
        this.container.innerHTML = '';
        const svg = this.createSVG();

        const labels = data.labels;
        const values = data.values;
        const colors = data.colors || Array(values.length).fill(this.colors.primary);

        // Calculate scales
        const yMin = 0;
        const yMax = Math.max(...values) * 1.15;
        const barWidth = (this.width - this.padding.left - this.padding.right) / labels.length * 0.7;
        const barSpacing = (this.width - this.padding.left - this.padding.right) / labels.length;

        const yScale = (y) => this.height - this.padding.bottom - 
            ((y - yMin) / (yMax - yMin)) * (this.height - this.padding.top - this.padding.bottom);

        // Generate y-axis ticks
        const yTicks = this.generateTicks(yMin, yMax, 6);

        // Draw horizontal grid
        yTicks.forEach(tick => {
            const y = yScale(tick);
            const line = this.createLine(this.padding.left, y, 
                this.width - this.padding.right, y, this.colors.grid, 1, '5,5');
            line.classList.add('grid-line');
            svg.appendChild(line);
        });

        // Draw bars
        values.forEach((value, i) => {
            const x = this.padding.left + i * barSpacing + (barSpacing - barWidth) / 2;
            const y = yScale(value);
            const height = (this.height - this.padding.bottom) - y;
            
            const rect = this.createRect(x, y, barWidth, height, colors[i]);
            
            // Hover effect
            rect.addEventListener('mouseenter', (e) => {
                rect.style.opacity = '0.8';
                this.showTooltip(e, value.toFixed(2), labels[i]);
            });
            rect.addEventListener('mouseleave', () => {
                rect.style.opacity = '1';
                this.hideTooltip();
            });
            
            svg.appendChild(rect);

            // Value label on top
            const valueLabel = this.createText(x + barWidth / 2, y - 8, 
                value.toFixed(2), 11, this.colors.secondary);
            valueLabel.setAttribute('text-anchor', 'middle');
            valueLabel.setAttribute('font-weight', 'bold');
            svg.appendChild(valueLabel);
        });

        // Draw axes
        const xAxis = this.createLine(this.padding.left, this.height - this.padding.bottom,
            this.width - this.padding.right, this.height - this.padding.bottom,
            this.colors.primary, 2);
        svg.appendChild(xAxis);

        const yAxis = this.createLine(this.padding.left, this.padding.top,
            this.padding.left, this.height - this.padding.bottom,
            this.colors.primary, 2);
        svg.appendChild(yAxis);

        // Y-axis labels
        yTicks.forEach(tick => {
            const y = yScale(tick);
            const label = this.createText(this.padding.left - 10, y + 4, 
                tick.toFixed(1), 11);
            label.setAttribute('text-anchor', 'end');
            svg.appendChild(label);
        });

        // X-axis labels
        labels.forEach((label, i) => {
            const x = this.padding.left + i * barSpacing + barSpacing / 2;
            const textEl = this.createText(x, this.height - this.padding.bottom + 20, 
                label, 11);
            textEl.setAttribute('text-anchor', 'middle');
            svg.appendChild(textEl);
        });

        this.container.appendChild(svg);
    }

    generateTicks(min, max, count) {
        const step = (max - min) / (count - 1);
        const ticks = [];
        for (let i = 0; i < count; i++) {
            ticks.push(min + step * i);
        }
        return ticks;
    }

    showTooltip(event, value, label) {
        const tooltip = document.createElement('div');
        tooltip.id = 'chart-tooltip';
        tooltip.style.position = 'fixed';
        tooltip.style.background = '#393E46';
        tooltip.style.color = '#DFD0B8';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '6px';
        tooltip.style.fontSize = '12px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '10000';
        tooltip.style.border = '2px solid #948979';
        tooltip.textContent = `${label}: ${value}`;
        tooltip.style.left = event.pageX + 10 + 'px';
        tooltip.style.top = event.pageY - 30 + 'px';
        document.body.appendChild(tooltip);
    }

    hideTooltip() {
        const tooltip = document.getElementById('chart-tooltip');
        if (tooltip) tooltip.remove();
    }
}

