import { describe, it, expect, afterEach } from "vitest";
import i18n from "@/i18n";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  getPlatformCurrency,
} from "./formatters";

const sampleDate = new Date(2026, 2, 9); // Monday, March 9 2026

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("formatDate", () => {
  it("renders English month/day names in English", async () => {
    await i18n.changeLanguage("en");
    expect(formatDate(sampleDate, "EEEE")).toBe("Monday");
    expect(formatDate(sampleDate, "MMMM yyyy")).toBe("March 2026");
  });

  it("renders Arabic month/day names in Arabic", async () => {
    await i18n.changeLanguage("ar");
    expect(formatDate(sampleDate, "EEEE")).toBe("الاثنين");
    expect(formatDate(sampleDate, "MMMM yyyy")).toContain("مارس");
  });

  it("accepts ISO strings", () => {
    expect(formatDate("2026-03-09", "yyyy")).toBe("2026");
  });
});

describe("formatNumber", () => {
  it("uses Western digits in Arabic (nu-latn policy)", async () => {
    await i18n.changeLanguage("ar");
    const result = formatNumber(1234);
    expect(result).toContain("1");
    expect(result).not.toContain("١");
  });
});

describe("formatCurrency", () => {
  it("defaults to the platform currency", async () => {
    await i18n.changeLanguage("en");
    // The platform currency is SAR (VITE_PLATFORM_CURRENCY in .env); all
    // payments run through Moyasar in SAR.
    expect(getPlatformCurrency()).toBe("SAR");
    expect(formatCurrency(1500)).toMatch(/SAR|ر\.س/);
    expect(formatCurrency(1500)).toContain("1,500");
  });

  it("formats SAR and AED when configured per call", async () => {
    await i18n.changeLanguage("en");
    expect(formatCurrency(1500, { currency: "SAR" })).toMatch(/SAR|ر\.س/);
    expect(formatCurrency(1500, { currency: "AED" })).toMatch(/AED|د\.إ/);
  });

  it("keeps Western digits in Arabic currency output", async () => {
    await i18n.changeLanguage("ar");
    const result = formatCurrency(49, { currency: "SAR" });
    expect(result).toContain("49");
    expect(result).not.toContain("٤");
  });
});

describe("formatPercent", () => {
  it("renders 0-100 input as a percentage", () => {
    expect(formatPercent(12)).toBe("12%");
  });
});
