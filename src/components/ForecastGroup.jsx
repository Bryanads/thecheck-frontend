// src/components/ForecastGroup.jsx
import React from 'react';
import ChartComponent from './ChartComponent';

const ForecastGroup = ({ spotName, forecasts, error }) => {
  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg border border-red-200 mb-6 shadow-sm">
        <h4 className="font-semibold text-lg mb-2 text-red-800">{spotName}</h4>
        <p>Erro ao carregar previsões para este spot: {error}</p>
      </div>
    );
  }

  if (!forecasts || forecasts.length === 0) {
    return (
      <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg border border-yellow-200 mb-6 shadow-sm">
        <h4 className="font-semibold text-lg mb-2 text-yellow-800">{spotName}</h4>
        <p>Nenhuma previsão detalhada disponível para este spot.</p>
      </div>
    );
  }

  const sortedForecasts = forecasts;

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Gráfico de Altura da Onda Total */}
        <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-700 mb-3 text-lg">Altura da Onda Total</p>
          <ChartComponent
            data={sortedForecasts}
            metrics={[
              { key: "wave_height_sg", name: "Altura da Onda Total", color: "#4169E1", unit: "m" }
            ]}
          />
        </div>

        {/* Gráfico de Velocidade do Vento */}
        <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-700 mb-3 text-lg">Velocidade do Vento</p>
          <ChartComponent
            data={sortedForecasts}
            metrics={[
              { key: "wind_speed_sg", name: "Velocidade do Vento", color: "#228B22", unit: "m/s" }
            ]}
          />
        </div>

        {/* Gráfico de Temperatura do Ar e Água */}
        <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-700 mb-3 text-lg">Temperatura do Ar e Água</p>
          <ChartComponent
            data={sortedForecasts}
            metrics={[
              { key: "air_temperature_sg", name: "Temperatura do Ar", color: "#FF4500", unit: "°C" }, // Vermelho para o Ar
              { key: "water_temperature_sg", name: "Temperatura da Água", color: "#00BFFF", unit: "°C" } // Azul Claro para a Água
            ]}
          />
        </div>

        {/* Gráfico de Nível do Mar (Maré) */}
        <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-700 mb-3 text-lg">Nível do Mar (Maré)</p>
          <ChartComponent
            data={sortedForecasts}
            metrics={[
              { key: "sea_level_sg", name: "Nível do Mar", color: "#8A2BE2", unit: "m" }
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default ForecastGroup;