import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMillionAr } from '@/hook/format';
import { RotateCcw, ZoomIn, ZoomOut, TrendingUp, TrendingDown,Minus } from 'lucide-react';
import { useState } from 'react';

import { Card } from '../ui/Card';
type ChartPoint = {
  month?: string;
  day?: string;
  revenue?: number;
  buyers?: number;
  sellers?: number;
};

type BarStatProp = {
    title: string;
    data: ChartPoint[] | undefined;
    xAxisKey?: 'month' | 'day';
}

const zoomSteps = [1, 1.25, 1.6, 2];

function ChartZoomControls({ zoom, onZoomChange }: { zoom: number; onZoomChange: (zoom: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Zoom out"
        title="Zoom out"
        disabled={zoom === 1}
        onClick={() => onZoomChange(zoomSteps[Math.max(0, zoomSteps.indexOf(zoom) - 1)])}
        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        title="Zoom in"
        disabled={zoom === zoomSteps[zoomSteps.length - 1]}
        onClick={() => onZoomChange(zoomSteps[Math.min(zoomSteps.length - 1, zoomSteps.indexOf(zoom) + 1)])}
        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        aria-label="Reset chart zoom"
        title="Reset zoom"
        disabled={zoom === 1}
        onClick={() => onZoomChange(1)}
        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function getZoomedData<T>(data: T[] | undefined, zoom: number): T[] {
  if (!data?.length || zoom === 1) return data ?? [];
  const visibleCount = Math.max(2, Math.ceil(data.length / zoom));
  const start = Math.max(0, Math.floor((data.length - visibleCount) / 2));
  return data.slice(start, start + visibleCount);
}

const BarStat = ({title,data,xAxisKey = 'month'}: BarStatProp) => {
  const [zoom, setZoom] = useState(1);
  const chartData = getZoomedData(data, zoom);
  const maxRevenue = Math.max(...chartData.map((point) => Number(point.revenue ?? 0)), 0);
    return (
        <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold font-display text-secondary-foreground">{title}</h2>
      <ChartZoomControls zoom={zoom} onZoomChange={setZoom} />
      </div>
          <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, maxRevenue / zoom || 1]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(v) => [formatMillionAr(Number(v ?? 0)), 'Revenue']} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="revenue" fill="#0077B6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
    )
}

const LineStat = ({title,data,xAxisKey = 'month'}: BarStatProp) => {
    const [zoom, setZoom] = useState(1);
    const chartData = getZoomedData(data, zoom);
    const maxUsers = Math.max(...chartData.flatMap((point) => [Number(point.buyers ?? 0), Number(point.sellers ?? 0)]), 0);
    return (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold font-display text-secondary-foreground">{title}</h2>
            <ChartZoomControls zoom={zoom} onZoomChange={setZoom} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, maxUsers / zoom || 1]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
              <Line dataKey="buyers" stroke="#0077B6" strokeWidth={2.5} dot={false} name="Buyers" />
              <Line dataKey="sellers" stroke="#5ABCB9" strokeWidth={2.5} dot={false} name="Sellers" />
            </LineChart>
          </ResponsiveContainer>
        </div>
    )
}

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  color?: string;
}

export function StatCard({ title, value, change, icon, color = '#0077B6' }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18`, color }}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold font-display text-secondary-foreground mb-0.5">{value}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </Card>
  );
}

export { BarStat, LineStat };
