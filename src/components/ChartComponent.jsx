// src/components/ChartComponent.jsx
import React from 'react';
import ReactECharts from 'echarts-for-react';

const ChartComponent = ({ data, metrics = [], showLegend = true }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 py-4">Dados insuficientes para o gráfico.</p>;
  }

  // Prepara dados
  const labels = data.map(d => d.local_date_time);
  const dateOnlyList = data.map(d => d.local_date_time?.split(', ')[0]);

  // Detecta início de cada novo dia
  const markAreas = [];
  let lastDate = '';
  let startIdx = 0;
  for (let i = 0; i < data.length; i++) {
    const currentDate = dateOnlyList[i];
    if (currentDate !== lastDate) {
      if (i > 0) {
        markAreas.push([{ xAxis: labels[startIdx] }, { xAxis: labels[i - 1] }]);
        startIdx = i;
      }
      lastDate = currentDate;
    }
  }
  if (startIdx < data.length - 1) {
    markAreas.push([{ xAxis: labels[startIdx] }, { xAxis: labels[data.length - 1] }]);
  }

  // Series para cada métrica
  const series = metrics.map((metric) => ({
    name: metric.name,
    type: 'bar',
    data: data.map(d => parseFloat(d[metric.key]) || 0),
    itemStyle: { color: metric.color },
    barWidth: metrics.length > 1 ? '40%' : '60%',
  }));

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const index = params?.[0]?.dataIndex;
        const d = data[index];
        if (!d) return 'Sem dados';

        let content = `<strong>${d.local_date_time}</strong><br/>`;
        params.forEach(p => {
          content += `${p.marker}${p.seriesName}: <b>${formatNumber(p.data, p.seriesName.includes('Nível') ? 2 : 1)}${getMetricUnit(p.seriesName, metrics)}</b><br/>`;
        });

        // Informações adicionais contextuais
        const mainKey = metrics[0]?.key;
        if (mainKey === 'wave_height_sg') {
          content += `
            <hr/>
            Período Onda: ${formatNumber(d.wave_period_sg)} s<br/>
            Direção: ${getDirection(d.wave_direction_sg)}<br/>
            <br/>
            Swell Principal: ${formatNumber(d.swell_height_sg)} m / ${formatNumber(d.swell_period_sg)} s (${getDirection(d.swell_direction_sg)})<br/>
          `;
          if (d.secondary_swell_height_sg > 0) {
            content += `Swell Secundário: ${formatNumber(d.secondary_swell_height_sg)} m / ${formatNumber(d.secondary_swell_period_sg)} s (${getDirection(d.secondary_swell_direction_sg)})<br/>`;
          }
        } else if (mainKey === 'wind_speed_sg') {
          content += `<hr/>Direção do Vento: ${getDirection(d.wind_direction_sg)}<br/>`;
        } else if (mainKey === 'air_temperature_sg') {
          content += `<hr/>Umidade: ${formatNumber(d.humidity_sg, 0)}%<br/>`;
        } else if (mainKey === 'sea_level_sg') {
          content += `<hr/>Fase da Maré: <strong>${d.tide_phase === 'rising' ? 'Subindo' : 'Descendo'}</strong><br/>`;
        }

        return content;
      },
      backgroundColor: '#fff',
      borderColor: '#ccc',
      borderWidth: 1,
      textStyle: { color: '#333', fontSize: 12 },
    },
    grid: {
      left: 50,
      right: 30,
      top: 40,
      bottom: 70,
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: {
        rotate: 45,
        fontSize: 11,
        formatter: (val) => val.split(', ')[1], // Mostra só a hora
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: metrics.length === 1 ? metrics[0].unit : '',
      axisLabel: {
        fontSize: 12,
        formatter: (value) => formatNumber(value, 2),
      },
    },
    series,
    markArea: {
      itemStyle: {
        color: 'rgba(200, 200, 200, 0.06)'
      },
      data: markAreas
    },
    legend: showLegend ? {
      bottom: 0,
      icon: 'circle',
      textStyle: { fontSize: 12 }
    } : undefined
  };

  return <ReactECharts option={option} style={{ height: 260, width: '100%' }} />;
};

// Helpers
function formatNumber(val, dec = 1) {
  const n = Number(val);
  return isNaN(n) ? 'N/A' : n.toFixed(dec);
}

function getDirection(deg) {
  if (deg === undefined || deg === null) return 'N/A';
  const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

function getMetricUnit(name, metrics) {
  const found = metrics.find(m => m.name === name);
  return found ? found.unit : '';
}

export default ChartComponent;
