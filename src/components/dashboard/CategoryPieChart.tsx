import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { PieChart as PieChartIcon } from 'lucide-react';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryData {
  id: string;
  name: string;
  amount: number;
  color: string;
  transactionCount: number;
}

interface CategoryPieChartProps {
  data: CategoryData[];
  title?: string;
  className?: string;
}

export default function CategoryPieChart({ data, title = "Expenses by Category", className = "" }: CategoryPieChartProps) {
  // Filter out categories with zero amounts
  const filteredData = data.filter(item => item.amount > 0);

  if (filteredData.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <PieChartIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <PieChartIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">No data to display</h4>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Start adding transactions to see your spending breakdown
          </p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: filteredData.map(item => item.name),
    datasets: [
      {
        data: filteredData.map(item => item.amount),
        backgroundColor: filteredData.map(item => item.color),
        borderColor: filteredData.map(item => item.color),
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 15, // Reduced from default ~40 to 15 (approximately 50% reduction)
          font: {
            size: 12,
          },
          color: 'rgb(107, 114, 128)', // gray-500
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            const categoryData = filteredData[context.dataIndex];
            
            return [
              `${label}: ₦${new Intl.NumberFormat('en-NG').format(value)}`,
              `${percentage}% of total`,
              `${categoryData.transactionCount} transaction${categoryData.transactionCount !== 1 ? 's' : ''}`
            ];
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
    },
  };

  const totalAmount = filteredData.reduce((sum, item) => sum + item.amount, 0);
  const totalTransactions = filteredData.reduce((sum, item) => sum + item.transactionCount, 0);

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 transition-colors duration-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <PieChartIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totalTransactions} transaction{totalTransactions !== 1 ? 's' : ''} • ₦{new Intl.NumberFormat('en-NG').format(totalAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative h-64 sm:h-80 mb-6">
        <Pie data={chartData} options={options} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {filteredData.length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Categories</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalTransactions}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Transactions</p>
        </div>
        <div className="text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₦{new Intl.NumberFormat('en-NG', { notation: 'compact' }).format(totalAmount)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
        </div>
      </div>
    </div>
  );
}