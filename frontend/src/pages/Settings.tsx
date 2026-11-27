import { useState, useEffect } from "react";
import { Building2, Save, Globe, Clock, Calendar, Plus, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/store/useAuthStore";
import { useSetupStore } from "@/store/useSetupStore";
import { useDepartments } from "@/hooks/useDepartments";

interface CollegeSettingsData {
  college_id: string;
  college_name: string;
  academic_year: string;
  timezone: string;
  auto_conflict_check: boolean;
  allow_saturday_classes: boolean;
  max_daily_hours: number;
  default_slot_duration: number;
  odd_semester_window: string;
  even_semester_window: string;
}

interface AcademicHoliday {
  holiday_id: string;
  college_id: string;
  name: string;
  holiday_date: string;
  holiday_type: "public" | "academic" | "exam_break";
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { setAcademicYear: setStoreAcademicYear } = useSetupStore();
  const { data: departments } = useDepartments();
  const qc = useQueryClient();
  const collegeId = user?.college_id;

  const [collegeName, setCollegeName] = useState("CVM University");
  const [academicYear, setAcademicYear] = useState("2025-26");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [autoConflictCheck, setAutoConflictCheck] = useState(true);
  const [allowSaturdayClasses, setAllowSaturdayClasses] = useState(false);
  const [maxDailyHours, setMaxDailyHours] = useState("8");
  const [defaultSlotDuration, setDefaultSlotDuration] = useState("60");
  const [oddWindow, setOddWindow] = useState("Jul 2025 – Dec 2025");
  const [evenWindow, setEvenWindow] = useState("Jan 2026 – May 2026");

  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayType, setHolidayType] = useState<"public" | "academic" | "exam_break">("public");

  const { data: settingsData, isLoading } = useQuery<CollegeSettingsData>({
    queryKey: ["college-settings", collegeId],
    queryFn: () => api.get(`/colleges/${collegeId}/settings`),
    enabled: !!collegeId,
  });

  const { data: holidays = [] } = useQuery<AcademicHoliday[]>({
    queryKey: ["college-holidays", collegeId],
    queryFn: () => api.get(`/colleges/${collegeId}/holidays`),
    enabled: !!collegeId,
  });

  useEffect(() => {
    if (!settingsData) return;
    setCollegeName(settingsData.college_name);
    setAcademicYear(settingsData.academic_year);
    setTimezone(settingsData.timezone);
    setAutoConflictCheck(settingsData.auto_conflict_check);
    setAllowSaturdayClasses(settingsData.allow_saturday_classes);
    setMaxDailyHours(String(settingsData.max_daily_hours));
    setDefaultSlotDuration(String(settingsData.default_slot_duration));
    setOddWindow(settingsData.odd_semester_window);
    setEvenWindow(settingsData.even_semester_window);
    setStoreAcademicYear(settingsData.academic_year);
  }, [settingsData, setStoreAcademicYear]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put<CollegeSettingsData>(`/colleges/${collegeId}/settings`, {
        college_name: collegeName,
        academic_year: academicYear,
        timezone,
        auto_conflict_check: autoConflictCheck,
        allow_saturday_classes: allowSaturdayClasses,
        max_daily_hours: Number(maxDailyHours),
        default_slot_duration: Number(defaultSlotDuration),
        odd_semester_window: oddWindow,
        even_semester_window: evenWindow,
      }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["college-settings", collegeId] });
      setStoreAcademicYear(updated.academic_year);
      toast.success("Settings saved to database");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to save settings");
    },
  });

  const addHolidayMutation = useMutation({
    mutationFn: () =>
      api.post(`/colleges/${collegeId}/holidays`, {
        name: holidayName.trim(),
        holiday_date: holidayDate,
        holiday_type: holidayType,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["college-holidays", collegeId] });
      setHolidayName("");
      setHolidayDate("");
      toast.success("Holiday added");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to add holiday");
    },
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: (holidayId: string) => api.delete(`/colleges/${collegeId}/holidays/${holidayId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["college-holidays", collegeId] });
      toast.success("Holiday removed");
    },
    onError: () => toast.error("Failed to remove holiday"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="School Settings" description="Configure institution-wide preferences">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !collegeId}
          className="rounded-xl btn-press gap-2"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </PageHeader>

      {/* Institution Info */}
      <div className="bg-card rounded-lg shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-xl bg-chip-blue-bg flex items-center justify-center">
            <Building2 className="h-4.5 w-4.5 text-chip-blue-txt" />
          </div>
          <h3 className="text-base font-medium font-display">Institution Details</h3>
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>College Name</Label>
            <Input className="rounded-xl" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Academic Year (YYYY-YY)</Label>
              <Input className="rounded-xl" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025-26" />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="Asia/Singapore">Asia/Singapore (SGT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Departments */}
      <div className="bg-card rounded-lg shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-xl bg-chip-purple-bg flex items-center justify-center">
            <Globe className="h-4.5 w-4.5 text-chip-purple-txt" />
          </div>
          <h3 className="text-base font-medium font-display">Departments ({departments.length})</h3>
        </div>
        <Separator />
        <div className="space-y-2">
          {departments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No departments configured yet.</p>
          ) : (
            departments.map((dept) => (
              <div key={dept.dept_id} className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors">
                <div>
                  <p className="text-sm font-medium">{dept.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{dept.code}</p>
                </div>
                <span className="chip chip-blue">{dept.code}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Scheduling Preferences */}
      <div className="bg-card rounded-lg shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-xl bg-chip-green-bg flex items-center justify-center">
            <Clock className="h-4.5 w-4.5 text-chip-green-txt" />
          </div>
          <h3 className="text-base font-medium font-display">Scheduling Preferences</h3>
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto Conflict Detection</p>
              <p className="text-xs text-muted-foreground">Automatically check for conflicts during generation</p>
            </div>
            <Switch checked={autoConflictCheck} onCheckedChange={setAutoConflictCheck} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Saturday Classes</p>
              <p className="text-xs text-muted-foreground">Allow scheduling classes on Saturday</p>
            </div>
            <Switch checked={allowSaturdayClasses} onCheckedChange={setAllowSaturdayClasses} />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Daily Hours per Faculty</Label>
              <Select value={maxDailyHours} onValueChange={setMaxDailyHours}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[4, 5, 6, 7, 8, 9, 10].map((h) => (
                    <SelectItem key={h} value={String(h)}>{h} hours</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Slot Duration</Label>
              <Select value={defaultSlotDuration} onValueChange={setDefaultSlotDuration}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="50">50 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Calendar & Holidays */}
      <div className="bg-card rounded-lg shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-xl bg-chip-orange-bg flex items-center justify-center">
            <Calendar className="h-4.5 w-4.5 text-chip-orange-txt" />
          </div>
          <h3 className="text-base font-medium font-display">Academic Calendar & Holidays</h3>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Odd Semester Window</Label>
            <Input className="rounded-xl" value={oddWindow} onChange={(e) => setOddWindow(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Even Semester Window</Label>
            <Input className="rounded-xl" value={evenWindow} onChange={(e) => setEvenWindow(e.target.value)} />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Holiday Calendar</Label>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <Input
              className="rounded-xl sm:col-span-5"
              placeholder="Holiday name (e.g. Republic Day)"
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
            />
            <Input
              type="date"
              className="rounded-xl sm:col-span-3"
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
            />
            <Select value={holidayType} onValueChange={(v) => setHolidayType(v as any)}>
              <SelectTrigger className="rounded-xl sm:col-span-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="exam_break">Exam Break</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              className="rounded-xl sm:col-span-2 gap-1"
              disabled={!holidayName.trim() || !holidayDate || addHolidayMutation.isPending}
              onClick={() => addHolidayMutation.mutate()}
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>

          <div className="space-y-2 pt-2">
            {holidays.length === 0 ? (
              <p className="text-xs text-muted-foreground">No holidays scheduled yet.</p>
            ) : (
              holidays.map((h) => (
                <div key={h.holiday_id} className="flex items-center justify-between p-2.5 rounded-xl border border-border text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{h.holiday_date}</span>
                    <span className="font-medium">{h.name}</span>
                    <span className="chip chip-orange capitalize">{h.holiday_type.replace("_", " ")}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive rounded-lg"
                    onClick={() => deleteHolidayMutation.mutate(h.holiday_id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
