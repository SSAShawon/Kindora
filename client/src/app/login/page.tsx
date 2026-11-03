"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LogIn } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/auth-layout";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordInput } from "@/components/shared/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginValues } from "@/lib/validators";
import { signInWithEmail, useSession } from "@/lib/auth-client";

function safeRedirect(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));
  const { user, isPending } = useSession();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  // Only redirect once the session has fully restored — never during hydration.
  useEffect(() => {
    if (!isPending && user) router.replace(redirect);
  }, [isPending, user, router, redirect]);

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const { error } = await signInWithEmail({ email: values.email, password: values.password });
    if (error) {
      const message =
        error.code === "INVALID_EMAIL_OR_PASSWORD"
          ? "That email and password combination doesn't match our records."
          : error.message ?? "Sign-in failed. Please try again.";
      setFormError(message);
      return;
    }
    toast.success("Welcome back! You're signed in.");
    router.replace(redirect);
    router.refresh();
  }

  function fillDemo(role: "volunteer" | "organizer") {
    setValue("email", role === "organizer" ? "ayesha@kindora.demo" : "nusrat@kindora.demo");
    setValue("password", "Kindora#Demo1");
    setFormError(null);
    toast.info(`Demo ${role} credentials filled — press Sign in to explore.`);
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={
        <>
          New to Kindora?{" "}
          <Link href={`/register${redirect !== "/dashboard" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="font-semibold text-primary link-underline">
            Create an account
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
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" autoComplete="current-password" placeholder="Your password" {...register("password")} />
          {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          <LogIn /> Sign in
        </Button>
      </form>

      <div className="mt-6">
        <GoogleButton callbackURL={redirect} />
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/40 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Try the demo accounts</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          This preview includes sample data. One click fills the credentials:
        </p>
        <div className="mt-3 flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fillDemo("volunteer")}>
            Volunteer demo
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => fillDemo("organizer")}>
            Organizer demo
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
