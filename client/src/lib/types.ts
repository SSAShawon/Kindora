export type AppRole = "volunteer" | "organizer";

export interface KindoraEvent {
  id: string;
  title: string;
  description: string;
  eventType: string;
  thumbnail: string;
  location: string;
  eventDate: string;
  creatorId: string;
  creatorName: string;
  participantCount: number;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventDetail {
  event: KindoraEvent;
  organizer: { id: string; name: string; image: string | null };
  viewerJoined: boolean;
  isOwner: boolean;
}

export interface Participant {
  userId: string;
  name: string;
  image: string | null;
  joinedAt: string;
}

export interface EventListResponse {
  events: KindoraEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlatformStats {
  volunteers: number;
  events: number;
  completedInitiatives: number;
  peopleImpacted: number;
}

export interface JoinedEventItem {
  participation: { eventId: string; joinedAt: string };
  event: KindoraEvent;
  status: "upcoming" | "completed";
}

export interface ActivityItem {
  type: "joined_event" | "created_event" | "participant_joined";
  eventId: string;
  eventTitle: string;
  eventDate: string;
  at: string;
  participantName?: string;
}

export interface VolunteerStats {
  role: "volunteer";
  stats: { joinedTotal: number; upcomingJoined: number; completedParticipation: number };
  upcomingEvents: KindoraEvent[];
  recentActivity: ActivityItem[];
}

export interface OrganizerStats {
  role: "organizer";
  stats: { createdTotal: number; upcomingCreated: number; totalParticipants: number };
  upcomingEvents: KindoraEvent[];
  recentActivity: ActivityItem[];
}

export type DashboardStats = VolunteerStats | OrganizerStats;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: AppRole;
  joinedAt: string;
}
