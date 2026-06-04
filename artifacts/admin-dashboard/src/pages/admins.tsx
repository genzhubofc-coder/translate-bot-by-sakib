import { useListAdmins, getListAdminsQueryKey, useCreateAdmin, useDeleteAdmin, useUpdateAdminPassword } from "@workspace/api-client-react";
import { useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Shield, Trash2, KeyRound } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

const createAdminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function AdminsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [passwordOpenId, setPasswordOpenId] = useState<number | null>(null);

  const { data: admins, isLoading } = useListAdmins({
    query: {
      queryKey: getListAdminsQueryKey()
    }
  });

  const createAdmin = useCreateAdmin();
  const deleteAdmin = useDeleteAdmin();
  const updatePassword = useUpdateAdminPassword();

  const createForm = useForm<z.infer<typeof createAdminSchema>>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { username: "", password: "" },
  });

  const passwordForm = useForm<z.infer<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "" },
  });

  const onCreateAdmin = (data: z.infer<typeof createAdminSchema>) => {
    createAdmin.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Admin created successfully" });
        setIsCreateOpen(false);
        createForm.reset();
        queryClient.invalidateQueries({ queryKey: getListAdminsQueryKey() });
      },
      onError: (error) => {
        toast({ title: "Failed to create admin", description: error.error, variant: "destructive" });
      }
    });
  };

  const onDeleteAdmin = (id: number) => {
    if (confirm("Are you sure you want to delete this admin account? This action cannot be undone.")) {
      deleteAdmin.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Admin deleted" });
          queryClient.invalidateQueries({ queryKey: getListAdminsQueryKey() });
        },
        onError: (error) => {
          toast({ title: "Failed to delete admin", description: error.error, variant: "destructive" });
        }
      });
    }
  };

  const onUpdatePassword = (id: number, data: z.infer<typeof updatePasswordSchema>) => {
    updatePassword.mutate({ id, data }, {
      onSuccess: () => {
        toast({ title: "Password updated successfully" });
        setPasswordOpenId(null);
        passwordForm.reset();
      },
      onError: (error) => {
        toast({ title: "Failed to update password", description: error.error, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administrators</h1>
          <p className="text-muted-foreground">Manage dashboard access and permissions.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono">
              <Plus className="w-4 h-4 mr-2" />
              ADD ADMIN
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
              <DialogDescription>
                Create a new administrator account. They will have full access to this dashboard.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateAdmin)} className="space-y-4 mt-4">
                <FormField
                  control={createForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createAdmin.isPending}>
                    {createAdmin.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Admin
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border">
        <CardHeader className="py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Admin Accounts
          </CardTitle>
        </CardHeader>
        <div className="border-t border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : admins?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No administrators found.
                  </TableCell>
                </TableRow>
              ) : (
                admins?.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">#{admin.id}</TableCell>
                    <TableCell className="font-medium">{admin.username}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(admin.createdAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog open={passwordOpenId === admin.id} onOpenChange={(open) => {
                          if (open) {
                            setPasswordOpenId(admin.id);
                            passwordForm.reset();
                          } else {
                            setPasswordOpenId(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs font-mono">
                              <KeyRound className="w-3 h-3 mr-2" />
                              PASS
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Password</DialogTitle>
                              <DialogDescription>
                                Set a new password for {admin.username}.
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...passwordForm}>
                              <form onSubmit={passwordForm.handleSubmit((data) => onUpdatePassword(admin.id, data))} className="space-y-4 mt-4">
                                <FormField
                                  control={passwordForm.control}
                                  name="password"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>New Password</FormLabel>
                                      <FormControl>
                                        <Input type="password" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter className="mt-6">
                                  <Button type="button" variant="outline" onClick={() => setPasswordOpenId(null)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={updatePassword.isPending}>
                                    {updatePassword.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Update
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="h-8 text-xs font-mono"
                          onClick={() => onDeleteAdmin(admin.id)}
                          disabled={deleteAdmin.isPending}
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          DEL
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}