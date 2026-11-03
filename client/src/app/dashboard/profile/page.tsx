"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, BadgeCheck, CalendarDays, Mail, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { formatDate, initials } from "@/lib/utils";
import { profileSchema, type ProfileValues } from "@/lib/validators";
import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const { user, refetch } = useSession();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", image: "" },
  });

  // Populate the form once per account. better-auth hands back a fresh `user`
  // object on every session refetch/poll, so keying this on `user` alone would
  // wipe in-progress edits whenever a background refresh lands. Track the
  // account id and only reset when it actually changes (or on first load).
  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (user && loadedFor.current !== user.id) {
      loadedFor.current = user.id;
      reset({ name: user.name, image: user.image ?? "" });
    }
  }, [user, reset]);

  const imageValue = watch("image");

  async function onSubmit(values: ProfileValues) {
    setFormError(null);
    try {
      await api.users.updateProfile({ name: values.name, image: values.image || null });
      await refetch();
      reset(values);
      toast.success("Profile updated successfully.");
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Could not update your profile.");
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      <DashboardHeader title="Your Profile" sub="How you appear to organizers and fellow volunteers." />

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        {/* Identity card */}
        <Card className="xl:sticky xl:top-24 xl:self-start">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <Avatar className="h-24 w-24 border-2 border-border shadow-soft">
              {imageValue ? <AvatarImage src={imageValue} alt={user.name} /> : user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
              <AvatarFallback className="text-2xl">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <h2 className="mt-5 font-display text-xl font-extrabold text-foreground">{user.name}</h2>
            <Badge variant="accent" className="mt-2 capitalize">
              <ShieldCheck className="h-3 w-3" /> {user.role}
            </Badge>
            <Separator className="my-6" />
            <ul className="w-full space-y-3.5 text-left text-sm">
              <li className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{user.email}</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                Joined {formatDate(user.createdAt)}
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                {user.role === "organizer" ? "Can create and manage events" : "Can join community events"}
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card>
          <CardHeader>
            <CardTitle>Profile information</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your email and role are fixed for account security. Everything else is yours to shape.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              {formError && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" autoComplete="name" {...register("name")} />
                {errors.name && <p className="text-xs font-medium text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Profile photo URL</Label>
                <Input id="image" type="url" placeholder="https://… (leave empty to use your initials)" {...register("image")} />
                {errors.image ? (
                  <p className="text-xs font-medium text-destructive">{errors.image.message}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    A square photo works best. Leave empty for a clean initials avatar.
                  </p>
                )}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email address</Label>
                  <Input value={user.email} disabled />
                  <p className="text-[11px] text-muted-foreground">Contact support to change your email.</p>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={user.role === "organizer" ? "Organizer" : "Volunteer"} disabled className="capitalize" />
                  <p className="text-[11px] text-muted-foreground">Roles are assigned at sign-up.</p>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <Button type="submit" size="lg" loading={isSubmitting} disabled={!isDirty}>
                  <Save /> Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
