import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Register chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend);

export default function StatisticsPanel({ results }) {
  // Extract unique grades from result data
  const grades = [...new Set(results.map(r => r.grade))];

  // Count how many students passed or failed
  const passCount = results.filter(r => parseFloat(r.percentage) >= 50).length;
  const failCount = results.length - passCount;

  // Calculate average % per grade
  const avgByGrade = grades.map(g => {
    const filtered = results.filter(r => r.grade === g);
    const avg = filtered.reduce((sum, r) => sum + parseFloat(r.percentage || 0), 0) / (filtered.length || 1);
    return { grade: g, avg: avg.toFixed(2) };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* Card 1: Bar chart for average percentage per grade */}
      <div className="bg-white rounded shadow p-3 h-[220px]">
        <h4 className="text-sm font-semibold mb-2 text-center">📊 Average % per Grade</h4>
        <div className="h-[150px]">
          <Bar
            data={{
              labels: avgByGrade.map(a => a.grade),
              datasets: [{
                label: 'Average %',
                data: avgByGrade.map(a => a.avg),
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: {
                  ticks: { font: { size: 9 } }
                },
                x: {
                  ticks: { font: { size: 9 } }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Card 2: Pie chart for pass vs fail */}
      <div className="bg-white rounded shadow p-3 h-[220px]">
        <h4 className="text-sm font-semibold mb-2 text-center">🎯 Pass vs Fail</h4>
        <div className="h-[150px]">
          <Pie
            data={{
              labels: ['Pass', 'Fail'],
              datasets: [{
                data: [passCount, failCount],
                backgroundColor: ['#16a34a', '#dc2626'],
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    font: { size: 10 }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Card 3: Summary counts */}
      <div className="bg-white rounded shadow p-3 h-[220px] flex flex-col justify-center items-center">
        <h4 className="text-sm font-semibold mb-3">📈 Quick Stats</h4>
        <p className="text-green-600 font-bold text-lg">✅ Passed: {passCount}</p>
        <p className="text-red-600 font-bold text-lg">❌ Failed: {failCount}</p>
        <p className="text-blue-600 font-bold text-md mt-2">Total: {results.length}</p>
      </div>
    </div>
  );
}
