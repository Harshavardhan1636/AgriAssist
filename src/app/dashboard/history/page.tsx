'use client';

import { useState, useEffect } from "react";
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
  const [history, setHistory] = useState<any[]>([]);
  const { t } = useI18n();

  useEffect(() => {
    // Load history from localStorage
    try {
      const historyKey = 'agriassist_analysis_history';
      const storedHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      setHistory(storedHistory);
    } catch (error) {
      console.error("Error loading history from localStorage:", error);
      setHistory([]);
    }
  }, []);

  const filteredHistory = history.filter((analysis) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      search === "" ||
      (analysis.disease && analysis.disease.toLowerCase().includes(searchLower)) ||
      (analysis.crop && analysis.crop.toLowerCase().includes(searchLower));
    const matchesCrop = cropFilter === "all" || (analysis.crop && analysis.crop === cropFilter);

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
              <SelectItem value="Rice">{t('Rice')}</SelectItem>
              <SelectItem value="Wheat">{t('Wheat')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Disease')}</TableHead>
                <TableHead>{t('Confidence')}</TableHead>
                <TableHead>{t('Severity')}</TableHead>
                <TableHead>{t('Risk')}</TableHead>
                <TableHead>{t('Date')}</TableHead>
                <TableHead>
                  <span className="sr-only">{t('Actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((analysis) => (
                  <TableRow key={analysis.id}>
                    <TableCell className="font-medium">{analysis.disease || 'Unknown'}</TableCell>
                    <TableCell>
                      {analysis.confidence ? `${Math.round(analysis.confidence * 100)}%` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={analysis.severity === 'High' ? 'destructive' : 'secondary'}>
                        {analysis.severity || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(analysis.preview?.riskScore || 0) > 70 ? 'destructive' : 'outline'}>
                        {analysis.preview?.riskScore || 0}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {analysis.timestamp ? format(new Date(analysis.timestamp), "PPP") : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/history/${analysis.id}`}>{t('View')}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t('No analysis history found. Complete an analysis to see results here.')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}