"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CalendarPlus, ImagePlus, Save } from "lucide-react";
import { toast } from "sonner";
import { api, ApiClientError } from "@/lib/api";
import { EVENT_CATEGORIES } from "@/lib/constants";
import type { KindoraEvent } from "@/lib/types";
import { toDateTimeLocal } from "@/lib/utils";
import { editEventFormSchema, eventFormSchema, type EventFormValues } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SmartImage } from "@/components/shared/smart-image";
import { CategoryBadge } from "@/components/shared/category-badge";

interface EventFormProps {
  mode: "create" | "edit";
  event?: KindoraEvent;
}

export function EventForm({ mode, event }: EventFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const schema = mode === "create" ? eventFormSchema : editEventFormSchema;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues: event
      ? {
          title: event.title,
          description: event.description,
          eventType: event.eventType as EventFormValues["eventType"],
          thumbnail: event.thumbnail,
          location: event.location,
          eventDate: toDateTimeLocal(new Date(event.eventDate)),
        }
      : {
          title: "",
          description: "",
          eventType: undefined,
          thumbnail: "",
          location: "",
          eventDate: "",
        },
  });

  const thumbnail = watch("thumbnail");
  const description = watch("description");
  const category = watch("eventType");
  const previewFailed = failedUrl !== null && failedUrl === thumbnail;

  async function onSubmit(values: EventFormValues) {
    setFormError(null);
    const payload = { ...values, eventDate: new Date(values.eventDate).toISOString() };
    try {
      if (mode === "create") {
        const result = await api.events.create(payload);
        toast.success("Your event is live!", { description: "Volunteers can now discover and join it." });
        router.push(`/events/${result.event.id}`);
      } else if (event) {
        await api.events.update(event.id, payload);
        toast.success("Event updated successfully.");
        router.push("/dashboard/manage-events");
      }
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.details) {
          for (const [field, messages] of Object.entries(err.details)) {
            if (messages?.[0]) setError(field as keyof EventFormValues, { message: messages[0] });
          }
        }
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 xl:grid-cols-[1fr_340px]" noValidate>
      <div className="space-y-6">
        {formError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Event title</Label>
          <Input id="title" placeholder="e.g. Rupsha Riverbank Cleanup Drive" maxLength={120} {...register("title")} />
          <div className="flex items-center justify-between">
            {errors.title ? <p className="text-xs font-medium text-destructive">{errors.title.message}</p> : <span />}
            <p className="text-[11px] text-muted-foreground">{watch("title")?.length ?? 0}/120</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={7}
            placeholder="What will volunteers do? What should they bring? Why does this matter? (at least 30 characters)"
            maxLength={5000}
            {...register("description")}
          />
          <div className="flex items-center justify-between">
            {errors.description ? <p className="text-xs font-medium text-destructive">{errors.description.message}</p> : <span />}
            <p className="text-[11px] text-muted-foreground">{description?.length ?? 0}/5000</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(value) => setValue("eventType", value as EventFormValues["eventType"], { shouldValidate: true })}>
              <SelectTrigger aria-label="Event category">
                <SelectValue placeholder="Choose a cause" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.eventType && <p className="text-xs font-medium text-destructive">{errors.eventType.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventDate">Event date &amp; time</Label>
            <Input id="eventDate" type="datetime-local" {...register("eventDate")} />
            {errors.eventDate ? (
              <p className="text-xs font-medium text-destructive">{errors.eventDate.message}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                {mode === "create" ? "Must be in the future." : "Changing the date requires a future date."}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" placeholder="e.g. Rupsha Ghat, Khulna" maxLength={160} {...register("location")} />
          {errors.location && <p className="text-xs font-medium text-destructive">{errors.location.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="thumbnail">Thumbnail image URL</Label>
          <Input id="thumbnail" type="url" placeholder="https://images.pexels.com/…" {...register("thumbnail")} />
          {errors.thumbnail ? (
            <p className="text-xs font-medium text-destructive">{errors.thumbnail.message}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              A public http(s) image URL. Landscape photos around 1200px wide look best.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
          <Button type="submit" size="lg" loading={isSubmitting}>
            {mode === "create" ? (
              <>
                <CalendarPlus /> Publish Event
              </>
            ) : (
              <>
                <Save /> Save Changes
              </>
            )}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Live preview */}
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live preview</p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="relative aspect-[16/10] bg-secondary">
            {thumbnail && !previewFailed ? (
              <SmartImage
                key={thumbnail}
                src={thumbnail}
                alt="Event thumbnail preview"
                className="h-full w-full object-cover"
                onError={() => setFailedUrl(thumbnail)}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImagePlus className="h-8 w-8" />
                <p className="text-xs">{thumbnail && previewFailed ? "Couldn't load this image URL" : "Your cover image appears here"}</p>
              </div>
            )}
            {category && (
              <div className="absolute left-3 top-3">
                <CategoryBadge category={category} className="bg-card/95 backdrop-blur" />
              </div>
            )}
          </div>
          <div className="p-4">
            <p className="line-clamp-2 font-display text-base font-bold text-foreground">
              {watch("title") || "Your event title"}
            </p>
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {description || "Your description will appear here as you type."}
            </p>
            <p className="mt-2.5 text-[11px] text-muted-foreground">{watch("location") || "Location"}</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          This is how volunteers will see your event card. A warm, human photo makes a big difference.
        </p>
      </aside>
    </form>
  );
}
