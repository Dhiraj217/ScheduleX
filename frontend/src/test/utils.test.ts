import { describe, it, expect } from "vitest";
import { getStatusChipVariant, getSlotChipVariant } from "@/components/common/StatusChip";
import { API_BASE_URL } from "@/lib/api-client";

describe("StatusChip helpers", () => {
  it("maps timetable and exam statuses to chip variants", () => {
    expect(getStatusChipVariant("published")).toBe("published");
    expect(getStatusChipVariant("PUBLISHED")).toBe("published");
    expect(getStatusChipVariant("draft")).toBe("draft");
    expect(getStatusChipVariant("deleted")).toBe("conflict");
  });

  it("maps slot types to chip variants", () => {
    expect(getSlotChipVariant("lecture")).toBe("lecture");
    expect(getSlotChipVariant("lab")).toBe("lab");
    expect(getSlotChipVariant("break")).toBe("conflict");
  });
});

describe("api-client config", () => {
  it("exports API_BASE_URL", () => {
    expect(API_BASE_URL).toBeTruthy();
  });
});
