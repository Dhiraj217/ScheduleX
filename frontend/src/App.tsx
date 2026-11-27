import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RoleDashboard } from "@/components/layout/RoleDashboard";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { Loader2 } from "lucide-react";

const LoginPage = lazy(() => import("@/pages/Login"));
const RegisterPage = lazy(() => import("@/pages/Register"));
const HodDashboard = lazy(() => import("@/pages/dashboards/HodDashboard"));
const FacultyDashboard = lazy(() => import("@/pages/dashboards/FacultyDashboard"));
const UserManagementPage = lazy(() => import("@/pages/admin/UserManagement"));
const PdfImportPage = lazy(() => import("@/pages/admin/PdfImport"));
const TimeSlotsPage = lazy(() => import("@/pages/setup/TimeSlots"));
const SubjectsPage = lazy(() => import("@/pages/setup/Subjects"));
const FacultyPage = lazy(() => import("@/pages/setup/Faculty"));
const RoomsPage = lazy(() => import("@/pages/setup/Rooms"));
const GeneratePage = lazy(() => import("@/pages/timetable/Generate"));
const TimetableListPage = lazy(() => import("@/pages/timetable/List"));
const TimetableViewPage = lazy(() => import("@/pages/timetable/View"));
const ConflictsPage = lazy(() => import("@/pages/timetable/Conflicts"));
const ExportPage = lazy(() => import("@/pages/Export"));
const NlqAnalyticsPage = lazy(() => import("@/pages/NlqAnalytics"));
const SchedulingPage = lazy(() => import("@/pages/Scheduling"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const CreateExamPage = lazy(() => import("@/pages/exam/CreateExam"));
const ExamListPage = lazy(() => import("@/pages/exam/ExamList"));
const ExamViewPage = lazy(() => import("@/pages/exam/ExamView"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Dashboard routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<RoleDashboard />} />
              <Route path="/dashboard/hod" element={<RoleGuard roles={["dept_admin"]}><HodDashboard /></RoleGuard>} />
              <Route path="/dashboard/faculty" element={<RoleGuard roles={["faculty"]}><FacultyDashboard /></RoleGuard>} />
              <Route path="/admin/users" element={<RoleGuard roles={["super_admin"]}><UserManagementPage /></RoleGuard>} />
              <Route path="/admin/pdf-import" element={<RoleGuard roles={["super_admin"]}><PdfImportPage /></RoleGuard>} />
              <Route path="/setup/time-slots" element={<RoleGuard roles={["super_admin", "dept_admin"]}><TimeSlotsPage /></RoleGuard>} />
              <Route path="/setup/subjects" element={<RoleGuard roles={["super_admin", "dept_admin"]}><SubjectsPage /></RoleGuard>} />
              <Route path="/setup/faculty" element={<RoleGuard roles={["super_admin", "dept_admin"]}><FacultyPage /></RoleGuard>} />
              <Route path="/setup/rooms" element={<RoleGuard roles={["super_admin", "dept_admin"]}><RoomsPage /></RoleGuard>} />
              <Route path="/timetable/generate" element={<RoleGuard roles={["super_admin", "dept_admin"]}><GeneratePage /></RoleGuard>} />
              <Route path="/timetable/list" element={<TimetableListPage />} />
              <Route path="/timetable/view/:id" element={<TimetableViewPage />} />
              <Route path="/timetable/conflicts/:id" element={<RoleGuard roles={["super_admin", "dept_admin"]}><ConflictsPage /></RoleGuard>} />
              <Route path="/timetable/conflicts" element={<RoleGuard roles={["super_admin", "dept_admin"]}><ConflictsPage /></RoleGuard>} />
              <Route path="/exam/create" element={<RoleGuard roles={["super_admin", "dept_admin"]}><CreateExamPage /></RoleGuard>} />
              <Route path="/exam/list" element={<RoleGuard roles={["super_admin", "dept_admin"]}><ExamListPage /></RoleGuard>} />
              <Route path="/exam/:id" element={<RoleGuard roles={["super_admin", "dept_admin"]}><ExamViewPage /></RoleGuard>} />
              <Route path="/export" element={<ExportPage />} />
              <Route path="/analytics/nlq" element={<RoleGuard roles={["super_admin", "dept_admin"]}><NlqAnalyticsPage /></RoleGuard>} />
              <Route path="/scheduling" element={<RoleGuard roles={["super_admin", "dept_admin", "faculty"]}><SchedulingPage /></RoleGuard>} />
              <Route path="/settings" element={<RoleGuard roles={["super_admin"]}><SettingsPage /></RoleGuard>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
