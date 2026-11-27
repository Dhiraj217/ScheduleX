import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, api } from "@/lib/api-client";
import { toast } from "sonner";

interface ImportCategory {
  key: string;
  label: string;
  columns: string;
}

export interface ImportResult {
  category: string;
  inserted: number;
  updated?: number;
  unchanged?: number;
  skipped: number;
  total: number;
  warnings?: string[];
}

interface ExcelImportResponse {
  results: ImportResult[];
  sheets_processed: number;
}

export function usePdfImport() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ImportCategory[]>({
    queryKey: ["pdf-import-categories"],
    queryFn: () => api.get("/pdf-import/categories"),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["departments"] });
    queryClient.invalidateQueries({ queryKey: ["programs"] });
    queryClient.invalidateQueries({ queryKey: ["faculty"] });
    queryClient.invalidateQueries({ queryKey: ["subjects"] });
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    queryClient.invalidateQueries({ queryKey: ["timeslots"] });
    queryClient.invalidateQueries({ queryKey: ["batches"] });
    queryClient.invalidateQueries({ queryKey: ["global-events"] });
    queryClient.invalidateQueries({ queryKey: ["college-holidays"] });
    queryClient.invalidateQueries({ queryKey: ["exam-enrolments"] });
  };

  const uploadExcelMutation = useMutation<ExcelImportResponse, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post("/pdf-import/upload-excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (data) => {
      const inserted = data.results.reduce((s, r) => s + r.inserted, 0);
      const updated = data.results.reduce((s, r) => s + (r.updated ?? 0), 0);
      toast.success(
        `Sync complete across ${data.sheets_processed} sheet(s): ${inserted} inserted, ${updated} updated`
      );
      invalidateAll();
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail || "Upload failed";
      toast.error(detail);
    },
  });

  return {
    categories,
    categoriesLoading,
    uploadExcel: uploadExcelMutation.mutateAsync,
    isUploadingExcel: uploadExcelMutation.isPending,
  };
}
