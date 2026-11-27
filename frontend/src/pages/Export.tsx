import { FileText, Table2, User, Building2, Download, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useTimetable } from "@/hooks/useTimetable";
import { useTimeSlots } from "@/hooks/useTimeSlots";
import { useState } from "react";
import { toast } from "sonner";
import type { Timetable } from "@/types";
import {
  exportDepartmentPDF,
  exportExcelWorkbook,
  exportFacultyPDF,
  exportRoomPDF,
  exportTimetableICS,
} from "@/lib/export-utils";


export default function ExportPage() {
  const { data: timetables, isLoading } = useTimetable();
  const { data: slots } = useTimeSlots();
  const [selectedTimetableId, setSelectedTimetableId] = useState("");
  const [exporting, setExporting] = useState<string | null>(null);

  // Fetch the full timetable (with entries) for the selected ID
  const { data: selectedTT = null, isLoading: timetableLoading } = useQuery<Timetable>({
    queryKey: ["timetable", selectedTimetableId],
    queryFn: () => api.get(`/timetable/${selectedTimetableId}`),
    enabled: !!selectedTimetableId,
  });

  const handleExport = async (format: string) => {
    if (!selectedTT) {
      toast.error("Please select a timetable first");
      return;
    }
    if (selectedTT.entries.length === 0) {
      toast.error("Selected timetable has no entries");
      return;
    }
    setExporting(format);
    try {
      switch (format) {
        case "pdf":
          await exportDepartmentPDF(selectedTT);
          break;
        case "xlsx":
          exportExcelWorkbook(selectedTT, slots);
          break;
        case "faculty-pdf":
          await exportFacultyPDF(selectedTT);
          break;
        case "room-pdf":
          await exportRoomPDF(selectedTT);
          break;
        case "ics":
          await exportTimetableICS(selectedTT);
          break;
      }
      toast.success("Export downloaded successfully");
    } catch {
      toast.error("Export failed — please try again");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Export Timetable" description="Download timetables in various formats" />

      <div className="max-w-xs space-y-2">
        <Label>Select Timetable</Label>
        <Select value={selectedTimetableId} onValueChange={setSelectedTimetableId}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a timetable" /></SelectTrigger>
          <SelectContent>
            {timetables.map((tt) => (
              <SelectItem key={tt.timetable_id} value={tt.timetable_id}>
                Sem {tt.semester} · {tt.academic_year} · {tt.status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {timetableLoading && selectedTimetableId && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading entries…
          </p>
        )}
      </div>

      <div className="bg-card rounded-xl shadow-sm p-6 max-w-4xl">
        <Tabs defaultValue="class" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="class" className="gap-2"><FileText className="h-4 w-4" /> Class View</TabsTrigger>
            <TabsTrigger value="faculty" className="gap-2"><User className="h-4 w-4" /> Faculty View</TabsTrigger>
            <TabsTrigger value="room" className="gap-2"><Building2 className="h-4 w-4" /> Room View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="class" className="space-y-4">
            <h3 className="font-semibold text-lg">Class-Wise Timetables</h3>
            <p className="text-sm text-muted-foreground mb-4">Export the standard timetable view, showing what classes are scheduled at what times.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-5 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="chip chip-blue !rounded-xl !p-2.5"><FileText className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-medium">Timetable PDF</h3>
                    <p className="text-xs text-muted-foreground mt-1">Full timetable grid, color coded, formatted for A4 landscape printing.</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-xl gap-2 w-full" onClick={() => handleExport("pdf")} disabled={!selectedTT || timetableLoading || exporting === "pdf"}>
                  {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download PDF
                </Button>
              </div>
              <div className="border border-border rounded-lg p-5 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="chip chip-green !rounded-xl !p-2.5"><Table2 className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-medium">Excel Workbook</h3>
                    <p className="text-xs text-muted-foreground mt-1">4 detailed sheets: Grid view, Faculty view, Room view, and Summary data.</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-xl gap-2 w-full" onClick={() => handleExport("xlsx")} disabled={!selectedTT || timetableLoading || exporting === "xlsx"}>
                  {exporting === "xlsx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download Excel
                </Button>
              </div>
              <div className="border border-border rounded-lg p-5 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="chip chip-purple !rounded-xl !p-2.5"><FileText className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-medium">Calendar Feed (.ics)</h3>
                    <p className="text-xs text-muted-foreground mt-1">Import recurring weekly lectures & labs directly into Google Calendar or Outlook.</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-xl gap-2 w-full" onClick={() => handleExport("ics")} disabled={!selectedTT || timetableLoading || exporting === "ics"}>
                  {exporting === "ics" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download .ics
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="faculty" className="space-y-4">
            <h3 className="font-semibold text-lg">Faculty-Wise Schedules</h3>
            <p className="text-sm text-muted-foreground mb-4">Export individualized timetables for each faculty member.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-5 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="chip chip-purple !rounded-xl !p-2.5"><User className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-medium">Faculty Schedule Book</h3>
                    <p className="text-xs text-muted-foreground mt-1">Generates a multi-page PDF with one faculty member's personal schedule per page.</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-xl gap-2 w-full" onClick={() => handleExport("faculty-pdf")} disabled={!selectedTT || timetableLoading || exporting === "faculty-pdf"}>
                  {exporting === "faculty-pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download PDF
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="room" className="space-y-4">
            <h3 className="font-semibold text-lg">Room-Wise Allocations</h3>
            <p className="text-sm text-muted-foreground mb-4">Export physical room allocation schedules for notice boards.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-5 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="chip chip-orange !rounded-xl !p-2.5"><Building2 className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-medium">Room Allocation Book</h3>
                    <p className="text-xs text-muted-foreground mt-1">Generates a multi-page PDF showing the weekly schedule for each physical classroom/lab.</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-xl gap-2 w-full" onClick={() => handleExport("room-pdf")} disabled={!selectedTT || timetableLoading || exporting === "room-pdf"}>
                  {exporting === "room-pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download PDF
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
