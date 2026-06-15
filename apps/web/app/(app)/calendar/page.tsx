"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { apiGet, apiPost } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/Forms";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  User,
  Info
} from "lucide-react";

type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  meetingLink?: string | null;
  clientId?: string;
  type: "google" | "meeting" | "project" | "invoice";
  status?: string;
};

type EventsResponse = {
  googleConnected: boolean; // mapped as calcomConnected on backend for schema compatibility
  events: CalendarEvent[];
};

type Client = {
  _id: string;
  name: string;
};

type ClientsResponse = {
  data: Client[];
};

type CalcomConfigResponse = {
  isConfigured: boolean;
  eventLink: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  
  // Modals & details
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"calcom" | "manual">("calcom");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Manual Event creation form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [generateMeet, setGenerateMeet] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<string>("all");

  // Queries
  const { data: eventsRes, isLoading: eventsLoading, refetch: refetchEvents, isRefetching } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: async () => apiGet<EventsResponse>("/calendar/events", await getToken())
  });

  const { data: calcomConfig } = useQuery({
    queryKey: ["calcom-config"],
    queryFn: async () => apiGet<CalcomConfigResponse>("/calendar/config", await getToken())
  });

  const { data: clientsRes } = useQuery({
    queryKey: ["clients-comms"],
    queryFn: async () => apiGet<ClientsResponse>("/clients", await getToken())
  });

  const isCalcomConnected = calcomConfig?.isConfigured ?? false;
  const calcomLink = calcomConfig?.eventLink ?? "https://cal.com/calcom/30min";
  const events = eventsRes?.events ?? [];
  const clients = clientsRes?.data ?? [];

  // Mutations
  const createLocalEventMutation = useMutation({
    mutationFn: async (eventPayload: any) => {
      const token = await getToken();
      return apiPost("/calendar/events", eventPayload, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setIsScheduleOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventDate("");
    setStartTime("10:00");
    setEndTime("11:00");
    setSelectedClientId("");
    setGenerateMeet(true);
  };

  const handleCreateLocalEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) {
      alert("Please specify a title and date.");
      return;
    }

    try {
      setIsSubmitting(true);
      const startIso = new Date(`${eventDate}T${startTime}:00`).toISOString();
      const endIso = new Date(`${eventDate}T${endTime}:00`).toISOString();

      await createLocalEventMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        start: startIso,
        end: endIso,
        clientId: selectedClientId || undefined,
        generateMeet
      });
    } catch (err) {
      console.error(err);
      alert("Failed to schedule local meeting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (filterType === "all") return events;
    return events.filter(e => e.type === filterType);
  }, [events, filterType]);

  // Calendar calculations (Month Grid)
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const gridCells: Array<{ date: Date; isCurrentMonth: boolean; key: string }> = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = prevTotalDays - i;
      gridCells.push({
        date: new Date(year, month - 1, day),
        isCurrentMonth: false,
        key: `prev-${day}`
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      gridCells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
        key: `curr-${i}`
      });
    }

    // Next month padding to fill grid (multiple of 7)
    const remaining = 42 - gridCells.length;
    for (let i = 1; i <= remaining; i++) {
      gridCells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        key: `next-${i}`
      });
    }

    return gridCells;
  }, [currentDate]);

  // Week view calculations
  const weekDays = useMemo(() => {
    const currentDayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate(prev => {
      const nextDate = new Date(prev);
      if (viewMode === "month") {
        nextDate.setMonth(prev.getMonth() - 1);
      } else {
        nextDate.setDate(prev.getDate() - 7);
      }
      return nextDate;
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const nextDate = new Date(prev);
      if (viewMode === "month") {
        nextDate.setMonth(prev.getMonth() + 1);
      } else {
        nextDate.setDate(prev.getDate() + 7);
      }
      return nextDate;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper: check if two dates represent the same calendar day
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const getEventStyles = (type: string, status?: string) => {
    if (type === "invoice") {
      if (status === "Paid") {
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20";
      }
      if (status === "Pending") {
        return "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20";
      }
      if (status === "Overdue") {
        return "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20";
      }
    }
    switch (type) {
      case "google": // maps to Cal.com synced bookings
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20";
      case "meeting": // local manual meetings
        return "bg-accent/10 text-accent border-accent/20 hover:bg-accent/20";
      case "project":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20";
      case "invoice":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20";
      default:
        return "bg-white/5 text-white/70 border-white/10 hover:bg-white/10";
    }
  };

  const formatEventTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Safe formatting of Cal.com link (adds https:// if missing for iframe embedding)
  const getEmbeddableCalcomUrl = (link: string) => {
    let url = link.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    // Append embed params to respect calendar styling
    if (url.includes("?")) {
      return `${url}&embed=true`;
    }
    return `${url}?embed=true`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Command Calendar"
          description="Track scheduled meetups, project deliverables, and client followups in one central timeline."
          badge="Cal.com Sync"
        />
        <Button onClick={() => setIsScheduleOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Book or Schedule
        </Button>
      </div>

      {/* Sync Status Banner */}
      <Card className="p-4 bg-gradient-to-r from-white/5 to-transparent border border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isCalcomConnected ? (
              <div className="h-9 w-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="h-5 w-5" />
              </div>
            ) : (
              <div className="h-9 w-9 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Info className="h-5 w-5" />
              </div>
            )}
            <div>
              <h4 className="text-sm font-semibold text-white">
                {isCalcomConnected ? "Cal.com Scheduler Synced" : "Cal.com Demo Mode Active"}
              </h4>
              <p className="text-xs text-white/50">
                {isCalcomConnected
                  ? `Active Booking Link: ${calcomLink}`
                  : "Using simulated bookings. Configure CALCOM_EVENT_LINK and CALCOM_API_KEY in your .env to link your schedule."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!isCalcomConnected && (
              <Badge className="bg-white/5 text-white/40 border border-white/10 px-3 py-1.5 text-xs text-center w-full sm:w-auto">
                Offline Mode (No API keys)
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchEvents()}
              disabled={isRefetching}
              className="h-9 w-9 p-0 shrink-0"
              title="Refresh Calendar Feed"
            >
              <RefreshCw className={`h-4 w-4 text-white/60 ${isRefetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        {/* Toggle View */}
        <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              viewMode === "month" ? "bg-accent text-white shadow-sm" : "text-white/40 hover:text-white/60"
            }`}
          >
            Month Grid
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              viewMode === "week" ? "bg-accent text-white shadow-sm" : "text-white/40 hover:text-white/60"
            }`}
          >
            Week Cards
          </button>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Events", style: "bg-white/5 text-white/60" },
            { id: "google", label: "Cal.com Bookings", style: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
            { id: "meeting", label: "Internal Meetings", style: "bg-accent/10 text-accent border border-accent/20" },
            { id: "project", label: "Deliverables", style: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
            { id: "invoice", label: "Invoices Due", style: "bg-rose-500/10 text-rose-400 border border-rose-500/20" }
          ].map(tag => (
            <button
              key={tag.id}
              onClick={() => setFilterType(tag.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                filterType === tag.id
                  ? "border-accent bg-accent/20 text-white"
                  : `${tag.style} hover:scale-105`
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-white/80 min-w-[120px] text-center">
            {viewMode === "month"
              ? currentDate.toLocaleString("default", { month: "long", year: "numeric" })
              : `Week of ${weekDays[0].toLocaleDateString("default", { month: "short", day: "numeric" })}`}
          </span>
          <Button variant="outline" size="sm" onClick={handleNext} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday} className="text-xs h-8">
            Today
          </Button>
        </div>
      </div>

      {/* Calendar View Container */}
      <Card className="p-2 md:p-4 overflow-hidden border border-white/5">
        {eventsLoading ? (
          <div className="py-24 text-center space-y-4">
            <div className="h-8 w-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white/40 text-sm">Syncing with calendar events...</p>
          </div>
        ) : viewMode === "month" ? (
          /* Month Grid View */
          <div className="space-y-1">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-center py-2 text-xs font-semibold text-white/40 border-b border-white/5">
              {WEEKDAYS.map(day => (
                <div key={day} className="py-1">{day}</div>
              ))}
            </div>

            {/* Grid days */}
            <div className="grid grid-cols-7 gap-1 md:gap-1.5 pt-1">
              {calendarGrid.map(({ date, isCurrentMonth, key }) => {
                const dayEvents = filteredEvents.filter(e => isSameDay(new Date(e.start), date));
                const isToday = isSameDay(new Date(), date);

                return (
                  <div
                    key={key}
                    className={`min-h-[90px] md:min-h-[110px] p-2 rounded-lg border flex flex-col justify-between transition-colors ${
                      isCurrentMonth
                        ? "bg-white/[0.02] border-white/5"
                        : "bg-transparent border-transparent opacity-25"
                    } ${isToday ? "border-accent/40 bg-accent/5" : "hover:bg-white/5"}`}
                  >
                    {/* Date Number */}
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? "bg-accent text-white h-5 w-5 rounded-full flex items-center justify-center"
                            : "text-white/60"
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[9px] text-white/35 font-mono">{dayEvents.length} events</span>
                      )}
                    </div>

                    {/* Events List */}
                    <div className="flex-1 space-y-1 overflow-y-auto max-h-[60px] md:max-h-[80px] pr-0.5 custom-scrollbar">
                      {dayEvents.map(event => (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`w-full text-left truncate text-[10px] font-medium px-1.5 py-1 rounded border capitalize flex items-center gap-1 transition-all ${getEventStyles(
                            event.type,
                            event.status
                          )}`}
                          title={event.title}
                        >
                          {event.meetingLink && <Video className="h-2.5 w-2.5 shrink-0" />}
                          <span className="truncate">{event.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Week Cards View */
          <div className="grid gap-4 sm:grid-cols-7">
            {weekDays.map(day => {
              const dayEvents = filteredEvents.filter(e => isSameDay(new Date(e.start), day));
              const isToday = isSameDay(new Date(), day);

              return (
                <div
                  key={day.toISOString()}
                  className={`rounded-lg border p-3 min-h-[300px] flex flex-col space-y-3 ${
                    isToday ? "bg-accent/5 border-accent/30" : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  }`}
                >
                  {/* Day Header */}
                  <div className="border-b border-white/5 pb-2 text-center">
                    <span className="text-[10px] text-white/40 block font-semibold uppercase">
                      {WEEKDAYS[day.getDay()]}
                    </span>
                    <span className={`text-sm font-bold mt-0.5 inline-block ${
                      isToday ? "text-accent" : "text-white/80"
                    }`}>
                      {day.toLocaleDateString("default", { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  {/* Day Events */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5 custom-scrollbar">
                    {dayEvents.map(event => (
                      <Card
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`p-2.5 cursor-pointer border hover:scale-[1.02] transition-transform ${getEventStyles(
                          event.type,
                          event.status
                        )}`}
                      >
                        <h4 className="font-semibold text-[11px] leading-tight line-clamp-2">{event.title}</h4>
                        <span className="text-[9px] text-white/50 flex items-center gap-1 mt-2.5">
                          <Clock className="h-3 w-3 shrink-0" />
                          {formatEventTime(event.start)}
                        </span>
                        {event.meetingLink && (
                          <div className="mt-2 text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                            <Video className="h-3 w-3 shrink-0" /> Joint Call
                          </div>
                        )}
                      </Card>
                    ))}
                    {dayEvents.length === 0 && (
                      <div className="h-full flex items-center justify-center text-white/20 text-[10px] italic py-16">
                        No events
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal 1: Dual-Mode Booking Modal */}
      <Modal 
        isOpen={isScheduleOpen} 
        onClose={() => setIsScheduleOpen(false)} 
        title="Schedule Client Meeting"
      >
        <div className="space-y-4">
          {/* Tab Switcher */}
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
            <button
              type="button"
              onClick={() => setScheduleMode("calcom")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                scheduleMode === "calcom" ? "bg-accent text-white shadow-sm" : "text-white/40 hover:text-white/60"
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" /> Book Online (Cal.com)
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode("manual")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                scheduleMode === "manual" ? "bg-accent text-white shadow-sm" : "text-white/40 hover:text-white/60"
              }`}
            >
              <Plus className="h-3.5 w-3.5" /> Record Internal Meeting
            </button>
          </div>

          {scheduleMode === "calcom" ? (
            /* Cal.com Iframe Embed */
            <div className="pt-2">
              <iframe
                src={getEmbeddableCalcomUrl(calcomLink)}
                className="w-full h-[500px] border-0 rounded-xl bg-white/[0.01]"
                title="Cal.com Booking Scheduler"
              />
            </div>
          ) : (
            /* Manual Meeting Form */
            <form onSubmit={handleCreateLocalEvent} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="eventTitle">Meeting Title *</Label>
                <Input
                  id="eventTitle"
                  required
                  placeholder="e.g. Discovery Call: Horizon AI Integration"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="eventClient">Associated Client</Label>
                  <Select
                    id="eventClient"
                    value={selectedClientId}
                    onChange={e => setSelectedClientId(e.target.value)}
                  >
                    <option value="">-- No Client (Internal Sync) --</option>
                    {clients.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="eventDate">Date *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    required
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="eventDesc">Notes & Summary</Label>
                <Textarea
                  id="eventDesc"
                  placeholder="Provide agenda details, action items, or prerequisites."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Video Call Link Integration</Label>
                  <p className="text-[10px] text-white/40">Automatically generate a simulated video call Meet link.</p>
                </div>
                <input
                  type="checkbox"
                  checked={generateMeet}
                  onChange={e => setGenerateMeet(e.target.checked)}
                  className="h-4 w-4 rounded border-white/15 bg-white/5 text-accent focus:ring-accent accent-accent shrink-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
                <Button type="button" variant="outline" onClick={() => setIsScheduleOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating meetup..." : "Schedule Meeting"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Modal 2: Event Details Drawer */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title || "Event Details"}
      >
        {selectedEvent && (
          <div className="space-y-5 pt-1">
            {/* Badges and tags */}
            <div className="flex items-center gap-2">
              <Badge className={`border capitalize text-xs ${getEventStyles(selectedEvent.type, selectedEvent.status)}`}>
                {selectedEvent.type === "google"
                  ? "Cal.com Synced Booking"
                  : selectedEvent.type === "meeting"
                  ? "CRM Scheduled Meeting"
                  : selectedEvent.type === "project"
                  ? "Project Milestone"
                  : "Invoice Settlement Due"}
              </Badge>
            </div>

            {/* Time / Dates */}
            <div className="space-y-3 p-4 rounded-xl border border-white/10 bg-white/5 text-sm">
              <div className="flex items-center gap-2 text-white/80">
                <CalendarIcon className="h-4 w-4 text-accent shrink-0" />
                <span className="font-medium">
                  {new Date(selectedEvent.start).toLocaleDateString([], {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Clock className="h-4 w-4 text-accent shrink-0" />
                <span className="font-mono">
                  {formatEventTime(selectedEvent.start)} - {formatEventTime(selectedEvent.end)}
                </span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-white/70">
                  <User className="h-4 w-4 text-accent shrink-0" />
                  <span>Location: {selectedEvent.location}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {selectedEvent.description && (
              <div className="space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-semibold">Notes / Details:</span>
                <p className="text-sm text-white/70 leading-relaxed bg-black/30 p-3 rounded-lg border border-white/5">
                  {selectedEvent.description}
                </p>
              </div>
            )}

            {/* Video Link */}
            {selectedEvent.meetingLink && (
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 p-4 rounded-xl border border-emerald-500/20 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Video className="h-4 w-4 shrink-0 animate-pulse" />
                    Video Call Launcher
                  </span>
                  <p className="text-[10px] text-white/50">Click to enter video chat room room.</p>
                </div>
                <a
                  href={selectedEvent.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg text-xs font-bold h-9 px-4 bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] gap-1.5 shrink-0"
                >
                  Join Meeting <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            <div className="flex items-center justify-end pt-4 border-t border-white/5">
              <Button type="button" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
