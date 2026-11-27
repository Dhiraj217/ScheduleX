import { useState } from "react";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusChip, getSubjectChipVariant } from "@/components/common/StatusChip";
import { useSubjects } from "@/hooks/useSubjects";
import { useDepartments } from "@/hooks/useDepartments";
import { usePrograms } from "@/hooks/usePrograms";
import { useAuthStore } from "@/store/useAuthStore";
import { EmptyState } from "@/components/common/EmptyState";
import { useSetupStore } from "@/store/useSetupStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubjectsSkeleton } from "@/components/skeletons/PageSkeletons";
import type { Subject } from "@/types";

const defaultForm = {
  name: "", code: "", credits: 3, lectureHours: 3, labHours: 0, batchSize: 60, batch: "", needsLab: false, parallelGroup: "", electiveGroup: "", isElective: false
};

export default function SubjectsPage() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "super_admin";
  const { data: departments } = useDepartments();
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const activeDeptId = isSuperAdmin && selectedDeptId && selectedDeptId !== "all" ? selectedDeptId : (isSuperAdmin ? undefined : user?.dept_id || undefined);

  const { programs } = usePrograms(activeDeptId);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("all");
  const activeProgramId = selectedProgramId !== "all" ? selectedProgramId : undefined;

  const { currentSemester, setSemester } = useSetupStore();
  const { data: allSubjects, isLoading, create, update, remove } = useSubjects(currentSemester, activeDeptId, activeProgramId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [form, setForm] = useState(defaultForm);

  const openCreate = () => {
    setEditingSubject(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setForm({
      name: sub.name,
      code: sub.subject_code,
      credits: sub.credits,
      lectureHours: sub.lecture_hours || sub.weekly_periods,
      labHours: sub.lab_hours || 0,
      batchSize: sub.batch_size || 60,
      batch: sub.batch || "",
      needsLab: sub.needs_lab,
      parallelGroup: sub.parallel_group || "",
      electiveGroup: sub.elective_group || "",
      isElective: sub.is_elective || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const body = {
      name: form.name,
      subject_code: form.code,
      semester: currentSemester,
      program_id: activeProgramId, // Must require selecting a program if adding a subject!
      credits: form.credits,
      weekly_periods: form.lectureHours + form.labHours,
      lecture_hours: form.lectureHours,
      lab_hours: form.labHours,
      needs_lab: form.labHours > 0 || form.needsLab,
      batch_size: form.batchSize,
      batch: form.batch || undefined,
      parallel_group: form.parallelGroup || undefined,
      is_elective: form.electiveGroup.trim() !== "",
      elective_group: form.electiveGroup || undefined,
    };
    if (editingSubject) {
      await update(editingSubject.subject_id, body);
    } else {
      await create(body);
    }
    setDialogOpen(false);
  };

  if (isLoading && allSubjects.length === 0) return <SubjectsSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title="Subjects" description="Manage subjects by semester">
        <Button className="rounded-xl btn-press gap-2" onClick={openCreate}><Plus className="h-4 w-4" />Add Subject</Button>
      </PageHeader>

      {/* Department filter & Semester tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        {isSuperAdmin && departments.length > 0 && (
          <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
            <SelectTrigger className="w-[200px] rounded-xl">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.dept_id} value={d.dept_id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {programs.length > 0 && (
          <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
            <SelectTrigger className="w-[200px] rounded-xl">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.program_id} value={p.program_id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Semester tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
          <button
            key={sem}
            onClick={() => setSemester(sem)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              currentSemester === sem ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            Sem {sem}
          </button>
        ))}
      </div>

      {allSubjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects" description={`No subjects found for Semester ${currentSemester}`} actionLabel="Add Subject" onAction={openCreate} />
      ) : (
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Code</th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Credits</th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">L</th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">P</th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Student Count</th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Sync/Elective</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {allSubjects.map((sub) => (
                <tr key={sub.subject_id} className="border-b border-border last:border-0 group hover:bg-accent/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium">{sub.subject_code}</td>
                  <td className="py-3 px-4">{sub.name}</td>
                  <td className="py-3 px-4"><StatusChip variant={getSubjectChipVariant(sub.needs_lab)} label={sub.lab_hours > 0 ? "L+P" : "THEORY"} /></td>
                  <td className="py-3 px-4">{sub.credits}</td>
                  <td className="py-3 px-4">{sub.lecture_hours || sub.weekly_periods}</td>
                  <td className="py-3 px-4">{sub.lab_hours || 0}</td>
                  <td className="py-3 px-4">{sub.batch_size || 60}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      {sub.parallel_group && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border text-muted-foreground w-fit">
                          Sync: {sub.parallel_group}
                        </span>
                      )}
                      {sub.elective_group && (
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 w-fit">
                          Elec: {sub.elective_group}
                        </span>
                      )}
                      {!sub.parallel_group && !sub.elective_group && "—"}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="rounded-xl h-7 w-7" onClick={() => openEdit(sub)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="rounded-xl h-7 w-7 text-destructive" onClick={() => remove(sub.subject_id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-lg max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input className="rounded-xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Data Structures" />
            </div>
            <div className="space-y-2">
              <Label>Subject Code</Label>
              <Input className="rounded-xl font-mono" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="DSA301" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Credits</Label>
                <Input type="number" className="rounded-xl" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} min={1} max={6} />
              </div>
              <div className="space-y-2">
                <Label>Lecture hrs/wk</Label>
                <Input type="number" className="rounded-xl" value={form.lectureHours} onChange={(e) => setForm({ ...form, lectureHours: Number(e.target.value) })} min={0} max={10} />
              </div>
              <div className="space-y-2">
                <Label>Lab hrs/wk</Label>
                <Input type="number" className="rounded-xl" value={form.labHours} onChange={(e) => setForm({ ...form, labHours: Number(e.target.value) })} min={0} max={10} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Student Count (Class Size)</Label>
                <Input className="rounded-xl" type="number" value={form.batchSize} onChange={(e) => setForm({ ...form, batchSize: parseInt(e.target.value) || 0 })} />
                <p className="text-[10px] text-muted-foreground">Total students for core, or enrolled count for electives.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Parallel Group (Sync)</Label>
                <Input className="rounded-xl" value={form.parallelGroup} onChange={(e) => setForm({ ...form, parallelGroup: e.target.value })} placeholder="e.g. LAB-GRP-1" />
                <p className="text-[10px] text-muted-foreground">Same group ID = exact same time.</p>
              </div>
              <div className="space-y-2">
                <Label>Elective Group</Label>
                <Input className="rounded-xl" value={form.electiveGroup} onChange={(e) => setForm({ ...form, electiveGroup: e.target.value })} placeholder="e.g. PE-1, OE-2" />
                <p className="text-[10px] text-muted-foreground">Same group ID = exact same time.</p>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full rounded-xl btn-press" disabled={!form.name.trim() || !form.code.trim()}>
              {editingSubject ? "Update Subject" : "Add Subject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
