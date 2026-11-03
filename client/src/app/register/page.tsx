"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CalendarPlus, HandHeart, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/auth-layout";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { passwordStrength, registerSchema, type RegisterValues } from "@/lib/validators";
import { signUpWithEmail, useSession } from "@/lib/auth-client";

function safeRedirect(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

const roles = [
  {
    value: "volunteer",
    icon: HandHeart,
    title: "Volunteer",
    body: "Discover causes, join events, and track your impact.",
  },
  {
    value: "organizer",
    icon: CalendarPlus,
    title: "Organizer",
    body: "Create events, gather volunteers, and lead initiatives.",
  },
] as const;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));
  const { user, isPending } = useSession();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", role: "volunteer" },
  });

  const password = watch("password");
  const role = watch("role");
  const strength = passwordStrength(password ?? "");

  useEffect(() => {
    if (!isPending && user) router.replace(redirect);
  }, [isPending, user, router, redirect]);

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    const { error } = await signUpWithEmail({
      name: values.name,
      email: values.email,
      password: values.password,
      role: values.role,
    });
    if (error) {
      if (error.code === "USER_ALREADY_EXISTS" || error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
        setError("email", { message: "An account with this email already exists. Try signing in instead." });
        return;
      }
      setFormError(error.message ?? "Registration failed. Please try again.");
      return;
    }
    toast.success(`Welcome to Kindora, ${values.name.split(" ")[0]}! Your ${values.role} account is ready.`);
    router.replace(redirect);
    router.refresh();
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        <>
          Already part of the community?{" "}
          <Link href={`/login${redirect !== "/dashboard" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="font-semibold text-primary link-underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {formError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}

        <div className="space-y-2">
          <Label>I want to join as</Label>
          <div className="grid grid-cols-2 gap-3">
            {roles.map(({ value, icon: Icon, title, body }) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue("role", value, { shouldValidate: true })}
                aria-pressed={role === value}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  role === value
                    ? "border-primary bg-secondary/70 shadow-soft ring-1 ring-primary/30"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <Icon className={cn("h-5 w-5", role === value ? "text-primary" : "text-muted-foreground")} />
                <p className="mt-2.5 text-sm font-bold text-foreground">{title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{body}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" placeholder="e.g. Nusrat Jahan" {...register("name")} />
          {errors.name && <p className="text-xs font-medium text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" autoComplete="new-password" placeholder="At least 8 characters" {...register("password")} />
          {password && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      index < strength.score
                        ? strength.score <= 1
                          ? "bg-destructive"
                          : strength.score <= 3
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        : "bg-muted",
                    )}
                  />
                ))}
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">{strength.label}</span>
            </div>
          )}
          {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput id="confirmPassword" autoComplete="new-password" placeholder="Repeat your password" {...register("confirmPassword")} />
          {errors.confirmPassword && <p className="text-xs font-medium text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          <UserPlus /> Create {role} account
        </Button>
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          By joining, you agree to show up with kindness and respect for every community member.
        </p>
      </form>

      <div className="mt-6">
        <GoogleButton callbackURL={redirect} />
      </div>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
