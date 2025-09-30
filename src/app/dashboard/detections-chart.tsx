'use client';

import * as React from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from 'recharts';

// We'll pass the chart data as a prop now instead of using static data
const chartConfig = {
  detections: {
    label: 'Detections',
    color: 'hsl(var(--primary))',
  },
};

const DetectionsChart = React.memo(function DetectionsChart({ chartData }: { chartData: { day: string; detections: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <RechartsBarChart data={chartData} accessibilityLayer>
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="detections" fill="var(--color-detections)" radius={4} />
      </RechartsBarChart>
    </ChartContainer>
  );
});

export default DetectionsChart;