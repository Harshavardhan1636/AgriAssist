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

export default function HistoryPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis History</CardTitle>
        <CardDescription>
          Browse and review all past crop analyses.
        </CardDescription>
        <div className="flex items-center gap-4 pt-4">
          <Input placeholder="Search by disease..." className="max-w-sm" />
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by crop" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Crops</SelectItem>
              <SelectItem value="tomato">Tomato</SelectItem>
              <SelectItem value="potato">Potato</SelectItem>
              <SelectItem value="maize">Maize</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                Image
              </TableHead>
              <TableHead>Crop</TableHead>
              <TableHead>Top Diagnosis</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockHistory.map((analysis) => (
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
                <TableCell className="font-medium">{analysis.crop}</TableCell>
                <TableCell>{analysis.predictions[0].label}</TableCell>
                <TableCell>
                  <Badge variant={analysis.severity.band === 'High' ? 'destructive' : 'secondary'}>
                    {analysis.severity.band} ({analysis.severity.percentage}%)
                  </Badge>
                </TableCell>
                 <TableCell>
                  <Badge variant={analysis.risk.score > 0.7 ? 'destructive' : 'outline'}>
                    {Math.round(analysis.risk.score * 100)}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={analysis.status === 'Pending Review' ? 'default' : 'outline'}>
                    {analysis.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(analysis.timestamp), "PPP")}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
