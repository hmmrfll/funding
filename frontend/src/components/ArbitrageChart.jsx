import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';

// Регистрируем компоненты Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ArbitrageChart = ({ historyData, symbol }) => {
  // Проверяем, есть ли данные
  if (!historyData || historyData.length === 0) {
    return <div className="text-center py-6">No historical data available for {symbol}</div>;
  }

  // Определяем биржи, для которых есть данные
  const exchanges = new Set();
  historyData.forEach(item => {
    if (item.exchange1) exchanges.add(item.exchange1);
    if (item.exchange2) exchanges.add(item.exchange2);
  });

  // Готовим данные для графика
  const labels = historyData.map(item => {
    const date = new Date(item.timestamp);
    return format(date, 'HH:mm dd/MM');
  });

  // Создаем наборы данных для каждой биржи
  const datasets = [];
  
  exchanges.forEach(exchange => {
    const color = getExchangeColor(exchange);
    datasets.push({
      label: `${exchange} Rate`,
      data: historyData.map(item => {
        // Ищем ставку соответствующей биржи
        if (item.exchange1 === exchange) return parseFloat(item.rate1) * 100;
        if (item.exchange2 === exchange) return parseFloat(item.rate2) * 100;
        return null;
      }),
      borderColor: color.border,
      backgroundColor: color.background,
      tension: 0.1
    });
  });

  // Добавляем данные о разнице ставок
  datasets.push({
    label: 'Rate Difference',
    data: historyData.map(item => parseFloat(item.rate_difference) * 100),
    borderColor: 'rgb(75, 192, 192)',
    backgroundColor: 'rgba(75, 192, 192, 0.5)',
    tension: 0.1
  });

  const data = {
    labels,
    datasets
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Funding Rates for ${symbol}`
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(4)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return value.toFixed(4) + '%';
          }
        }
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <Line data={data} options={options} />
    </div>
  );
};

// Вспомогательная функция для определения цвета биржи
function getExchangeColor(exchange) {
  switch(exchange) {
    case 'Paradex':
      return {
        border: 'rgb(53, 162, 235)',
        background: 'rgba(53, 162, 235, 0.5)'
      };
    case 'HyperLiquid':
      return {
        border: 'rgb(255, 99, 132)',
        background: 'rgba(255, 99, 132, 0.5)'
      };
    case 'Binance':
      return {
        border: 'rgb(255, 159, 64)',
        background: 'rgba(255, 159, 64, 0.5)'
      };
    default:
      return {
        border: 'rgb(153, 102, 255)',
        background: 'rgba(153, 102, 255, 0.5)'
      };
  }
}

export default ArbitrageChart;