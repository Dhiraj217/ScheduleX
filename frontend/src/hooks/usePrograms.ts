import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface Program {
  program_id: string;
  dept_id: string;
  code: string;
  name: string;
  level: string;
  duration_years: number;
  intake: number;
  active: boolean;
}

export function usePrograms(deptId?: string) {
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ["programs", deptId],
    queryFn: async () => {
      if (!deptId) return [];
      return api.get<Program[]>(`/programs/departments/${deptId}/programs`);
    },
    enabled: !!deptId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Program>) =>
      api.post(`/programs/departments/${deptId}/programs`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs", deptId] });
    },
  });

  return {
    programs,
    isLoading,
    createProgram: createMutation.mutateAsync,
  };
}
