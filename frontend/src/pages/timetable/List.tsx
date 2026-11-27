import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Trash2, Send, Loader2, Copy } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusChip, getStatusChipVariant } from "@/components/common/StatusChip";
import { useTimetable } from "@/hooks/useTimetable";
import { useDepartments } from "@/hooks/useDepartments";
import { useAuthStore } from "@/store/useAuthStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { Timetable } from "@/types";

export default function TimetableListPage() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "super_admin";
  const { data: departments } = useDepartments();
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");

  const deptIdParam = isSuperAdmin && selectedDeptId !== "all" ? selectedDeptId : undefined;
  const { data: timetables, isLoading, publish, remove } = useTimetable(undefined, deptIdParam);
  const qc = useQueryClient();
  const [cloneTarget, setCloneTarget] = useState<Timetable | null>(null);
  const [cloneYear, setCloneYear] = useState("2026-27");
  const [cloning, setCloning] = useState(false);

  const handleClone = async () => {
    if (!cloneTarget) return;
    setCloning(true);
    try {
      const res = await api.post<{ copied_entries: number; skipped_conflicts: number }>(
        `/timetable/${cloneTarget.timetable_id}/clone`,
        { academic_year: cloneYear }
      );
      await qc.invalidateQueries({ queryKey: ["timetables"] });
      toast.success(`Cloned ${res.copied_entries} entries (${res.skipped_conflicts} skipped due to slot conflicts)`);
      setCloneTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to clone timetable");
    } finally {
      setCloning(false);
    }
  };

  // Group timetables by department for super_admin "all" view
  const groupedByDept: Record<string, { name: string; timetables: Timetable[] }> = {};
  if (isSuperAdmin && selectedDeptId === "all") {
    for (const tt of timetables) {
      const key = tt.dept_id ?? "unknown";
      if (!groupedByDept[key]) {
        groupedByDept[key] = { name: tt.dept_name ?? "Unknown", timetables: [] };
      }
      groupedByDept[key].timetables.push(tt);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Timetables" description="View and manage generated timetables">
        {!isSuperAdmin && (
          <Link to="/timetable/generate">
            <Button className="rounded-xl btn-press">Generate New</Button>
          </Link>
        )}
      </PageHeader>

      {isSuperAdmin && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">Department</label>
          <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
            <SelectTrigger className="w-[260px] rounded-xl">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.dept_id} value={d.dept_id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {timetables.length === 0 ? (
        <div className="bg-card rounded-lg shadow-sm p-12 text-center">
          <p className="text-muted-foreground">No timetables generated yet.</p>
          {!isSuperAdmin && (
            <Link to="/timetable/generate">
              <Button className="rounded-xl btn-press mt-4">Generate Your First Timetable</Button>
            </Link>
          )}
        </div>
      ) : isSuperAdmin && selectedDeptId === "all" ? (
        // Grouped view for super admin
        <div className="space-y-8">
          {Object.entries(groupedByDept).map(([deptId, group]) => (
            <div key={deptId}>
              <h3 className="text-lg font-semibold mb-3 text-primary">{group.name}</h3>
              <div className="space-y-3">
                {group.timetables.map((tt) => (
                  <TimetableCard key={tt.timetable_id} tt={tt} publish={publish} remove={remove} onClone={setCloneTarget} showDept={false} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {timetables.map((tt) => (
            <TimetableCard key={tt.timetable_id} tt={tt} publish={publish} remove={remove} onClone={setCloneTarget} showDept={isSuperAdmin} />
          ))}
        </div>
      )}

      <Dialog open={!!cloneTarget} onOpenChange={(o) => !o && setCloneTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Timetable to New Academic Year</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Target Academic Year (YYYY-YY)</Label>
            <Input value={cloneYear} onChange={(e) => setCloneYear(e.target.value)} placeholder="2026-27" className="rounded-xl" />
            <p className="text-xs text-muted-foreground">
              Copies all conflict-free slots from Semester {cloneTarget?.semester} ({cloneTarget?.academic_year}) into a new draft.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneTarget(null)}>Cancel</Button>
            <Button onClick={handleClone} disabled={cloning}>
              {cloning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Clone Timetable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimetableCard({
  tt,
  publish,
  remove,
  onClone,
  showDept,
}: {
  tt: Timetable;
  publish: (id: string) => void;
  remove: (id: string) => void;
  onClone: (tt: Timetable) => void;
  showDept: boolean;
}) {
  return (
    <div className="bg-card rounded-lg shadow-sm p-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div>
          <p className="font-medium">
            {showDept && tt.dept_name && (
              <span className="text-primary">{tt.dept_name} · </span>
            )}
            Semester {tt.semester} · {tt.academic_year}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tt.entries.length} entries · Score: {tt.optimization_score ?? "N/A"}/100
          </p>
        </div>
        <StatusChip variant={getStatusChipVariant(tt.status)} label={tt.status} />
      </div>
      <div className="flex items-center gap-2">
        <Link to={`/timetable/view/${tt.timetable_id}`}>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
            <Eye className="h-3.5 w-3.5" />View
          </Button>
        </Link>
        {tt.status.toUpperCase() === "DRAFT" && (
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => publish(tt.timetable_id)}>
            <Send className="h-3.5 w-3.5" />Publish
          </Button>
        )}
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => onClone(tt)}>
          <Copy className="h-3.5 w-3.5" />Clone
        </Button>
        <Button variant="ghost" size="sm" className="rounded-xl text-destructive" onClick={() => remove(tt.timetable_id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
