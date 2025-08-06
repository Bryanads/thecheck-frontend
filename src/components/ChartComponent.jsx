import React from 'react';
import ReactECharts from 'echarts-for-react';

const ChartComponent = ({ data, metrics = [], showLegend = true }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 py-4">Dados insuficientes para o gráfico.</p>;
  }

  let processedData = [...data];
  let processedLabels = data.map(d => d.local_date_time);
  const dateOnlyList = data.map(d => d.local_date_time?.split(', ')[0]);

  const markAreas = [];
  const markLines = [];
  let lastDate = '';
  let startIdx = 0;
  let colorToggle = 0;
  let insertionsCount = 0;

  for (let i = 0; i < dateOnlyList.length; i++) {
    const currentDate = dateOnlyList[i];
    if (currentDate !== lastDate) {
      if (i > 0) {
        markAreas.push([
          {
            xAxis: processedLabels[startIdx + insertionsCount],
            itemStyle: {
              color: 'transparent'
            },
            label: {
              show: true,
              formatter: lastDate,
              position: 'top', // Alterado para 'top' para posicionar acima
              offset: [0, -20], // Ajuste o offset para mover para cima (primeiro valor é x, segundo é y)
              color: '#000',
              fontWeight: 'bold',
              fontSize: 11
            }
          },
          {
            xAxis: processedLabels[i - 1 + insertionsCount]
          }
        ]);

        const insertIndex = i + insertionsCount;
        processedLabels.splice(insertIndex, 0, `___EMPTY_SLOT_${insertionsCount}___`);
        processedData.splice(insertIndex, 0, {});
        insertionsCount++;

        markLines.push({
          xAxis: insertIndex,
          lineStyle: {
            color: '#000000',
            type: 'solid',
            width: 2
          }
        });

        colorToggle++;
      }
      startIdx = i;
      lastDate = currentDate;
    }
  }

  if (startIdx < data.length) {
    markAreas.push([
      {
        xAxis: processedLabels[startIdx + insertionsCount],
        itemStyle: {
          color: 'transparent'
        },
        label: {
          show: true,
          formatter: lastDate,
          position: 'top', // Alterado para 'top'
          offset: [0, -20], // Ajuste o offset
          color: '#000',
          fontWeight: 'bold',
          fontSize: 11
        }
      },
      {
        xAxis: processedLabels[processedLabels.length - 1]
      }
    ]);
  }

  const series = metrics.map((metric) => ({
    name: metric.name,
    type: 'bar',
    data: processedData.map(d =>
      d && typeof d[metric.key] !== 'undefined' ? parseFloat(d[metric.key]) : null
    ),
    itemStyle: { color: metric.color },
    barWidth: '50%',
    barGap: '-100%',
    markArea: {
      data: markAreas
    },
    markLine: {
      data: markLines,
      symbol: 'none',
      label: { show: false },
      lineStyle: {
        color: '#000',
        type: 'solid',
        width: 2
      }
    },
    // Add label for wind direction if the current metric is wind speed
    label: metric.key === 'wind_speed_sg' ? {
      show: true,
      position: 'top',
      formatter: (params) => {
        const index = params.dataIndex;
        const d = processedData[index];
        if (d && d.wind_direction_sg !== undefined && d.wind_direction_sg !== null) {
          return getDirection(d.wind_direction_sg);
        }
        return '';
      },
      color: '#000',
      fontSize: 10,
      fontWeight: 'bold'
    } : undefined
  }));

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const index = params?.[0]?.dataIndex;
        const d = processedData[index];
        if (!d || Object.keys(d).length === 0 || processedLabels[index]?.startsWith('___EMPTY_SLOT_')) {
          return 'Sem dados';
        }

        let content = `<strong>${d.local_date_time}</strong><br/>`;
        params.forEach(p => {
          if (p.data !== null && p.data !== undefined) {
            content += `${p.marker}${p.seriesName}: <b>${formatNumber(p.data, p.seriesName.includes('Nível') ? 2 : 1)}${getMetricUnit(p.seriesName, metrics)}</b><br/>`;
          }
        });

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
      top: 60, // Aumente o top para dar espaço ao label da data
      bottom: 70,
    },
    xAxis: {
      type: 'category',
      data: processedLabels,
      axisLabel: {
        rotate: 45,
        fontSize: 11,
        formatter: (val) => val.startsWith('___EMPTY_SLOT_') ? '' : val.split(', ')[1],
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