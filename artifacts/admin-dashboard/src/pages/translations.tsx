import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListTranslations, getListTranslationsQueryKey, useExportTranslations, getExportTranslationsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ListTranslationsDirection } from "@workspace/api-client-react/src/generated/api.schemas";

export default function TranslationsPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const urlUserId = searchParams.get("userId") ? parseInt(searchParams.get("userId")!) : undefined;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<string>("all");
  
  // Custom fetch to trigger CSV download since it's a blob/file response
  const handleExport = () => {
    let url = "/api/translations/export?";
    if (direction && direction !== "all") url += `direction=${direction}&`;
    window.open(url, "_blank");
  };

  const { data, isLoading } = useListTranslations(
    { 
      page, 
      limit: 15, 
      search: search || undefined, 
      direction: direction === "all" ? undefined : direction as ListTranslationsDirection,
      userId: urlUserId
    },
    { query: { queryKey: getListTranslationsQueryKey({ page, limit: 15, search: search || undefined, direction: direction === "all" ? undefined : direction as ListTranslationsDirection, userId: urlUserId }) } }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Translations</h1>
          <p className="text-muted-foreground">Detailed log of all translation queries.</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="font-mono">
          <Download className="w-4 h-4 mr-2" />
          EXPORT CSV
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search text or username..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 font-mono text-sm"
                />
              </div>
              <Select value={direction} onValueChange={(v) => { setDirection(v); setPage(1); }}>
                <SelectTrigger className="w-[120px] font-mono text-sm">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ALL</SelectItem>
                  <SelectItem value="bn-en">BN→EN</SelectItem>
                  <SelectItem value="en-bn">EN→BN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-muted-foreground font-mono">
              Total: {data?.total || 0}
            </div>
          </div>
        </CardHeader>
        <div className="border-t border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[140px]">Time</TableHead>
                <TableHead className="w-[100px]">User</TableHead>
                <TableHead className="w-[80px]">Dir</TableHead>
                <TableHead>Original</TableHead>
                <TableHead>Translated</TableHead>
                <TableHead className="w-[60px] text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-4 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : data?.translations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No translations found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                data?.translations.map((t) => (
                  <TableRow key={t.id} className="text-sm">
                    <TableCell className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {format(new Date(t.createdAt), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[100px]">
                      {t.username ? `@${t.username}` : t.telegramUserId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px] bg-secondary/30 text-secondary-foreground border-border whitespace-nowrap">
                        {t.direction === "bn-en" ? "BN→EN" : "EN→BN"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={t.originalText}>
                      {t.originalText}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={t.translatedText}>
                      {t.translatedText}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        {t.success ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" title="Success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" title="Failed" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {data && data.total > data.limit && (
          <div className="border-t border-border p-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground font-mono">
              Page {data.page} of {Math.ceil(data.total / data.limit)}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= Math.ceil(data.total / data.limit)}
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}