
'use client';

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockHistory } from "@/lib/mock-data";
import { format } from "date-fns";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/i18n-context";
import Link from "next/link";

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState("all");
  const { t } = useI18n();

  const filteredHistory = mockHistory.filter((analysis) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      search === "" ||
      analysis.crop.toLowerCase().includes(searchLower) ||
      analysis.predictions.some((p) =>
        t(p.label as any).toLowerCase().includes(searchLower)
      );
    const matchesCrop = cropFilter === "all" || analysis.crop === cropFilter;

    return matchesSearch && matchesCrop;
  });

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{t('Analysis History')}</CardTitle>
        <CardDescription>
          {t('Browse and review all past crop analyses.')}
        </CardDescription>
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-4">
          <Input 
            placeholder={t('Search by disease...')}
            className="w-full sm:max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={cropFilter} onValueChange={setCropFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('Filter by crop')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All Crops')}</SelectItem>
              <SelectItem value="Tomato">{t('Tomato')}</SelectItem>
              <SelectItem value="Potato">{t('Potato')}</SelectItem>
              <SelectItem value="Maize">{t('Maize')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  {t('Image')}
                </TableHead>
                <TableHead>{t('Crop')}</TableHead>
                <TableHead>{t('Top Diagnosis')}</TableHead>
                <TableHead>{t('Severity')}</TableHead>
                <TableHead>{t('Risk')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead>{t('Date')}</TableHead>
                <TableHead>
                  <span className="sr-only">{t('Actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((analysis) => (
                <TableRow key={analysis.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt="Crop image"
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={analysis.image}
                      width="64"
                      data-ai-hint={analysis.imageHint}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{t(analysis.crop as any)}</TableCell>
                  <TableCell>{t(analysis.predictions[0].label as any)}</TableCell>
                  <TableCell>
                    <Badge variant={analysis.severity.band === 'High' ? 'destructive' : 'secondary'}>
                      {t(analysis.severity.band as 'Low' | 'Medium' | 'High')} ({analysis.severity.percentage}%)
                    </Badge>
                  </TableCell>
                   <TableCell>
                    <Badge variant={analysis.risk.score > 0.7 ? 'destructive' : 'outline'}>
                      {Math.round(analysis.risk.score * 100)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={analysis.status === 'Pending Review' ? 'secondary' : 'outline'}>
                      {t(analysis.status as 'Completed' | 'Pending Review')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(analysis.timestamp), "PPP")}
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/history/${analysis.id}`}>{t('View')}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
