import { useState } from "react";
import { Clock, Plus, Pencil, Trash2, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusChip, getSlotChipVariant } from "@/components/common/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTimeSlots } from "@/hooks/useTimeSlots";
import { useGlobalEvents } from "@/hooks/useGlobalEvents";
import type { TimeSlot, GlobalEventBlock } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const emptyForm = { label: "", start_time: "09:00", end_time: "10:00", slot_type: "lecture" as "lecture" | "lab" | "break", slot_order: 1 };
const emptyEventForm = { name: "", day: "Wednesday", slot_order: 1 };

export default function TimeSlotsPage() {
  const { data: slots, isLoading, createSlot, updateSlot, deleteSlot, reorderSlots, seedDefaults } = useTimeSlots();
  const { data: globalEvents, createEvent, deleteEvent } = useGlobalEvents();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [eventForm, setEventForm] = useState(emptyEventForm);

  const openCreate = () => {
    setEditingSlot(null);
    setForm({ ...emptyForm, slot_order: slots.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setForm({
      label: slot.label,
      start_time: slot.start_time,
      end_time: slot.end_time,
      slot_type: slot.slot_type,
      slot_order: slot.slot_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingSlot) {
        await updateSlot.mutateAsync({ slot_id: editingSlot.slot_id, ...form });
        toast({ title: "Slot updated" });
      } else {
        await createSlot.mutateAsync(form as any);
        toast({ title: "Slot created" });
      }
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.detail || "Failed to save", variant: "destructive" });
    }
  };

  const handleDelete = async (slot: TimeSlot) => {
    if (!confirm(`Delete "${slot.label}"?`)) return;
    try {
      await deleteSlot.mutateAsync(slot.slot_id);
      toast({ title: "Slot deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.detail || "Failed to delete", variant: "destructive" });
    }
  };

  const moveSlot = async (index: number, direction: "up" | "down") => {
    const ids = slots.map((s) => s.slot_id);
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= ids.length) return;
    [ids[index], ids[swap]] = [ids[swap], ids[index]];
    try {
      await reorderSlots.mutateAsync(ids);
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to reorder", variant: "destructive" });
    }
  };

  const handleSeedDefaults = async () => {
    try {
      await seedDefaults.mutateAsync();
      toast({ title: "Default slots created" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.detail || "Failed to seed", variant: "destructive" });
    }
  };

  const handleCreateEvent = async () => {
    try {
      await createEvent.mutateAsync(eventForm);
      toast({ title: "Global event created" });
      setEventDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to create event", description: e.response?.data?.detail || "Unknown error", variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (event: GlobalEventBlock) => {
    if (!confirm(`Delete global event "${event.name}"?`)) return;
    try {
      await deleteEvent.mutateAsync(event.event_id);
      toast({ title: "Event deleted" });
    } catch (e) {
      toast({ title: "Failed to delete event", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader 
        title="College-Wide Schedule Settings" 
        description="Configure your daily periods, breaks, and college-wide fixed events."
        icon={Clock}
      />

      <Tabs defaultValue="slots">
        <TabsList className="mb-4">
          <TabsTrigger value="slots">Time Slots</TabsTrigger>
          <TabsTrigger value="events">Global Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="slots" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Daily Time Slots</h2>
            <div className="flex gap-2">
              <Button onClick={() => seedDefaults.mutate()} variant="outline" size="sm" className="gap-2">
                <RotateCcw className="h-4 w-4" /> Reset to Defaults
              </Button>
              <Button onClick={openCreate} size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add Slot
              </Button>
            </div>
          </div>

      {/* Info banner */}
      <div className="chip-blue rounded-xl p-3 text-sm">
        Configure when lectures, labs, and breaks happen during the day. Only <strong>lecture</strong> and <strong>lab</strong> slots are used by the solver; <strong>break</strong> slots are display-only.
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : slots.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No time slots configured. Click <strong>Load Defaults</strong> to start with the standard schedule, or <strong>Add Slot</strong> to build your own.
        </div>
      ) : (
        <div className="space-y-2">
          {slots.map((slot, idx) => (
            <div key={slot.slot_id || idx} className="bg-card rounded-xl shadow-sm p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors">
              {/* Reorder arrows */}
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveSlot(idx, "up")} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => moveSlot(idx, "down")} disabled={idx === slots.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm font-medium">
                {slot.start_time} → {slot.end_time}
              </span>
              <StatusChip variant={getSlotChipVariant(slot.slot_type)} label={slot.slot_type.toUpperCase()} />
              <span className="text-sm text-muted-foreground flex-1">"{slot.label}"</span>
              <span className="text-xs font-mono text-muted-foreground">#{slot.slot_order}</span>

              {/* Actions */}
              <button onClick={() => openEdit(slot)} className="text-muted-foreground hover:text-foreground">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(slot)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      </TabsContent>

      <TabsContent value="events" className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Global Events (College-Wide)</h2>
            <p className="text-sm text-muted-foreground">These events will block all classes across all branches at this specific time.</p>
          </div>
          <Button onClick={() => { setEventForm(emptyEventForm); setEventDialogOpen(true); }} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        </div>
        
        {globalEvents.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground">
            No global events configured. Add one to block a slot across the entire college.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {globalEvents.map(event => (
              <div key={event.event_id} className="p-4 border rounded-xl flex items-center justify-between bg-card hover:border-primary/50 transition-colors">
                <div>
                  <div className="font-semibold">{event.name}</div>
                  <div className="text-sm text-muted-foreground">{event.day}, Period {event.slot_order}</div>
                </div>
                <button onClick={() => handleDeleteEvent(event)} className="text-muted-foreground hover:text-destructive p-2">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
      </Tabs>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Edit Time Slot" : "Add Time Slot"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Label</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Period 1, Lab, Lunch" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Time</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>End Time</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={form.slot_type} onValueChange={(v: string) => setForm({ ...form, slot_type: v as "lecture" | "lab" | "break" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecture">Lecture</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Order</Label>
              <Input type="number" min={1} max={20} value={form.slot_order} onChange={(e) => setForm({ ...form, slot_order: parseInt(e.target.value) || 1 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.label || !form.start_time || !form.end_time}>
              {editingSlot ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Global Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Event Name</Label>
              <Input value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} placeholder="e.g. Placement Training, Chapel" />
            </div>
            <div className="grid gap-2">
              <Label>Day</Label>
              <Select value={eventForm.day} onValueChange={(v) => setEventForm({ ...eventForm, day: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Period (Slot Order)</Label>
              <Input type="number" min={1} max={20} value={eventForm.slot_order} onChange={(e) => setEventForm({ ...eventForm, slot_order: parseInt(e.target.value) || 1 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateEvent} disabled={!eventForm.name}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
