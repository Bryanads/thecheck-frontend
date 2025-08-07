import React, { useRef, useEffect, useState } from 'react'; // Importar useRef e useState
import ReactECharts from 'echarts-for-react';
import { RxFontBold } from 'react-icons/rx';

const ForecastChart = ({ data, metrics = [], showLegend = true }) => {
  const chartContainerRef = useRef(null); // Criar uma ref para o contêiner
  const [containerWidth, setContainerWidth] = useState(0); // Estado para a largura do contêiner

  useEffect(() => {
    // Atualiza a largura do contêiner quando o componente monta ou redimensiona
    const updateContainerWidth = () => {
      if (chartContainerRef.current) {
        setContainerWidth(chartContainerRef.current.offsetWidth);
      }
    };

    updateContainerWidth(); // Chama uma vez ao montar
    window.addEventListener('resize', updateContainerWidth); // Adiciona listener para redimensionamento

    return () => {
      window.removeEventListener('resize', updateContainerWidth); // Remove o listener ao desmontar
    };
  }, []);

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
  let insertionsCount = 0;

  for (let i = 0; i < dateOnlyList.length; i++) {
    const currentDate = dateOnlyList === undefined ? null : dateOnlyList === null ? null : dateOnlyList?.[i];
    if (currentDate !== lastDate) {
      if (i > 0) {
        markAreas.push([
          {
            xAxis: processedLabels === undefined ? null : processedLabels === null ? null : processedLabels?.[startIdx + insertionsCount],
            itemStyle: {
              color: 'transparent'
            },
            label: {
              show: true,
              formatter: lastDate,
              position: 'top',
              offset: [0, -20],
              color: '#000',
              fontWeight: 'bold',
              fontSize: 11
            }
          },
          {
            xAxis: processedLabels === undefined ? null : processedLabels === null ? null : processedLabels?.[i - 1 + insertionsCount]
          }
        ]);

        const insertIndex = i + insertionsCount;
        if (processedLabels) processedLabels.splice(insertIndex, 0, `___EMPTY_SLOT_${insertionsCount}___`);
        if (processedData) processedData.splice(insertIndex, 0, {});
        insertionsCount++;

        markLines.push({
          xAxis: insertIndex,
          lineStyle: {
            color: '#000000',
            type: 'solid',
            width: 2
          }
        });
      }
      startIdx = i;
      lastDate = currentDate;
    }
  }

  if (startIdx < (data === undefined ? 0 : data === null ? 0 : data.length)) {
    markAreas.push([
      {
        xAxis: processedLabels === undefined ? null : processedLabels === null ? null : processedLabels?.[startIdx + insertionsCount],
        itemStyle: {
          color: 'transparent'
        },
        label: {
          show: true,
          formatter: lastDate,
          position: 'top',
          offset: [0, -20],
          color: '#000',
          fontWeight: 'bold',
          fontSize: 11
        }
      },
      {
        xAxis: processedLabels === undefined ? null : processedLabels === null ? null : processedLabels?.[(processedLabels === undefined ? 0 : processedLabels === null ? 0 : processedLabels.length) - 1]
      }
    ]);
  }

  let series = [];
  if (metrics.length === 2 && metrics.some(m => m.key === 'air_temperature_sg') && metrics.some(m => m.key === 'water_temperature_sg')) {
    const airTempMetric = metrics.find(m => m.key === 'air_temperature_sg');
    const waterTempMetric = metrics.find(m => m.key === 'water_temperature_sg');

    series = [
      {
        name: airTempMetric?.name,
        type: 'bar',
        data: processedData.map(d =>
          d && typeof d?.[airTempMetric?.key] !== 'undefined' ? parseFloat(d?.[airTempMetric?.key]) : null
        ),
        itemStyle: { color: airTempMetric?.color },
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
      },
      {
        name: waterTempMetric?.name,
        type: 'line',
        data: processedData.map(d =>
          d && typeof d?.[waterTempMetric?.key] !== 'undefined' ? parseFloat(d?.[waterTempMetric?.key]) : null
        ),
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: waterTempMetric?.color },
      },
    ];
  } else {
    series = metrics.map((metric) => ({
      name: metric.name,
      type: 'bar',
      data: processedData.map(d =>
        d && typeof d?.[metric.key] !== 'undefined' ? parseFloat(d?.[metric.key]) : null
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
      label: metric.key === 'wind_speed_sg' ? {
        show: true,
        position: 'top',
        formatter: (params) => {
          const index = params.dataIndex;
          const d = processedData?.[index];
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
  }

  const fixedDataPointWidth = 20; // Aumentar um pouco para um zoom maior para pontos individuais
  const minChartWidth = (processedLabels === undefined ? 0 : processedLabels === null ? 0 : processedLabels.length) * fixedDataPointWidth;
  // A largura final do gráfico será o máximo entre a largura calculada e a largura do contêiner pai.
  const chartWidth = Math.max(minChartWidth, containerWidth || 0);


  // Logic to determine the Y-axis unit
  let yAxisName = '';
  if (metrics.length > 0) {
      // Get all unique units from the metrics passed to the component
      const uniqueUnits = [...new Set(metrics.map(m => m.unit))];
      // If there's only one unique unit, use it
      if (uniqueUnits.length === 1) {
          yAxisName = uniqueUnits[0];
      } else {
          // If there are multiple units, list them separated by '/'
          // This is useful if different metrics have different units
          yAxisName = uniqueUnits.join(' / ');
      }
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let content = `<strong>${params?.[0]?.axisValueLabel}</strong><br/>`;
        params.forEach(p => {
          if (p.value !== null && p.value !== undefined) {
            content += `${p.marker}${p.seriesName}: <b>${formatNumber(p.value, p.seriesName.includes('Nível') ? 2 : 1)}${getMetricUnit(p.seriesName, metrics)}</b><br/>`;
          }
        });
        // Add specific info for wave height
        const mainKey = metrics[0]?.key;
        if (mainKey === 'wave_height_sg' && params?.[0]?.dataIndex !== undefined) {
            const d = processedData?.[params[0].dataIndex];
            if (d && Object.keys(d).length !== 0 && !processedLabels?.[params[0].dataIndex]?.startsWith('___EMPTY_SLOT_')) {
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
            }
        } else if (mainKey === 'wind_speed_sg' && params?.[0]?.dataIndex !== undefined) {
            const d = processedData?.[params[0].dataIndex];
            if (d && Object.keys(d).length !== 0 && !processedLabels?.[params[0].dataIndex]?.startsWith('___EMPTY_SLOT_')) {
                content += `<hr/>Direção do Vento: ${getDirection(d.wind_direction_sg)}<br/>`;
            }
        } else if (mainKey === 'air_temperature_sg' && params?.[0]?.dataIndex !== undefined) {
            const d = processedData?.[params[0].dataIndex];
            if (d && Object.keys(d).length !== 0 && !processedLabels?.[params[0].dataIndex]?.startsWith('___EMPTY_SLOT_')) {
                content += `<hr/>Umidade: ${formatNumber(d.humidity_sg, 0)}%<br/>`;
            }
        } else if (mainKey === 'sea_level_sg' && params?.[0]?.dataIndex !== undefined) {
            const d = processedData?.[params[0].dataIndex];
            if (d && Object.keys(d).length !== 0 && !processedLabels?.[params[0].dataIndex]?.startsWith('___EMPTY_SLOT_')) {
                content += `<hr/>Fase da Maré: <strong>${d.tide_phase === 'rising' ? 'Subindo' : 'Descendo'}</strong><br/>`;
            }
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
      top: 60,
      bottom: 70,
    },
    xAxis: {
      type: 'category',
      data: processedLabels,
      axisLabel: {
        rotate: 45,
        fontSize: 11,
        formatter: (val) => val?.startsWith('___EMPTY_SLOT_') ? '' : val?.split(', ')[1],
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      axisLabel: {
        fontSize: 12,
        formatter: (value) => formatNumber(value, 1),
      },
    },
    series,
  };

  return (
    <div ref={chartContainerRef} style={{ width: '100%', overflowX: 'auto' }}> {/* Adicionar o ref e overflowX */}
      <ReactECharts option={option} style={{ height: 260, width: chartWidth }} />
    </div>
  );
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
  return directions?.[index];
}

function getMetricUnit(name, metrics) {
  const found = metrics?.find(m => m.name === name);
  return found?.unit || '';
}

export default ForecastChart;