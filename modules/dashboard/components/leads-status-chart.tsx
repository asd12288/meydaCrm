'use client';

import dynamic from 'next/dynamic';
import { CardBox } from '@/modules/shared';
import { LEAD_STATUS_LABELS } from '@/db/types';
import { getStatusChartColor } from '@/lib/constants';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface LeadsStatusChartProps {
  leadsByStatus: Record<string, number>;
  totalLeads: number;
}

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
  // Use semantic colors based on status (from centralized constants)
  const chartColors = sortedStatuses.map(([status]) => getStatusChartColor(status));

  const chartConfig: ApexCharts.ApexOptions = {
    series: chartSeries,
    labels: chartLabels,
    chart: {
      type: 'donut',
      height: 280,
      fontFamily: 'inherit',
      foreColor: '#64748b',
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
              color: '#64748b',
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
              return (
                <div
                  key={status}
                  className="flex items-center gap-3 py-1"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: chartColor }}
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
