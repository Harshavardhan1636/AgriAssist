
'use client';

import * as React from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from 'recharts';

const chartData = [
  { day: 'Mon', detections: 5 },
  { day: 'Tue', detections: 8 },
  { day: 'Wed', detections: 12 },
  { day: 'Thu', detections: 7 },
  { day: 'Fri', detections: 15 },
  { day: 'Sat', detections: 11 },
  { day: 'Sun', detections: 9 },
];

const chartConfig = {
  detections: {
    label: 'Detections',
    color: 'hsl(var(--primary))',
  },
};

const DetectionsChart = React.memo(function DetectionsChart() {
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
