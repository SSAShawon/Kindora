"use client";

import { AuthGuard } from "@/components/shared/auth-guard";
import { DashboardHeader } from "@/components/dashboard/dashboard-shell";
import { EventForm } from "@/components/events/event-form";

export default function CreateEventPage() {
  return (
    <AuthGuard role="organizer">
      <div className="space-y-8">
        <DashboardHeader
          title="Create a New Event"
          sub="Tell your community what's happening, where, and why it matters. You can edit everything later."
        />
        <EventForm mode="create" />
      </div>
    </AuthGuard>
  );
}
