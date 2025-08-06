// src/components/ChartComponent.jsx
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';

// Adicione showLegend nas props do componente
export default function ChartComponent({ data, metrics, showLegend }) { 
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 py-4">Dados insuficientes para o gráfico.</p>;
  }
  if (!metrics || metrics.length === 0) {
    return <p className="text-center text-gray-500 py-4">Nenhuma métrica especificada para o gráfico.</p>;
  }

  const getDirection = (deg) => {
    if (deg === undefined || deg === null) return 'N/A';
    const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  const formatNumber = (value, decimals = 1) => {
    const num = Number(value);
    return isNaN(num) ? 'N/A' : num.toFixed(decimals);
  };

  const chartData = data.map(item => {
    const dataPoint = {
      dateTime: item.local_date_time || 'N/A',
      dateOnly: item.local_date_time ? item.local_date_time.split(', ')[0] : 'N/A',
      timeOnly: item.local_date_time ? item.local_date_time.split(', ')[1] : 'N/A'
    };
    metrics.forEach(metric => {
      dataPoint[metric.key] = parseFloat(item[metric.key]);
    });
    return dataPoint;
  });

  const daySeparators = [];
  if (chartData.length > 0) {
    daySeparators.push(chartData[0].dateTime); 

    for (let i = 1; i < chartData.length; i++) {
      if (chartData[i].dateOnly !== chartData[i - 1].dateOnly) {
        daySeparators.push(chartData[i].dateTime);
      }
    }
  }

  const formatXAxisTick = (tickItem, index, ticks) => {
    const currentItem = chartData.find(d => d.dateTime === tickItem);
    if (!currentItem) return '';

    const { dateOnly, timeOnly } = currentItem;

    if (index === 0) {
        return `${dateOnly}\n${timeOnly}`;
    }
    
    const prevTickItemValue = (ticks && ticks[index - 1]) ? ticks[index - 1].value : '';
    const prevItem = chartData.find(d => d.dateTime === prevTickItemValue);
    const prevDateOnly = prevItem ? prevItem.dateOnly : '';

    if (dateOnly !== prevDateOnly) {
        return `${dateOnly}\n${timeOnly}`;
    }

    const hour = parseInt(timeOnly.split(':')[0], 10);
    if (hour % 3 === 0) {
        return timeOnly;
    }
    return '';
  };

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const forecastItem = data.find(item => item.local_date_time === label);

      if (!forecastItem) return null;

      const mainMetricKey = metrics[0].key;

      return (
        <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-lg text-gray-800 text-sm">
          <p className="font-bold text-blue-700 mb-2">{label}</p>
          
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{formatNumber(entry.value, entry.name.includes('Nível') ? 2 : 1)}{entry.unit}</span>
            </p>
          ))}

          <hr className="my-2 border-gray-200"/>

          {mainMetricKey === 'wave_height_sg' && (
            <>
              <p className="mb-1">Período da Onda Total: <span className="font-semibold">{formatNumber(forecastItem.wave_period_sg)} s</span></p>
              <p className="mb-2">Direção da Onda Total: {getDirection(forecastItem.wave_direction_sg)}</p> 
              
              <div className="mt-2 text-xs text-gray-600 border-t pt-2">
                <p className="font-semibold text-gray-700">Detalhes do Swell:</p>
                <p>Altura Swell Principal: {formatNumber(forecastItem.swell_height_sg)} m</p>
                <p>Período Swell Principal: {formatNumber(forecastItem.swell_period_sg)} s</p>
                <p>Direção Swell Principal: {getDirection(forecastItem.swell_direction_sg)}</p>

                {forecastItem.secondary_swell_height_sg && forecastItem.secondary_swell_height_sg > 0 && (
                  <div className="mt-1">
                    <p>Altura Swell Secundário: {formatNumber(forecastItem.secondary_swell_height_sg)} m</p>
                    <p>Período Swell Secundário: {formatNumber(forecastItem.secondary_swell_period_sg)} s</p>
                    <p>Direção Swell Secundário: {getDirection(forecastItem.secondary_swell_direction_sg)}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {mainMetricKey === 'wind_speed_sg' && (
            <p>Direção do Vento: {getDirection(forecastItem.wind_direction_sg)}</p>
          )}

          {mainMetricKey === 'air_temperature_sg' && (
            <p>Umidade do Ar: <span className="font-semibold">{formatNumber(forecastItem.humidity_sg, 0)}%</span></p>
          )}

          {mainMetricKey === 'sea_level_sg' && (
            <p>Fase da Maré: <span className="font-semibold">{forecastItem.tide_phase === 'rising' ? 'Subindo' : 'Descendo'}</span></p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        barCategoryGap="10%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        
        {daySeparators.map((dateTime, index) => (
          <ReferenceLine
            key={`ref-line-${index}`}
            x={dateTime}
            stroke="#999"
            strokeDasharray="3 3"
            strokeWidth={2}
          />
        ))}

        <XAxis
          dataKey="dateTime"
          tickFormatter={formatXAxisTick}
          interval="preserveStartEnd"
          minTickGap={20}
          angle={-45}
          textAnchor="end"
          height={60}
          stroke="#555"
        />
        <YAxis
          label={{ value: metrics[0].unit, angle: -90, position: 'insideLeft', offset: 10, fill: '#555' }}
          tickFormatter={(value) => formatNumber(value, metrics[0].unit === 'm' ? 2 : 1)}
          stroke="#555"
        />
        <Tooltip content={customTooltip} />
        {showLegend && <Legend wrapperStyle={{ position: 'relative', marginTop: '10px' }}/>} {/* Renderização Condicional */}
        
        {metrics.map((metric, index) => (
          <Bar key={metric.key} dataKey={metric.key} fill={metric.color} name={metric.name} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}