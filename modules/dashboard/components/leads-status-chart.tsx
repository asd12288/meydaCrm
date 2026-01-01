'use client';

import { useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { CardBox, Spinner } from '@/modules/shared';
import { LEAD_STATUS_LABELS } from '@/db/types';
import { getStatusChartColor, DISPLAY_LIMITS } from '@/lib/constants';
import { getStatusChartDataFiltered } from '../lib/actions';
import type { ChartTimePeriod } from '../types';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const PERIOD_OPTIONS: { value: ChartTimePeriod; label: string }[] = [
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
  { value: 'year', label: 'Année' },
  { value: 'all', label: 'Total' },
];

interface LeadsStatusChartProps {
  leadsByStatus: Record<string, number>;
  totalLeads: number;
  initialPeriod?: ChartTimePeriod;
}

export function LeadsStatusChart({
  leadsByStatus: initialLeadsByStatus,
  totalLeads: initialTotalLeads,
  initialPeriod = 'month',
}: LeadsStatusChartProps) {
  const [period, setPeriod] = useState<ChartTimePeriod>(initialPeriod);
  const [leadsByStatus, setLeadsByStatus] = useState(initialLeadsByStatus);
  const [totalLeads, setTotalLeads] = useState(initialTotalLeads);
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (newPeriod: ChartTimePeriod) => {
    if (newPeriod === period) return;
    setPeriod(newPeriod);

    startTransition(async () => {
      const data = await getStatusChartDataFiltered(newPeriod);
      setLeadsByStatus(data.leadsByStatus);
      setTotalLeads(data.totalLeads);
    });
  };
  // Sort statuses by count and get top ones
  const sortedStatuses = Object.entries(leadsByStatus)
    .sort(([, a], [, b]) => b - a)
    .slice(0, DISPLAY_LIMITS.STATUS_DISTRIBUTION);

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
      <div className="flex items-center justify-between mb-6">
        <h5 className="card-title">Répartition par statut</h5>
        <div className="flex items-center gap-1">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePeriodChange(option.value)}
              disabled={isPending}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === option.value
                  ? 'bg-primary text-white'
                  : 'text-darklink hover:bg-lightprimary hover:text-primary'
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid grid-cols-12 gap-6 items-center relative ${isPending ? 'opacity-50' : ''}`}>
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Spinner size="md" />
          </div>
        )}
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
