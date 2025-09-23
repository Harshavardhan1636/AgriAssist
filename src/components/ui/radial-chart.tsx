"use client"

import * as React from "react"
import { RadialBar, RadialBarChart as RechartsRadialBarChart } from "recharts"

import { ChartContainer } from "@/components/ui/chart"

const getSeverityColor = (percentage: number) => {
    if (percentage > 50) return "hsl(var(--destructive))";
    if (percentage > 20) return "hsl(var(--accent))";
    return "hsl(var(--primary))";
}


type RadialChartProps = {
    data: { name: string; value: number }[];
    mainText: string;
    subText: string;
};

export function RadialChart({ data, mainText, subText }: RadialChartProps) {
    const coloredData = data.map(item => ({...item, fill: getSeverityColor(item.value)}));

    return (
        <ChartContainer config={{}} className="mx-auto aspect-square h-[200px]">
            <RechartsRadialBarChart
                data={coloredData}
                startAngle={90}
                endAngle={-270}
                innerRadius="70%"
                outerRadius="100%"
            >
                <RadialBar dataKey="value" background={{ fill: 'hsl(var(--muted))' }} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-bold">
                    {mainText}
                </text>
                <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-sm">
                    {subText}
                </text>
            </RechartsRadialBarChart>
        </ChartContainer>
    );
}
