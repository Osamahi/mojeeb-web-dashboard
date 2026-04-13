import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { FunnelStep } from '../types/funnel.types';
import { FUNNEL_STAGES, STAGE_LABELS } from '../types/funnel.types';

interface FunnelChartProps {
  steps: FunnelStep[];
  skippedCount?: number;
  onBarClick?: (eventName: string) => void;
}

interface ChartRow {
  name: string;
  eventName: string;
  users: number;
  dropoff: string;
}

const BAR_COLOR = '#10b981';

export function FunnelChart({ steps, skippedCount, onBarClick }: FunnelChartProps) {
  const chartData = useMemo(() => {
    const stepMap = new Map(steps.map((s) => [s.eventName, s.uniqueUsers]));

    return FUNNEL_STAGES.map((stage, i) => {
      const users = stepMap.get(stage) ?? 0;
      const prevUsers = i > 0 ? (stepMap.get(FUNNEL_STAGES[i - 1]) ?? 0) : users;
      const dropPct = prevUsers > 0 && i > 0 ? ((prevUsers - users) / prevUsers) * 100 : 0;
      const dropoff = i === 0 ? '' : dropPct > 0 ? `-${dropPct.toFixed(0)}%` : '';

      return {
        name: STAGE_LABELS[stage] || stage,
        eventName: stage,
        users,
        dropoff,
      } as ChartRow;
    });
  }, [steps]);

  const maxValue = Math.max(...chartData.map((d) => d.users), 1);

  const handleClick = (data: any) => {
    if (onBarClick && data?.eventName) {
      onBarClick(data.eventName);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-500">Conversion Funnel</h3>
        {onBarClick && (
          <span className="text-xs text-neutral-400">Click a bar to see users</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <div style={{ minWidth: FUNNEL_STAGES.length * 80 }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
              margin={{ top: 30, right: 10, left: 10, bottom: 60 }}
              barCategoryGap="15%"
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#525252' }}
                axisLine={false}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis hide domain={[0, maxValue]} />
              <Tooltip
                formatter={(value: number) => [`${value} users`, 'Count']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 13 }}
              />
              <Bar
                dataKey="users"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
                cursor={onBarClick ? 'pointer' : undefined}
                onClick={handleClick}
                label={<CustomBarLabel maxValue={maxValue} chartData={chartData} />}
              >
                {chartData.map((entry, index) => {
                  const intensity = maxValue > 0 ? entry.users / maxValue : 0;
                  return (
                    <Cell
                      key={index}
                      fill={BAR_COLOR}
                      fillOpacity={Math.max(0.25, intensity)}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {skippedCount !== undefined && skippedCount > 0 && (
        <p className="text-xs text-neutral-400 mt-3 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
          {skippedCount} users skipped onboarding
        </p>
      )}
    </div>
  );
}

function CustomBarLabel(props: any) {
  const { x, y, width, value, index, chartData } = props;
  const row = chartData?.[index];
  if (!row) return null;

  return (
    <g>
      <text
        x={x + width / 2}
        y={y - 8}
        textAnchor="middle"
        fontSize={12}
        fontWeight={600}
        fill="#262626"
      >
        {value}
      </text>
      {row.dropoff && (
        <text
          x={x + width / 2}
          y={y - 22}
          textAnchor="middle"
          fontSize={10}
          fill="#ef4444"
        >
          {row.dropoff}
        </text>
      )}
    </g>
  );
}
