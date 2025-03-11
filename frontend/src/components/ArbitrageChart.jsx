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

  // Готовим данные для графика
  const labels = historyData.map(item => {
    const date = new Date(item.timestamp);
    return format(date, 'HH:mm dd/MM');
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Paradex Rate',
        data: historyData.map(item => parseFloat(item.paradex_rate) * 100), // Конвертируем в проценты
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.1
      },
      {
        label: 'HyperLiquid Rate',
        data: historyData.map(item => parseFloat(item.hyperliquid_rate) * 100), // Конвертируем в проценты
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1
      },
      {
        label: 'Rate Difference',
        data: historyData.map(item => parseFloat(item.rate_difference) * 100), // Конвертируем в проценты
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      }
    ]
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

export default ArbitrageChart;