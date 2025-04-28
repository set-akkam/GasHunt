import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PriceHistoryData {
  stationId: number;
  fuelType: string;
  price: number;
  recordedAt: string;
}

interface PriceHistoryGraphProps {
  stationId: number;
}

// Color mapping for different fuel types
const FUEL_COLORS = {
  PETROL: {
    border: 'rgb(34, 197, 94)', // green-500
    background: 'rgba(34, 197, 94, 0.2)'
  },
  DIESEL: {
    border: 'rgb(59, 130, 246)', // blue-500
    background: 'rgba(59, 130, 246, 0.2)'
  },
  PETROL_PREMIUM: {
    border: 'rgb(245, 158, 11)', // amber-500
    background: 'rgba(245, 158, 11, 0.2)'
  },
  DIESEL_PREMIUM: {
    border: 'rgb(99, 102, 241)', // indigo-500
    background: 'rgba(99, 102, 241, 0.2)'
  }
};

// Function to get fuel display name
const getFuelDisplayName = (fuelType: string): string => {
  return fuelType.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
};

export default function PriceHistoryGraph({ stationId }: PriceHistoryGraphProps) {
  const [priceHistory, setPriceHistory] = useState<PriceHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching price history for station:', stationId);
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/price-history/${stationId}?days=7`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Price history fetch error:', errorText);
          throw new Error(`Failed to fetch price history: ${errorText}`);
        }

        const data = await response.json();
        console.log('Price history data received:', data);
        setPriceHistory(data);
      } catch (err) {
        console.error('Error fetching price history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load price history');
      } finally {
        setLoading(false);
      }
    };

    if (stationId) {
      fetchPriceHistory();
    }
  }, [stationId]);

  if (!stationId) {
    return <div className="h-64 flex items-center justify-center text-gray-500">No station selected</div>;
  }

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Loading price history...</div>;
  }

  if (error) {
    return <div className="h-64 flex items-center justify-center text-red-600">{error}</div>;
  }

  if (priceHistory.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No price history available for this station yet
      </div>
    );
  }

  // Group data by fuel type
  const fuelTypes = [...new Set(priceHistory.map(record => record.fuelType))];
  const datasets = fuelTypes.map(fuelType => {
    const fuelData = priceHistory
      .filter(record => record.fuelType === fuelType)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    const colors = FUEL_COLORS[fuelType as keyof typeof FUEL_COLORS] || {
      border: 'rgb(156, 163, 175)', // gray-400 for unknown fuel types
      background: 'rgba(156, 163, 175, 0.2)'
    };

    return {
      label: getFuelDisplayName(fuelType),
      data: fuelData.map(record => record.price),
      borderColor: colors.border,
      backgroundColor: colors.background,
      tension: 0.3, // Add slight curve to lines
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    };
  });

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'Fuel Price History (Last 7 Days)',
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: €${context.parsed.y.toFixed(3)}`;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            if (typeof value === 'number') {
              return `€${value.toFixed(3)}`;
            }
            return value;
          }
        },
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const data = {
    labels: priceHistory
      .filter(record => record.fuelType === fuelTypes[0])
      .map(record => new Date(record.recordedAt).toLocaleDateString()),
    datasets,
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <Line options={options} data={data} />
    </div>
  );
} 