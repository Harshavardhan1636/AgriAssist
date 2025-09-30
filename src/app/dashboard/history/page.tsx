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
import { Trash2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState("all");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemoData, setIsDemoData] = useState(false);
  const { t } = useI18n();
  const { isDemoUser } = useAuth(); // Get demo user status

  useEffect(() => {
    fetchHistory();
  }, [isDemoUser]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // For demo users, we can still use localStorage as a fallback
      // For real users, we would fetch from the API
      if (isDemoUser) {
        // Load history from localStorage for demo users
        try {
          const historyKey = 'agriassist_analysis_history';
          const storedHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
          setHistory(storedHistory);
          setIsDemoData(true);
        } catch (error) {
          console.error("Error loading history from localStorage:", error);
          setHistory([]);
        }
      } else {
        // For real users, fetch from API
        const response = await fetch('/api/analyses');
        const data = await response.json();
        
        if (data.success) {
          setHistory(data.data.analyses);
          setIsDemoData(data.data.isDemoData || false);
        } else {
          // Fallback to localStorage if API fails
          try {
            const historyKey = 'agriassist_analysis_history';
            const storedHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
            setHistory(storedHistory);
            setIsDemoData(true);
          } catch (error) {
            console.error("Error loading history from localStorage:", error);
            setHistory([]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      // Fallback to localStorage
      try {
        const historyKey = 'agriassist_analysis_history';
        const storedHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
        setHistory(storedHistory);
        setIsDemoData(true);
      } catch (error) {
        console.error("Error loading history from localStorage:", error);
        setHistory([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((analysis) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      search === "" ||
      (analysis.disease && analysis.disease.toLowerCase().includes(searchLower)) ||
      (analysis.crop && analysis.crop.toLowerCase().includes(searchLower));
    const matchesCrop = cropFilter === "all" || (analysis.crop && analysis.crop === cropFilter);

    return matchesSearch && matchesCrop;
  });

  const deleteAnalysis = (id: string) => {
    const updatedHistory = history.filter(analysis => analysis.id !== id);
    setHistory(updatedHistory);
    
    if (isDemoUser) {
      // For demo users, update localStorage
      try {
        const historyKey = 'agriassist_analysis_history';
        localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error("Error updating history in localStorage:", error);
      }
    } else {
      // For real users, we would make an API call to delete from database
      // This is a placeholder for real implementation
      console.log("Would delete analysis from database for real user");
    }
  };

  if (loading) {
    return (
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>{t('Analysis History')}</CardTitle>
          <CardDescription>
            {t('Loading your analysis history...')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">{t('Loading...')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{t('Analysis History')}</CardTitle>
        <CardDescription>
          {t('Browse and review all past crop analyses.')}
          {isDemoData && (
            <span className="block mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
              {t('Demo Mode: Using sample data. Sign in to use real data.')}
            </span>
          )}
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
                    <TableCell className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/history/${analysis.id}`}>{t('View')}</Link>
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteAnalysis(analysis.id)}>
                        <Trash2 className="h-4 w-4" />
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