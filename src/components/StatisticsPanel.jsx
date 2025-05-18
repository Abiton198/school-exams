import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend);

export default function StatisticsPanel({ results }) {
  const grades = [...new Set(results.map(r => r.grade))];
  const passCount = results.filter(r => parseFloat(r.percentage) >= 50).length;
  const failCount = results.length - passCount;

  const avgByGrade = grades.map(g => {
    const filtered = results.filter(r => r.grade === g);
    const avg = filtered.reduce((sum, r) => sum + parseFloat(r.percentage || 0), 0) / (filtered.length || 1);
    return { grade: g, avg: avg.toFixed(2) };
  });

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Bar Chart - Avg % by Grade */}
      <div className="bg-white shadow-md rounded-lg p-4">
        <h4 className="text-lg font-semibold mb-2 text-center">Average % per Grade</h4>
        <Bar
          data={{
            labels: avgByGrade.map(a => a.grade),
            datasets: [{
              label: 'Average %',
              data: avgByGrade.map(a => a.avg),
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
            }]
          }}
          options={{ responsive: true, maintainAspectRatio: false }}
          height={20}
        />
      </div>

      {/* Pie Chart - Pass vs Fail */}
      <div className="bg-white shadow-md rounded-lg p-4">
        <h4 className="text-lg font-semibold mb-2 text-center">Pass vs Fail</h4>
        <Pie
          data={{
            labels: ['Pass', 'Fail'],
            datasets: [{
              data: [passCount, failCount],
              backgroundColor: ['#16a34a', '#dc2626'],
            }]
          }}
          options={{ responsive: true, maintainAspectRatio: false }}
          height={20}
        />
      </div>
    </div>
  );
}
