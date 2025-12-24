'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { CardBox, InlineDropdown } from '@/modules/shared';
import type { TrendYearsData } from '../types';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// French month names
const MONTH_NAMES = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

interface LeadsTrendChartProps {
  trendData: TrendYearsData;
}

type ViewMode = 'all' | 'year';

export function LeadsTrendChart({ trendData }: LeadsTrendChartProps) {
  const { years, monthlyData } = trendData;
  const currentYear = new Date().getFullYear();
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedYear, setSelectedYear] = useState<number>(
    years.includes(currentYear) ? currentYear : years[0] || currentYear
  );

  // Calculate yearly totals for "all time" view
  const sortedYears = [...years].sort((a, b) => a - b); // Ascending for timeline
  const yearlyTotals = sortedYears.map((year) => {
    const yearData = monthlyData[year] || [];
    return {
      year,
      assigned: yearData.reduce((sum, m) => sum + (m.assigned || 0), 0),
    };
  });

  // Data for current view
  const isAllTime = viewMode === 'all';
  const yearData = monthlyData[selectedYear] || [];

  // Single line showing assigned leads
  const series = isAllTime
    ? [
        {
          name: 'Leads',
          data: yearlyTotals.map((y) => y.assigned),
        },
      ]
    : [
        {
          name: 'Leads',
          data: yearData.map((point) => point.assigned || 0),
        },
      ];

  const categories = isAllTime
    ? sortedYears.map((y) => y.toString())
    : MONTH_NAMES;

  const chartConfig: ApexCharts.ApexOptions = {
    chart: {
      type: 'line',
      height: 320,
      fontFamily: 'inherit',
      foreColor: '#adb0bb',
      toolbar: { show: false },
      zoom: { enabled: false },
      sparkline: { enabled: false },
      background: 'transparent',
    },
    colors: ['#00A1FF'], // Primary blue - visible on both light and dark
    stroke: {
      curve: 'smooth',
      width: 3, // Thicker line for better visibility
    },
    markers: {
      size: 4, // Show markers for better visibility
      colors: ['#00A1FF'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: { size: 6 },
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.3,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    grid: {
      borderColor: '#e4e4e7',
      strokeDashArray: 4,
      padding: { left: 10, right: 10 },
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#71717a', fontSize: '11px' },
      },
    },
    yaxis: {
      labels: {
        style: { colors: '#71717a', fontSize: '11px' },
        formatter: (val: number) => {
          if (val >= 1000) {
            return `${(val / 1000).toFixed(0)}k`;
          }
          return Math.round(val).toString();
        },
      },
      min: 0,
    },
    legend: {
      show: false,
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      custom: function ({ series: s, seriesIndex, dataPointIndex, w }) {
        const value = s[seriesIndex][dataPointIndex];
        const label = w.globals.categoryLabels[dataPointIndex] || w.globals.labels[dataPointIndex];
        return `<div style="background: #1e293b; color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <strong>${label}</strong>: ${value.toLocaleString('fr-FR')} leads
        </div>`;
      },
    },
  };

  const hasData = isAllTime ? yearlyTotals.length > 0 : yearData.length > 0;

  return (
    <CardBox>
      <div className="flex items-center justify-between mb-4">
        <h5 className="card-title">Évolution des leads</h5>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="dashboard-period-toggle">
            <button
              onClick={() => setViewMode('all')}
              className={`dashboard-period-btn ${viewMode === 'all' ? 'active' : ''}`}
            >
              Historique
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`dashboard-period-btn ${viewMode === 'year' ? 'active' : ''}`}
            >
              Par année
            </button>
          </div>

          {/* Year selector (only visible in year mode) */}
          {viewMode === 'year' && (
            <InlineDropdown
              options={years.map((year) => ({
                value: String(year),
                label: String(year),
              }))}
              value={String(selectedYear)}
              onChange={(v) => setSelectedYear(Number(v))}
              widthClass="w-20"
              size="md"
            />
          )}
        </div>
      </div>

      {hasData ? (
        <Chart
          options={chartConfig}
          series={series}
          type="area"
          height={320}
          width="100%"
        />
      ) : (
        <div className="flex items-center justify-center h-80 text-darklink">
          Aucune donnée disponible
        </div>
      )}
    </CardBox>
  );
}
