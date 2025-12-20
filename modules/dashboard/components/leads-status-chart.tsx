'use client';

import dynamic from 'next/dynamic';
import { CardBox } from '@/modules/shared';
import { LEAD_STATUS_LABELS } from '@/db/types';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface LeadsStatusChartProps {
  leadsByStatus: Record<string, number>;
  totalLeads: number;
}

// Simplified status color mapping - 3 semantic categories only
// Positive (won, deposit, rdv) → success green
// Negative (lost, not_interested, wrong_number) → muted gray
// Neutral (everything else) → primary blue shades
type StatusCategory = 'positive' | 'negative' | 'neutral';

const getStatusCategory = (status: string): StatusCategory => {
  if (['won', 'deposit', 'rdv'].includes(status)) return 'positive';
  if (['lost', 'not_interested', 'wrong_number', 'no_answer', 'no_answer_2'].includes(status)) return 'negative';
  return 'neutral';
};

// Chart colors - professional palette (primary blue + grays)
// Using darker shades to ensure visibility on both light and dark backgrounds
const chartColorPalette = [
  'var(--color-primary)',   // Primary blue (#00A1FF)
  '#475569',                // Slate-600 (darker)
  '#64748b',                // Slate-500
  '#94a3b8',                // Slate-400
  '#78716c',                // Stone-500
  '#a8a29e',                // Stone-400
];


const getStatusChartColor = (index: number): string => {
  return chartColorPalette[index % chartColorPalette.length];
};

// Legend badge classes - simplified
const getLegendBadgeClass = (status: string): string => {
  const category = getStatusCategory(status);
  if (category === 'positive') return 'dashboard-legend-badge positive';
  if (category === 'negative') return 'dashboard-legend-badge negative';
  return 'dashboard-legend-badge';
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
  // Use simplified color palette
  const chartColors = sortedStatuses.map((_, index) => getStatusChartColor(index));

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
              return (
                <div
                  key={status}
                  className="dashboard-legend-item cursor-default"
                >
                  <span className={getLegendBadgeClass(status)}>
                    {percentage}%
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ld">
                      {LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] || status}
                    </p>
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
