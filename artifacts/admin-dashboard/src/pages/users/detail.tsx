import { useParams, Link } from "wouter";
import { useGetUser, getGetUserQueryKey, useListTranslations, getListTranslationsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CheckCircle2, XCircle, ArrowRightLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id || "0", 10);

  const { data: user, isLoading: isUserLoading } = useGetUser(userId, {
    query: {
      queryKey: getGetUserQueryKey(userId),
      enabled: !!userId,
    }
  });

  const { data: translationsData, isLoading: isTranslationsLoading } = useListTranslations(
    { userId, limit: 20 },
    { query: { queryKey: getListTranslationsQueryKey({ userId, limit: 20 }), enabled: !!userId } }
  );

  if (isUserLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-32 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">User not found</h2>
        <Link href="/users">
          <Button variant="link" className="mt-4">Back to Users</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {user.username ? `@${user.username}` : 'User Profile'}
            {user.isBanned && <Badge variant="destructive" className="font-mono text-xs">BANNED</Badge>}
          </h1>
          <p className="text-muted-foreground font-mono text-xs mt-1">Telegram ID: {user.telegramId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Name</span>
              <div className="font-medium">{user.firstName} {user.lastName}</div>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Joined</span>
              <div>{format(new Date(user.createdAt), "MMMM d, yyyy")}</div>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Last Active</span>
              <div>{user.lastActive ? format(new Date(user.lastActive), "MMMM d, yyyy HH:mm") : 'Never'}</div>
            </div>
            <div className="pt-4 border-t border-border flex justify-between">
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Translations</span>
                <div className="font-mono text-lg font-bold">{user.totalTranslations}</div>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Messages</span>
                <div className="font-mono text-lg font-bold">{user.totalMessages}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Translations</CardTitle>
            <CardDescription>Latest 20 translations requested by this user</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Time</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Original</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTranslationsLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-4 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : translationsData?.translations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      No translations found for this user.
                    </TableCell>
                  </TableRow>
                ) : (
                  translationsData?.translations.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {format(new Date(t.createdAt), "MMM d HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] bg-secondary/50">
                          {t.direction === "bn-en" ? "BN→EN" : "EN→BN"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {t.originalText}
                      </TableCell>
                      <TableCell>
                        {t.success ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {translationsData && translationsData.total > 20 && (
              <div className="p-4 border-t border-border text-center">
                <Link href={`/translations?userId=${user.id}`}>
                  <Button variant="link" className="text-xs">
                    View All {translationsData.total} Translations
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}