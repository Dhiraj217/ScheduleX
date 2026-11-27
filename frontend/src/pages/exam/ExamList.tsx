import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Trash2, Send, Loader2, GraduationCap, Zap } from "lucide-react";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusChip, getStatusChipVariant } from "@/components/common/StatusChip";
import { toast } from "sonner";

interface ExamSummary {
  exam_tt_id: string;
  dept_id: string;
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
  entry_count: number;
  created_at: string;
}

export default function ExamListPage() {
  const qc = useQueryClient();

  const { data: exams = [], isLoading } = useQuery<ExamSummary[]>({
    queryKey: ["exams"],
    queryFn: () => api.get("/exam"),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.post(`/exam/${id}/publish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam timetable published");
    },
    onError: () => toast.error("Failed to publish exam timetable"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/exam/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam timetable deleted");
    },
    onError: () => toast.error("Failed to delete exam timetable"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Exam Schedules" description="View, publish, and export generated exam timetables">
        <Link to="/exam/create">
          <Button className="rounded-xl btn-press gap-2">
            <Zap className="h-4 w-4" /> Generate Exam
          </Button>
        </Link>
      </PageHeader>

      {exams.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm p-12 text-center space-y-4 border border-border">
          <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No exam schedules generated yet.</p>
          <Link to="/exam/create">
            <Button className="rounded-xl btn-press">Generate Your First Exam Schedule</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((ex) => {
            let sems: number[] = [];
            try {
              sems = JSON.parse(ex.target_semesters || "[]");
            } catch {
              sems = [ex.semester];
            }
            return (
              <div
                key={ex.exam_tt_id}
                className="bg-card rounded-xl shadow-sm border border-border p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div>
                    <p className="font-medium">
                      {ex.exam_type.toUpperCase()} Exams · {ex.academic_year}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {ex.exam_period_start} to {ex.exam_period_end} · Sem{" "}
                      {sems.length > 0 ? sems.join(", ") : ex.semester} · {ex.entry_count} exams ·{" "}
                      <span className="capitalize">{ex.seating_strategy}</span> seating
                      {ex.optimization_score !== null ? ` · Score: ${ex.optimization_score}/100` : ""}
                    </p>
                  </div>
                  <StatusChip variant={getStatusChipVariant(ex.status)} label={ex.status} />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/exam/${ex.exam_tt_id}`}>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                  </Link>
                  {ex.status.toLowerCase() === "draft" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-1.5"
                      onClick={() => publishMutation.mutate(ex.exam_tt_id)}
                      disabled={publishMutation.isPending}
                    >
                      <Send className="h-3.5 w-3.5" /> Publish
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-destructive"
                    onClick={() => deleteMutation.mutate(ex.exam_tt_id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
