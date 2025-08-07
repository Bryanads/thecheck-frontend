import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função auxiliar para formatar hora
function formatTime(isoDate) {
    try {
        const date = new Date(isoDate);
        return format(date, 'HH:mm', { locale: ptBR });
    } catch (error) {
        console.error("Erro ao formatar a data:", error);
        return "Horário Inválido";
    }
}

// Função para converter graus para direção cardeal
const getCardinalDirection = (degrees) => {
    if (degrees === undefined || degrees === null) return 'N/A';
    const val = Math.floor((degrees / 22.5) + 0.5);
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
};

// Componente para a seta de direção
const DirectionArrow = ({ degrees }) => {
    if (degrees === undefined || degrees === null || isNaN(degrees)) return null;
    // Ajuste de +90 para que a seta aponte 'para cima' quando 0 graus (Norte) e gire corretamente
    return (
        <svg
            className="inline-block ml-1"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            style={{ transform: `rotate(${degrees}deg)` }}
        >
            <path fill="currentColor" d="M12 2L6 12h3v10h6V12h3z" />
        </svg>
    );
};

const RecommendationCard = ({ recommendation }) => {
    const [expanded, setExpanded] = useState(false);

    if (!recommendation) {
        return <div className="p-4 border rounded shadow-md">Nenhuma recomendação disponível.</div>;
    }

    const {
        local_time,
        suitability_score,
        forecast_conditions,
        tide_info, 
        detailed_scores,     
        spot_name,           
    } = recommendation;


    
    const toggleExpanded = () => setExpanded((prev) => !prev);

    const formattedTime = formatTime(local_time);

    // Dados da Previsão (com valores padrão para segurança)
    const swellHeight = parseFloat(forecast_conditions?.swell_height_sg);
    const swellPeriod = parseFloat(forecast_conditions?.swell_period_sg);
    const swellDirectionDegrees = parseFloat(forecast_conditions?.swell_direction_sg);
    const swellDirectionCardinal = getCardinalDirection(swellDirectionDegrees);

    const windSpeed = parseFloat(forecast_conditions?.wind_speed_sg);
    const windDirectionDegrees = parseFloat(forecast_conditions?.wind_direction_sg);
    const windDirectionCardinal = getCardinalDirection(windDirectionDegrees);

    const tideHeight = parseFloat(tide_info?.sea_level_sg);
    const tideType = tide_info?.tide_phase || 'N/A';

    const currentSpeed = parseFloat(forecast_conditions?.current_speed_sg);
    const airTemp = parseFloat(forecast_conditions?.air_temperature_sg);
    const waterTemp = parseFloat(forecast_conditions?.water_temperature_sg);

    // Funções de formatação e cor para scores
    const suitabilityPercentage = suitability_score !== undefined && suitability_score !== null && !isNaN(suitability_score)
        ? (suitability_score ).toFixed(0)
        : 'N/A';

    const scoreColorClass = (score) => {
        if (score === undefined || score === null || isNaN(score)) return 'text-gray-500';
        if (score >= 75) return 'text-green-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const formatScore = (score) => {
        return score !== undefined && score !== null && !isNaN(score) ? (score ).toFixed(0) : 'N/A';
    };

    return (
        <div
            className="bg-white rounded-lg shadow-md p-4 transition-all duration-300 ease-in-out cursor-pointer hover:shadow-lg"
            onClick={toggleExpanded}
        >
            {!expanded ? (
                // Conteúdo do Cartão Normal (Compacto)
                <>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-xl text-blue-800">{formattedTime}</h3>
                        <span className={`font-extrabold text-xl ${scoreColorClass(suitability_score)}`}>
                            {suitabilityPercentage}
                        </span>
                    </div>
                    {spot_name && <p className="text-gray-700 text-sm mb-2">{spot_name}</p>}

                    <div className="grid grid-cols-2 gap-y-1 text-gray-700 text-sm">
                        <div>
                            <span className="font-semibold">Onda:</span> {swellHeight ? `${swellHeight.toFixed(1)}m` : 'N/A'}
                        </div>
                        <div>
                            <span className="font-semibold">Vento:</span> {windSpeed ? `${windSpeed.toFixed(0)}m/s` : 'N/A'} {windDirectionCardinal} {windDirectionDegrees && <DirectionArrow degrees={windDirectionDegrees} />}
                        </div>
                        <div>
                            <span className="font-semibold">Direção:</span> {swellDirectionCardinal} {swellDirectionDegrees && <DirectionArrow degrees={swellDirectionDegrees} />}
                        </div>
                        <div>
                            <span className="font-semibold">Maré:</span> {tideType}
                        </div>
                    </div>
                </>
            ) : (
                // Conteúdo do Cartão Expandido
                <>
                    {/* Scores Detalhados no topo quando expandido */}
                    {detailed_scores && (
                        <div className="mb-4 pb-2 border-b border-gray-200">
                            <h4 className="font-bold text-lg text-gray-800 mb-2">Scores Detalhados:</h4>
                            <ul className="list-none space-y-1 text-gray-700 text-sm">
                                <li className="flex justify-between items-center">
                                    <span>Score Geral:</span>
                                    <span className={`${scoreColorClass(suitability_score)} font-bold`}>
                                        {suitabilityPercentage}
                                    </span>
                                </li>
                                <li className="flex justify-between items-center">
                                    <span>Altura da Onda:</span>
                                    <span className={`${detailed_scores.height_total_score} font-normal`}>
                                        {formatScore(detailed_scores.height_total_score) + '/25'}
                                    </span>
                                </li>
                                <li className="flex justify-between items-center">
                                    <span>Período da Onda:</span>
                                    <span className={`${detailed_scores.period_total_score} font-normal`}>
                                        {formatScore(detailed_scores.period_total_score) + '/10'}
                                    </span>
                                </li>
                                <li className="flex justify-between items-center">
                                    <span>Direção da Onda:</span>
                                    <span className={`${detailed_scores.direction_total_score} font-normal`}>
                                        {formatScore(detailed_scores.direction_total_score)+ '/3'}
                                    </span>
                                </li>
                                <li className="flex justify-between items-center">
                                    <span>Vento:</span>
                                    <span className={`${detailed_scores.wind_score} font-medium`}>
                                        {formatScore(detailed_scores.wind_score)+ '/25'}
                                    </span>
                                </li>
                                <li className="flex justify-between items-center">
                                    <span>Maré:</span>
                                    <span className={`${detailed_scores.tide_score} font-medium`}>
                                        {formatScore(detailed_scores.tide_score)+ '/18'}
                                    </span>
                                </li>
                                {detailed_scores.current_speed_score !== undefined && (
                                    <li className="flex justify-between items-center">
                                        <span>Correnteza:</span>
                                        <span className={`${detailed_scores.current_speed_score} font-medium`}>
                                            {formatScore(detailed_scores.current_speed_score)+ '/3'}
                                        </span>
                                    </li>
                                )}
                                {detailed_scores.secondary_swell_impact_score !== undefined && (
                                    <li className="flex justify-between items-center">
                                        <span>Impacto do Swell Secundário:</span>
                                        <span className={`${detailed_scores.secondary_swell_impact_score} font-medium`}>
                                            {formatScore(detailed_scores.secondary_swell_impact_score)+ '/0'}
                                        </span>
                                    </li>
                                )}
                                {detailed_scores.air_temperature_score !== undefined && (
                                    <li className="flex justify-between items-center">
                                        <span>Temp. Ar:</span>
                                        <span className={`${detailed_scores.air_temperature_score} font-medium`}>
                                            {formatScore(detailed_scores.air_temperature_score)+ '/8'}
                                        </span>
                                    </li>
                                )}
                                {detailed_scores.water_temperature_score !== undefined && (
                                    <li className="flex justify-between items-center">
                                        <span>Temp. Água:</span>
                                        <span className={`${detailed_scores.water_temperature_score} font-medium`}>
                                            {formatScore(detailed_scores.water_temperature_score)+ '/8'}
                                        </span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Detalhes da Previsão na parte de baixo quando expandido */}
                    <div className="mt-4">
                        <h4 className="font-bold text-lg text-gray-800 mb-2">Detalhes da Previsão:</h4>
                        <ul className="list-none space-y-1 text-gray-700 text-sm">
                            <li>
                                <span className="font-medium">Horário:</span> {formattedTime}
                            </li>
                            {spot_name && (
                                <li>
                                    <span className="font-medium">Spot:</span> {spot_name}
                                </li>
                            )}
                            <li>
                                <span className="font-medium">Ondulação:</span> {swellHeight ? `${swellHeight.toFixed(1)}m` : 'N/A'} ({swellPeriod ? `${swellPeriod.toFixed(0)}s` : 'N/A'}) de {swellDirectionCardinal} {swellDirectionDegrees && <DirectionArrow degrees={swellDirectionDegrees} />}
                            </li>
                            <li>
                                <span className="font-medium">Vento:</span> {windSpeed ? `${windSpeed.toFixed(0)} m/s` : 'N/A'} de {windDirectionCardinal} {windDirectionDegrees && <DirectionArrow degrees={windDirectionDegrees} />}
                            </li>
                            <li>
                                <span className="font-medium">Maré:</span> {tideType} {tideHeight !== undefined && tideHeight !== null && !isNaN(tideHeight) ? `(${tideHeight.toFixed(1)}m)` : ''}
                            </li>
                            {currentSpeed !== undefined && !isNaN(currentSpeed) && (
                                <li>
                                    <span className="font-medium">Correnteza:</span> {currentSpeed.toFixed(1)} m/s
                                </li>
                            )}
                            {airTemp !== undefined && !isNaN(airTemp) && (
                                <li>
                                    <span className="font-medium">Temp. Ar:</span> {airTemp.toFixed(0)}°C
                                </li>
                            )}
                            {waterTemp !== undefined && !isNaN(waterTemp) && (
                                <li>
                                    <span className="font-medium">Temp. Água:</span> {waterTemp.toFixed(0)}°C
                                </li>
                            )}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
};

export default RecommendationCard;