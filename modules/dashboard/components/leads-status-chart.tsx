'use client';

import dynamic from 'next/dynamic';
import { CardBox } from '@/modules/shared';
import { LEAD_STATUS_LABELS } from '@/db/types';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface LeadsStatusChartProps {
  leadsByStatus: Record<string, number>;
  totalLeads: number;
}

// Semantic color mapping for each status (uses DB keys, not French labels)
// Colors match the status meaning for better visual understanding
const STATUS_CHART_COLORS: Record<string, string> = {
  // Success (green) - Won/positive outcomes
  deposit: 'var(--color-success)',
  won: '#16a34a', // green-600

  // Warning (orange/yellow) - Active/in progress
  rdv: 'var(--color-warning)',
  callback: '#ea580c', // orange-600
  relance: '#d97706', // amber-600

  // Primary (blue) - Outreach
  mail: 'var(--color-primary)',
  contacted: '#0284c7', // sky-600

  // Info (cyan) - New
  new: 'var(--color-info)',

  // Secondary (purple/gray) - No response
  no_answer: 'var(--color-secondary)',
  no_answer_1: '#7c3aed', // violet-600
  no_answer_2: '#6366f1', // indigo-500

  // Error (red) - Lost/negative
  not_interested: 'var(--color-error)',
  wrong_number: '#dc2626', // red-600
  lost: '#be123c', // rose-700
};

// Get chart color for a status, with fallback
const getStatusChartColor = (status: string): string => {
  return STATUS_CHART_COLORS[status] || 'var(--color-secondary)';
};

// Tailwind classes for legend dots (for CSS variable colors)
const STATUS_DOT_CLASSES: Record<string, string> = {
  deposit: 'bg-success',
  rdv: 'bg-warning',
  mail: 'bg-primary',
  new: 'bg-info',
  no_answer: 'bg-secondary',
  not_interested: 'bg-error',
};

// Get dot class or return empty for inline style fallback
const getStatusDotClass = (status: string): string => {
  return STATUS_DOT_CLASSES[status] || '';
};

export function LeadsStatusChart({ leadsByStatus, totalLeads }: LeadsStatusChartProps) {
  // Sort statuses by count and get top 6
  const sortedStatuses = Object.entries(leadsByStatus)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  // Prepare chart data
  const chartSeries = sortedStatuses.map(([, count]) => count);
  const chartLabels = sortedStatuses.map(
    ([status]) => LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] || status
  );
  // Use semantic colors based on status
  const chartColors = sortedStatuses.map(([status]) => getStatusChartColor(status));

  const chartConfig: ApexCharts.ApexOptions = {
    series: chartSeries,
    labels: chartLabels,
    chart: {
      type: 'donut',
      height: 280,
      fontFamily: 'inherit',
      foreColor: '#adb0bb',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 600,
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: '28px',
              fontWeight: 700,
              offsetY: 5,
              formatter: (val: number) => val.toString(),
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '14px',
              fontWeight: 400,
              color: '#adb0bb',
              formatter: () => totalLeads.toString(),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    legend: { show: false },
    colors: chartColors,
    tooltip: {
      enabled: true,
      theme: 'dark',
      fillSeriesColor: false,
      style: {
        fontSize: '12px',
      },
      y: {
        formatter: (val: number) => `${val} leads`,
      },
      marker: {
        show: true,
      },
      custom: function({ series, seriesIndex, w }) {
        const label = w.globals.labels[seriesIndex];
        const value = series[seriesIndex];
        return `<div style="background: #1e293b; color: #fff; padding: 8px 12px; border-radius: 4px; font-size: 12px;">
          <strong>${label}</strong>: ${value} leads
        </div>`;
      },
    },
  };

  return (
    <CardBox className="h-full">
      <h5 className="card-title mb-6">Répartition par statut</h5>
      
      <div className="grid grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-6 col-span-12">
          <Chart
            options={chartConfig}
            series={chartConfig.series}
            type="donut"
            height={280}
            width="100%"
          />
        </div>
        
        <div className="lg:col-span-6 col-span-12">
          <div className="space-y-3">
            {sortedStatuses.map(([status, count]) => {
              const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              const chartColor = getStatusChartColor(status);
              const dotClass = getStatusDotClass(status);
              return (
                <div
                  key={status}
                  className="flex items-center gap-3 py-1"
                >
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${dotClass}`}
                    style={!dotClass ? { backgroundColor: chartColor } : undefined}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-ld truncate">
                        {LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] || status}
                      </p>
                      <span className="text-xs font-medium text-darklink">{percentage}%</span>
                    </div>
                    <p className="text-xs text-darklink">{count.toLocaleString('fr-FR')} leads</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </CardBox>
  );
}
