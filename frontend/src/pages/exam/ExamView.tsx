import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusChip, getStatusChipVariant } from "@/components/common/StatusChip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Loader2, ArrowLeft, Send, CalendarDays, DoorOpen, Users } from "lucide-react";
import { toast } from "sonner";

interface SeatingPlan {
  plan_id: string;
  room_id: string;
  room_name: string;
  program_id?: string | null;
  program_code?: string | null;
  program_name?: string | null;
  student_count: number;
  seat_range?: string | null;
}

interface Invigilator {
  assignment_id: string;
  faculty_id: string;
  faculty_name: string;
  role: string;
  confirmed: boolean;
}

interface ExamEntry {
  entry_id: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  semester: number;
  exam_date: string;
  start_time: string;
  duration_minutes: number;
  venue_name: string;
  enrolled_count: number;
  seating_plans: SeatingPlan[];
  invigilators: Invigilator[];
}

interface ExamDetail {
  exam_tt_id: string;
  semester: number;
  academic_year: string;
  exam_type: string;
  target_semesters: string;
  exam_period_start: string;
  exam_period_end: string;
  gap_days: number;
  students_per_room: number;
  seating_strategy: string;
  status: string;
  optimization_score: number | null;
  entries: ExamEntry[];
}

export default function ExamViewPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [downloading, setDownloading] = useState(false);

  const { data: exam, isLoading, error } = useQuery<ExamDetail>({
    queryKey: ["exam", id],
    queryFn: () => api.get(`/exam/${id}`),
    enabled: !!id,
  });

  const publishMutation = useMutation({
    mutationFn: () => api.post(`/exam/${id}/publish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exam", id] });
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam timetable published");
    },
    onError: () => toast.error("Failed to publish exam timetable"),
  });

  const handleDownloadPdf = async () => {
    if (!exam) return;
    setDownloading(true);
    try {
      const res = await apiClient.get(`/exam/${exam.exam_tt_id}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Exam_Schedule_${exam.exam_type}_${exam.academic_year}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Exam PDF downloaded");
    } catch {
      toast.error("PDF export failed (WeasyPrint may not be installed on the server)");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading Exam Timetable...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load exam timetable. It may not exist.
      </div>
    );
  }

  let parsedSems: number[] = [];
  try {
    parsedSems = JSON.parse(exam.target_semesters || "[]");
  } catch {
    parsedSems = [exam.semester];
  }

  const seatingRows = exam.entries.flatMap((entry) =>
    entry.seating_plans.map((plan) => ({
      ...plan,
      exam_date: entry.exam_date,
      start_time: entry.start_time,
      subject_name: entry.subject_name,
      subject_code: entry.subject_code,
    }))
  );

  const invigilatorRows = exam.entries.flatMap((entry) =>
    entry.invigilators.map((inv) => ({
      ...inv,
      exam_date: entry.exam_date,
      start_time: entry.start_time,
      subject_name: entry.subject_name,
      subject_code: entry.subject_code,
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/exam/list">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <PageHeader
            title={`${exam.exam_type.toUpperCase()} Exam Schedule`}
            description={`Academic Year: ${exam.academic_year}${exam.optimization_score !== null ? ` · Score: ${exam.optimization_score}/100` : ""}`}
          >
            <div className="flex items-center gap-2">
              <StatusChip label={exam.status} variant={getStatusChipVariant(exam.status)} />
              {exam.status.toLowerCase() === "draft" && (
                <Button
                  variant="outline"
                  className="rounded-xl gap-2"
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                >
                  <Send className="h-4 w-4" /> Publish
                </Button>
              )}
              <Button
                variant="outline"
                className="rounded-xl gap-2"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download PDF
              </Button>
            </div>
          </PageHeader>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <p className="text-xs text-muted-foreground">Window</p>
          <p className="font-medium">{exam.exam_period_start} to {exam.exam_period_end}</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <p className="text-xs text-muted-foreground">Semesters</p>
          <p className="font-medium">Sem {parsedSems.length > 0 ? parsedSems.join(", ") : exam.semester}</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <p className="text-xs text-muted-foreground">Seating Strategy</p>
          <p className="font-medium capitalize">{exam.seating_strategy} ({exam.students_per_room}/room)</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <p className="text-xs text-muted-foreground">Gap Days</p>
          <p className="font-medium">{exam.gap_days} days</p>
        </div>
      </div>

      <Tabs defaultValue="datesheet" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="datesheet" className="gap-2">
            <CalendarDays className="h-4 w-4" /> Date Sheet ({exam.entries.length})
          </TabsTrigger>
          <TabsTrigger value="seating" className="gap-2">
            <DoorOpen className="h-4 w-4" /> Seating Plan ({seatingRows.length})
          </TabsTrigger>
          <TabsTrigger value="invigilators" className="gap-2">
            <Users className="h-4 w-4" /> Invigilators ({invigilatorRows.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="datesheet">
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Time</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Sem</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Subject</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Rooms</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Duration</th>
                  <th className="text-right py-3 px-6 font-medium text-muted-foreground">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {exam.entries.map((entry) => (
                  <tr key={entry.entry_id} className="border-b border-border last:border-0 hover:bg-muted/5">
                    <td className="py-3 px-6">{entry.exam_date}</td>
                    <td className="py-3 px-6">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-mono text-xs">
                        {entry.start_time}
                      </span>
                    </td>
                    <td className="py-3 px-6">Sem {entry.semester}</td>
                    <td className="py-3 px-6 font-medium">
                      {entry.subject_code ? `${entry.subject_code} · ` : ""}
                      {entry.subject_name}
                    </td>
                    <td className="py-3 px-6 text-muted-foreground">{entry.venue_name}</td>
                    <td className="py-3 px-6">{entry.duration_minutes} mins</td>
                    <td className="py-3 px-6 text-right font-medium">{entry.enrolled_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="seating">
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Date & Time</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Subject</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Room</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Branch / Program</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Roll / Seat Range</th>
                  <th className="text-right py-3 px-6 font-medium text-muted-foreground">Students Seated</th>
                </tr>
              </thead>
              <tbody>
                {seatingRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No seating plans generated for this exam schedule.
                    </td>
                  </tr>
                ) : (
                  seatingRows.map((row) => (
                    <tr key={row.plan_id} className="border-b border-border last:border-0 hover:bg-muted/5">
                      <td className="py-3 px-6">{row.exam_date} · {row.start_time}</td>
                      <td className="py-3 px-6 font-medium">
                        {row.subject_code ? `${row.subject_code} · ` : ""}
                        {row.subject_name}
                      </td>
                      <td className="py-3 px-6 font-medium">{row.room_name}</td>
                      <td className="py-3 px-6">{row.program_code || row.program_name || "General"}</td>
                      <td className="py-3 px-6 font-mono text-xs text-muted-foreground">{row.seat_range || "—"}</td>
                      <td className="py-3 px-6 text-right font-medium">{row.student_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="invigilators">
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Date & Time</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Subject</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Faculty</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {invigilatorRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No invigilators assigned.
                    </td>
                  </tr>
                ) : (
                  invigilatorRows.map((inv) => (
                    <tr key={inv.assignment_id} className="border-b border-border last:border-0 hover:bg-muted/5">
                      <td className="py-3 px-6">{inv.exam_date} · {inv.start_time}</td>
                      <td className="py-3 px-6 font-medium">
                        {inv.subject_code ? `${inv.subject_code} · ` : ""}
                        {inv.subject_name}
                      </td>
                      <td className="py-3 px-6 font-medium">{inv.faculty_name}</td>
                      <td className="py-3 px-6 capitalize">{inv.role.replace("_", " ")}</td>
                      <td className="py-3 px-6">
                        <StatusChip
                          variant={inv.confirmed ? "approved" : "draft"}
                          label={inv.confirmed ? "Confirmed" : "Pending"}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
