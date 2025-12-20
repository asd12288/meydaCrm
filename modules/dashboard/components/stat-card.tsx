'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  chartData?: number[];
}

const colorConfig = {
  primary: {
    bg: 'bg-lightprimary dark:bg-lightprimary/20',
    icon: 'bg-primary text-white',
    chart: 'var(--color-primary)',
  },
  secondary: {
    bg: 'bg-lightsecondary dark:bg-lightsecondary/20',
    icon: 'bg-secondary text-white',
    chart: 'var(--color-secondary)',
  },
  success: {
    bg: 'bg-lightsuccess dark:bg-lightsuccess/20',
    icon: 'bg-success text-white',
    chart: 'var(--color-success)',
  },
  warning: {
    bg: 'bg-lightwarning dark:bg-lightwarning/20',
    icon: 'bg-warning text-white',
    chart: 'var(--color-warning)',
  },
  error: {
    bg: 'bg-lighterror dark:bg-lighterror/20',
    icon: 'bg-error text-white',
    chart: 'var(--color-error)',
  },
  info: {
    bg: 'bg-lightinfo dark:bg-lightinfo/20',
    icon: 'bg-info text-white',
    chart: 'var(--color-info)',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color,
  chartData,
}: StatCardProps) {
  const config = colorConfig[color];

  const chartConfig = chartData
    ? {
        series: [{ name: title, data: chartData }],
        chart: {
          type: 'area' as const,
          height: 60,
          sparkline: { enabled: true },
          fontFamily: 'inherit',
        },
        stroke: { curve: 'smooth' as const, width: 2 },
        colors: [config.chart],
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 0,
            opacityFrom: 0.4,
            opacityTo: 0,
            stops: [0, 100],
          },
        },
        tooltip: { theme: 'dark', x: { show: false } },
      }
    : null;

  return (
    <div className={`rounded-xl p-5 ${config.bg}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.icon}`}>
          {icon}
        </span>
        <span className="text-sm font-medium text-darklink">{title}</span>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-3xl font-bold text-ld">{value}</h3>
          {subtitle && <p className="text-xs text-darklink mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-semibold ${trend.positive ? 'text-success' : 'text-error'}`}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
        
        {chartData && chartConfig && (
          <div className="w-24">
            <Chart
              options={chartConfig}
              series={chartConfig.series}
              type="area"
              height={60}
              width="100%"
            />
          </div>
        )}
      </div>
    </div>
  );
}
