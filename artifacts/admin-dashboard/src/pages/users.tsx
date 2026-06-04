import { useState } from "react";
import { useListUsers, getListUsersQueryKey, useBanUser, useUnbanUser, useDeleteUser } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Search, ShieldAlert, ShieldCheck, Trash2, ArrowRight, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [bannedFilter, setBannedFilter] = useState<string>("all");
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data, isLoading } = useListUsers(
    { 
      page, 
      limit: 10, 
      search: search || undefined, 
      banned: bannedFilter === "banned" ? true : bannedFilter === "active" ? false : undefined 
    },
    { query: { queryKey: getListUsersQueryKey({ page, limit: 10, search: search || undefined, banned: bannedFilter === "banned" ? true : bannedFilter === "active" ? false : undefined }) } }
  );

  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const deleteUser = useDeleteUser();

  const handleBanToggle = (id: number, isBanned: boolean) => {
    const mutation = isBanned ? unbanUser : banUser;
    mutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: isBanned ? "User unbanned" : "User banned" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
      onError: (error) => {
        toast({ title: "Action failed", description: error.error, variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;
    deleteUser.mutate({ id: deleteConfirmId }, {
      onSuccess: () => {
        toast({ title: "User deleted" });
        setDeleteConfirmId(null);
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
      onError: (error) => {
        toast({ title: "Delete failed", description: error.error, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage bot users and access.</p>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search username or ID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8"
                />
              </div>
              <Select value={bannedFilter} onValueChange={(v) => { setBannedFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="banned">Banned Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-muted-foreground font-mono">
              Total: {data?.total || 0}
            </div>
          </div>
        </CardHeader>
        <div className="border-t border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Telegram ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Translations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                data?.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{user.telegramId}</TableCell>
                    <TableCell>
                      <div className="font-medium">{user.username ? `@${user.username}` : 'No username'}</div>
                      <div className="text-xs text-muted-foreground">{user.firstName} {user.lastName}</div>
                    </TableCell>
                    <TableCell className="font-mono">{user.totalTranslations}</TableCell>
                    <TableCell>
                      <Badge variant={user.isBanned ? "destructive" : "secondary"} className="font-mono text-[10px]">
                        {user.isBanned ? "BANNED" : "ACTIVE"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {user.lastActive ? format(new Date(user.lastActive), "MMM d, yyyy HH:mm") : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleBanToggle(user.id, user.isBanned)}
                          title={user.isBanned ? "Unban User" : "Ban User"}
                          disabled={banUser.isPending || unbanUser.isPending}
                        >
                          {user.isBanned ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteConfirmId(user.id)}
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Link href={`/users/${user.id}`}>
                          <Button variant="secondary" size="sm" className="h-8 px-2 text-xs font-mono">
                            VIEW <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
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

      <Dialog open={deleteConfirmId !== null} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this user and all their translation history? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
              {deleteUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}