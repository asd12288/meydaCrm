'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { CardBox } from '@/modules/shared';
import type { LeadsTrendPoint } from '../types';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface LeadsTrendChartProps {
  trendData: LeadsTrendPoint[];
  showAssigned?: boolean;
}

export function LeadsTrendChart({ trendData, showAssigned = false }: LeadsTrendChartProps) {
  const [period, setPeriod] = useState<'7d' | '30d'>('30d');

  const filteredData = period === '7d' ? trendData.slice(-7) : trendData;

  const categories = filteredData.map((point) => {
    const date = new Date(point.date);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  });

  const series = [
    {
      name: 'Leads créés',
      data: filteredData.map((point) => point.created),
    },
    ...(showAssigned
      ? [
          {
            name: 'Leads assignés',
            data: filteredData.map((point) => point.assigned || 0),
          },
        ]
      : []),
    {
      name: 'Leads mis à jour',
      data: filteredData.map((point) => point.updated),
    },
  ];

  // Professional color palette - primary blue with neutral grays
  const chartColors = showAssigned 
    ? ['var(--color-primary)', '#94a3b8', '#cbd5e1'] // blue, slate-400, slate-300
    : ['var(--color-primary)', '#94a3b8']; // blue, slate-400

  const chartConfig: ApexCharts.ApexOptions = {
    series,
    chart: {
      type: 'bar',
      height: 320,
      fontFamily: 'inherit',
      foreColor: '#adb0bb',
      toolbar: { show: false },
      stacked: false,
    },
    colors: chartColors,
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '50%',
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    grid: {
      borderColor: 'rgba(0,0,0,0.05)',
      strokeDashArray: 3,
      padding: { left: 0, right: 0 },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#a1aab2' },
        rotate: 0,
        hideOverlappingLabels: true,
      },
    },
    yaxis: {
      labels: { style: { colors: '#a1aab2' } },
      min: 0,
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      markers: { size: 6 },
    },
    tooltip: { theme: 'dark' },
  };

  return (
    <CardBox>
      <div className="flex items-center justify-between mb-4">
        <h5 className="card-title">Évolution des leads</h5>
        
        <div className="dashboard-period-toggle">
          <button
            onClick={() => setPeriod('7d')}
            className={`dashboard-period-btn ${period === '7d' ? 'active' : ''}`}
          >
            7 jours
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`dashboard-period-btn ${period === '30d' ? 'active' : ''}`}
          >
            30 jours
          </button>
        </div>
      </div>

      <Chart
        options={chartConfig}
        series={chartConfig.series}
        type="bar"
        height={320}
        width="100%"
      />
    </CardBox>
  );
}
