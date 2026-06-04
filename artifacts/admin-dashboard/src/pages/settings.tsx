import { useGetSettings, getGetSettingsQueryKey, useUpdateSettings } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import { Loader2, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

const settingsSchema = z.object({
  botToken: z.string().min(1, "Bot token is required"),
  translationEnabled: z.boolean(),
  loggingEnabled: z.boolean(),
  maintenanceMode: z.boolean(),
  rateLimitPerMinute: z.coerce.number().int().min(1, "Must be at least 1"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useGetSettings({
    query: {
      queryKey: getGetSettingsQueryKey()
    }
  });

  const updateSettings = useUpdateSettings();

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      botToken: "",
      translationEnabled: true,
      loggingEnabled: true,
      maintenanceMode: false,
      rateLimitPerMinute: 30,
    }
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (settings && !initializedRef.current) {
      form.reset({
        botToken: settings.botToken,
        translationEnabled: settings.translationEnabled,
        loggingEnabled: settings.loggingEnabled,
        maintenanceMode: settings.maintenanceMode,
        rateLimitPerMinute: settings.rateLimitPerMinute,
      });
      initializedRef.current = true;
    }
  }, [settings, form]);

  const onSubmit = (data: SettingsForm) => {
    updateSettings.mutate({ data }, {
      onSuccess: (updated) => {
        toast({
          title: "Settings saved",
          description: "Bot configuration has been updated successfully.",
        });
        queryClient.setQueryData(getGetSettingsQueryKey(), updated);
      },
      onError: (error) => {
        toast({
          title: "Failed to save settings",
          description: error.error || "An error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bot Settings</h1>
        <p className="text-muted-foreground">Configure global parameters for the Telegram bot.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Core Configuration</CardTitle>
              <CardDescription>Authentication and limits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="botToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bot Token</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz..." {...field} className="font-mono text-sm" />
                    </FormControl>
                    <FormDescription>
                      The Telegram Bot API token from BotFather.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rateLimitPerMinute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate Limit (per minute)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Maximum number of translations a user can perform per minute.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>System Toggles</CardTitle>
              <CardDescription>Enable or disable core features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="translationEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Translation Engine</FormLabel>
                      <FormDescription>
                        When disabled, the bot will respond with a maintenance message.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="loggingEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Query Logging</FormLabel>
                      <FormDescription>
                        Save original and translated text to the database. If disabled, analytics will be limited.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maintenanceMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base text-destructive">Maintenance Mode</FormLabel>
                      <FormDescription>
                        Lock the bot entirely. Only admins can interact with it.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t border-border px-6 py-4 flex justify-end">
              <Button type="submit" disabled={updateSettings.isPending} className="font-mono">
                {updateSettings.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {updateSettings.isPending ? "SAVING..." : "SAVE CHANGES"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}