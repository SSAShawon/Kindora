"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Clock, Mail, MapPin, MessageSquareHeart, Send } from "lucide-react";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api";
import { contactSchema, type ContactValues } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const channels = [
  { icon: Mail, title: "Email us", body: "hello@kindora.community", href: "mailto:hello@kindora.community" },
  { icon: MapPin, title: "Based in", body: "Khulna, Bangladesh — serving communities everywhere" },
  { icon: Clock, title: "Response time", body: "We read every message and reply within 2 business days" },
];

export default function ContactPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  async function onSubmit(values: ContactValues) {
    setFormError(null);
    try {
      await api.contact(values);
      setSent(true);
      reset();
      toast.success("Message sent! We'll get back to you soon.");
    } catch (err) {
      if (err instanceof ApiClientError && err.details) {
        setFormError(err.message);
      } else {
        setFormError(err instanceof ApiClientError ? err.message : "Could not send your message. Please try again.");
      }
    }
  }

  return (
    <div className="container py-12 lg:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">
          <span className="h-px w-6 bg-primary/60" aria-hidden />
          Contact
        </p>
        <h1 className="section-title mt-3">Let&apos;s talk about your community</h1>
        <p className="section-sub">
          Questions, ideas, partnerships, or a cause you want to bring to Kindora — write to us.
          Real people read every message.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          {channels.map(({ icon: Icon, title, body, href }) => (
            <Card key={title}>
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{title}</p>
                  {href ? (
                    <a href={href} className="link-underline mt-1 block text-sm text-muted-foreground hover:text-primary">
                      {body}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          <Card className="border-none bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <MessageSquareHeart className="h-7 w-7" />
              <p className="mt-4 font-display text-lg font-bold">Organizing something big?</p>
              <p className="mt-2 text-sm leading-relaxed opacity-85">
                Tell us about your initiative and we&apos;ll help you set it up for success —
                from event structure to volunteer guidelines.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            {sent ? (
              <div className="flex flex-col items-center py-14 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="mt-6 font-display text-2xl font-extrabold">Message received!</h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Thank you for reaching out. A member of the Kindora team will reply to your
                  email within two business days.
                </p>
                <Button variant="outline" className="mt-8" onClick={() => setSent(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {formError && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {formError}
                  </div>
                )}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your name</Label>
                    <Input id="name" placeholder="e.g. Rafiq Islam" autoComplete="name" {...register("name")} />
                    {errors.name && <p className="text-xs font-medium text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
                    {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="What is this about?" maxLength={120} {...register("subject")} />
                  {errors.subject && <p className="text-xs font-medium text-destructive">{errors.subject.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" rows={7} placeholder="Tell us what's on your mind… (at least 20 characters)" maxLength={2000} {...register("message")} />
                  <div className="flex items-center justify-between">
                    {errors.message ? <p className="text-xs font-medium text-destructive">{errors.message.message}</p> : <span />}
                    <p className="text-[11px] text-muted-foreground">{watch("message")?.length ?? 0}/2000</p>
                  </div>
                </div>
                <Button type="submit" size="lg" loading={isSubmitting}>
                  <Send /> Send Message
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
