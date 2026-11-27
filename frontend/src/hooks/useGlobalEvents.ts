import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { GlobalEventBlock } from "@/types";

export function useGlobalEvents() {
  const queryClient = useQueryClient();
  const queryKey = ["global-events"];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await apiClient.get<GlobalEventBlock[]>("/global-events");
      return data;
    },
  });

  const createEvent = useMutation({
    mutationFn: async (payload: Omit<GlobalEventBlock, "event_id" | "college_id" | "created_at">) => {
      const { data } = await apiClient.post<GlobalEventBlock>("/global-events", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateEvent = useMutation({
    mutationFn: async ({ event_id, ...payload }: Partial<GlobalEventBlock> & { event_id: string }) => {
      const { data } = await apiClient.put<GlobalEventBlock>(`/global-events/${event_id}`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (event_id: string) => {
      await apiClient.delete(`/global-events/${event_id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    ...query,
    data: query.data || [],
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
