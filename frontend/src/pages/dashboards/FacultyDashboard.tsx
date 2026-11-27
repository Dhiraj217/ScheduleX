import { BookOpen, CalendarDays, Clock, BarChart3, Download, Check, X, ShieldCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MetricCard } from "@/components/common/MetricCard";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/common/StatusChip";
import { useAuthStore } from "@/store/useAuthStore";
import { useFaculty } from "@/hooks/useFaculty";
import { api, apiClient } from "@/lib/api-client";
import type { FacultyLoad } from "@/types";
import { DashboardSkeleton } from "@/components/skeletons/PageSkeletons";
import { toast } from "sonner";

interface InvigilatorDuty {
  assignment_id: string;
  exam_tt_id: string;
  exam_type: string;
  academic_year: string;
  exam_date: string;
  start_time: string;
  duration_minutes: number;
  subject_code: string;
  subject_name: string;
  rooms: string;
  role: string;
  confirmed: boolean;
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default function FacultyDashboard() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const { data: facultyList, isLoading: facLoading } = useFaculty();
  const { data: myLoadRows = [], isLoading: loadLoading } = useQuery<FacultyLoad[]>({
    queryKey: ["analytics", "faculty-load", "faculty", user?.user_id],
    queryFn: () => api.get("/analytics/faculty-load"),
    enabled: !!user?.user_id,
  });

  const { data: duties = [] } = useQuery<InvigilatorDuty[]>({
    queryKey: ["exam", "my-duties", user?.user_id],
    queryFn: () => api.get("/exam/my-duties"),
    enabled: !!user?.user_id,
  });

  const respondDuty = useMutation({
    mutationFn: ({ id, confirmed }: { id: string; confirmed: boolean }) =>
      api.post<{ message: string }>(`/exam/invigilators/${id}/confirm`, { confirmed }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["exam", "my-duties"] });
      toast.success(res.message);
    },
    onError: () => toast.error("Failed to update duty response"),
  });

  const handleDownloadICS = async () => {
    try {
      const res = await apiClient.get("/export/ics/faculty/me", { responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my_schedule.ics";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Personal calendar (.ics) downloaded");
    } catch {
      toast.error("Failed to export personal calendar");
    }
  };

  const isLoading = facLoading || loadLoading;
  if (isLoading) return <DashboardSkeleton />;

  const userName = user?.full_name ?? "Faculty";
  const myProfile = facultyList.length > 0 ? facultyList[0] : null;
  const myLoad = myProfile
    ? myLoadRows.find((f) => f.faculty_id === myProfile.faculty_id)
    : myLoadRows[0];

  const assignedPeriods = myLoad?.assigned_periods ?? 0;
  const maxLoad = myProfile?.max_weekly_load ?? myLoad?.max_weekly_load ?? 18;
  const utilPct = maxLoad > 0 ? Math.round((assignedPeriods / maxLoad) * 100) : 0;
  const freeSlots = Math.max(0, maxLoad - assignedPeriods);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${userName} 👋`}
        description="Your personal teaching & invigilation dashboard"
      >
        <Button variant="outline" className="rounded-xl gap-2" onClick={handleDownloadICS}>
          <Download className="h-4 w-4" /> Export .ics Calendar
        </Button>
      </PageHeader>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={CalendarDays} value={assignedPeriods} label="Assigned Periods" chipClass="chip-blue" />
        <MetricCard icon={Clock} value={freeSlots} label="Free Slots" chipClass="chip-green" />
        <MetricCard icon={BarChart3} value={`${utilPct}%`} label="Workload Utilization" chipClass="chip-purple" />
        <MetricCard icon={BookOpen} value={myProfile?.expertise?.length ?? 0} label="Expertise Areas" chipClass="chip-orange" />
      </div>

      {/* Profile Info */}
      {myProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Profile Card */}
          <div className="bg-card rounded-xl shadow-sm p-6">
            <h3 className="text-base font-medium font-display mb-4">My Profile</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground text-sm font-semibold">
                    {myProfile.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-lg">{myProfile.name}</p>
                  <p className="text-sm font-mono text-muted-foreground">{myProfile.employee_id}</p>
                </div>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Weekly Load</span>
                  <span className="font-medium">{myProfile.max_weekly_load} periods</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preferred Time</span>
                  <span className="font-medium capitalize">{myProfile.preferred_time || "Any"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Substitutions</span>
                  <span className="font-medium">{myProfile.substitution_count}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expertise & Workload */}
          <div className="bg-card rounded-xl shadow-sm p-6">
            <h3 className="text-base font-medium font-display mb-4">Expertise & Workload</h3>
            {myProfile.expertise && myProfile.expertise.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Areas of Expertise</p>
                <div className="flex flex-wrap gap-2">
                  {myProfile.expertise.map((e) => (
                    <span key={e} className="chip chip-blue">{e}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground mb-3">Weekly Load</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Assigned</span>
                  <span className="font-medium">{assignedPeriods} / {maxLoad} periods</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{
                      width: `${Math.min(utilPct, 100)}%`,
                      backgroundColor: utilPct > 90 ? "hsl(0,72%,51%)" : utilPct > 70 ? "hsl(27,96%,48%)" : "hsl(142,64%,24%)",
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {utilPct > 90 ? "Near capacity — consider reducing load" :
                    utilPct > 70 ? "Healthy workload" :
                      "Capacity available for more assignments"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exam Invigilation Duties */}
      <div className="bg-card rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="text-base font-medium font-display">Exam Invigilation Duties</h3>
          </div>
          <span className="text-xs text-muted-foreground">{duties.length} assigned</span>
        </div>

        {duties.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming invigilation duties assigned.</p>
        ) : (
          <div className="space-y-2.5">
            {duties.map((d) => (
              <div key={d.assignment_id} className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-border">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    {d.subject_code ? `${d.subject_code} · ` : ""}{d.subject_name}{" "}
                    <span className="text-xs text-muted-foreground capitalize">({d.exam_type})</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.exam_date} · {d.start_time} ({d.duration_minutes} mins) · Rooms: {d.rooms} ·{" "}
                    <span className="capitalize">{d.role.replace("_", " ")}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip
                    variant={d.confirmed ? "approved" : "draft"}
                    label={d.confirmed ? "Confirmed" : "Pending"}
                  />
                  {!d.confirmed && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl gap-1 text-xs"
                        disabled={respondDuty.isPending}
                        onClick={() => respondDuty.mutate({ id: d.assignment_id, confirmed: true })}
                      >
                        <Check className="h-3.5 w-3.5" /> Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl gap-1 text-xs text-destructive"
                        disabled={respondDuty.isPending}
                        onClick={() => respondDuty.mutate({ id: d.assignment_id, confirmed: false })}
                      >
                        <X className="h-3.5 w-3.5" /> Decline
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!myProfile && (
        <div className="bg-card rounded-xl shadow-sm p-8 text-center">
          <p className="text-muted-foreground">No faculty profile found. Please contact your department admin to set up your profile.</p>
        </div>
      )}
    </div>
  );
}
