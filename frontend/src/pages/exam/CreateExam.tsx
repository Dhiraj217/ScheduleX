import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Settings2, Users, Loader2, Upload } from "lucide-react";
import { api, apiClient } from "@/lib/api-client";
import { useSetupStore } from "@/store/useSetupStore";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface EnrolmentSummary {
  subject_id: string;
  subject_code: string;
  subject_name: string;
  semester: number;
  total_enrolled: number;
  backlog_count: number;
}

export default function CreateExamPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { currentAcademicYear, setAcademicYear } = useSetupStore();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [uploadingEnrolments, setUploadingEnrolments] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: enrolments = [] } = useQuery<EnrolmentSummary[]>({
    queryKey: ["exam-enrolments"],
    queryFn: () => api.get("/exam/enrolments"),
  });

  const handleEnrolmentUpload = async (file: File) => {
    setUploadingEnrolments(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post<{ inserted: number; skipped: number; total: number }>(
        "/exam/enrolments/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      toast.success(`Imported ${res.data.inserted} student enrolments (${res.data.skipped} skipped)`);
      qc.invalidateQueries({ queryKey: ["exam-enrolments"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to upload student enrolments");
    } finally {
      setUploadingEnrolments(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!user?.college_id) return;
    api
      .get<{ academic_year: string }>(`/colleges/${user.college_id}/settings`)
      .then((cfg) => {
        if (cfg.academic_year) setAcademicYear(cfg.academic_year);
      })
      .catch(() => {});
  }, [user?.college_id, setAcademicYear]);
  
  const [form, setForm] = useState({
    examType: "internal",
    examPeriodStart: "",
    examPeriodEnd: "",
    gapDays: 1,
    studentsPerRoom: 30,
    seatingStrategy: "continuous",
    targetSemesters: [] as number[],
  });

  const toggleSemester = (sem: number) => {
    setForm(prev => ({
      ...prev,
      targetSemesters: prev.targetSemesters.includes(sem)
        ? prev.targetSemesters.filter(s => s !== sem)
        : [...prev.targetSemesters, sem]
    }));
  };

  const handleGenerate = async () => {
    if (!form.examPeriodStart || !form.examPeriodEnd) {
      toast.error("Please select exam dates.");
      return;
    }
    if (form.targetSemesters.length === 0) {
      toast.error("Please select at least one target semester.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ job_id: string; timetable_id: string; status: string }>("/exam/generate", {
        academic_year: currentAcademicYear,
        exam_type: form.examType,
        target_semesters: form.targetSemesters,
        exam_period_start: form.examPeriodStart,
        exam_period_end: form.examPeriodEnd,
        gap_days: form.gapDays,
        students_per_room: form.studentsPerRoom,
        seating_strategy: form.seatingStrategy,
        semester: form.targetSemesters[0], // Legacy
      });
      
      toast.success("Exam timetable generated successfully!");
      navigate(`/exam/${res.timetable_id}`);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to generate exam schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader title="Generate Exam Schedule" description="Configure and generate internal or external exam timetables." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Dates & Semesters */}
        <div className="bg-card rounded-xl p-6 shadow-sm space-y-6 border border-border">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Schedule Window</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Exam Type</Label>
              <Select value={form.examType} onValueChange={(val) => setForm({...form, examType: val})}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal (Mid-Term)</SelectItem>
                  <SelectItem value="external">External (End-Term)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" className="rounded-xl" value={form.examPeriodStart} onChange={e => setForm({...form, examPeriodStart: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" className="rounded-xl" value={form.examPeriodEnd} onChange={e => setForm({...form, examPeriodEnd: e.target.value})} />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label>Target Semesters</Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <button
                    key={sem}
                    onClick={() => toggleSemester(sem)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors border ${
                      form.targetSemesters.includes(sem)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    Sem {sem}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Select the semesters participating in this exam window.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Rules & Seating */}
        <div className="bg-card rounded-xl p-6 shadow-sm space-y-6 border border-border">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Settings2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Seating & Rules</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Study Gap Days (per semester)</Label>
              <Input type="number" className="rounded-xl" min={0} max={5} value={form.gapDays} onChange={e => setForm({...form, gapDays: Number(e.target.value)})} />
              <p className="text-xs text-muted-foreground">Minimum days off between exams for a single student.</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground"/> <Label>Students per Room</Label></div>
              <Input type="number" className="rounded-xl" min={10} max={200} value={form.studentsPerRoom} onChange={e => setForm({...form, studentsPerRoom: Number(e.target.value)})} />
            </div>

            <div className="space-y-2 pt-2">
              <Label>Seating Layout Strategy</Label>
              <Select value={form.seatingStrategy} onValueChange={(val) => setForm({...form, seatingStrategy: val})}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="continuous">Continuous (Same branch grouped together)</SelectItem>
                  <SelectItem value="mixed">Mixed (Interleaved branches to prevent cheating)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-5 shadow-sm border border-border flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" /> Student Exam Enrolments (Optional CSV / Excel)
          </h3>
          <p className="text-xs text-muted-foreground">
            Upload columns <code className="font-mono">student_id, subject_code, semester, is_backlog</code> for exact roll-number seating ranges and backlog clash prevention.{" "}
            {enrolments.length > 0 && (
              <span className="font-medium text-foreground">
                Currently loaded: {enrolments.reduce((acc, e) => acc + e.total_enrolled, 0)} enrolments across {enrolments.length} subjects.
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleEnrolmentUpload(f);
            }}
          />
          <Button
            variant="outline"
            className="rounded-xl gap-2"
            disabled={uploadingEnrolments}
            onClick={() => fileRef.current?.click()}
          >
            {uploadingEnrolments ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload Enrolments
          </Button>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button size="lg" className="rounded-xl btn-press" onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          {loading ? "Generating Schedule..." : "Generate Exam Timetable"}
        </Button>
      </div>
    </div>
  );
}
