export type CronField = "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";

export type CronExpression = {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
};

export type CronPreset =
  | "everyMinute"
  | "everyNMinutes"
  | "everyHour"
  | "everyNHours"
  | "dailyAt"
  | "weeklyOn"
  | "monthlyOn"
  | "custom";

export type CronBuilderState = {
  preset: CronPreset;
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
  intervalMinutes: string;
  intervalHours: string;
};

export const DEFAULT_BUILDER_STATE: CronBuilderState = {
  preset: "everyMinute",
  minute: "0",
  hour: "0",
  dayOfMonth: "1",
  month: "*",
  dayOfWeek: "1",
  intervalMinutes: "5",
  intervalHours: "2",
};

export const FIELD_ORDER: readonly CronField[] = [
  "minute",
  "hour",
  "dayOfMonth",
  "month",
  "dayOfWeek",
];

export type FieldRange = {
  min: number;
  max: number;
  label: string;
};

export const FIELD_RANGES: Record<CronField, FieldRange> = {
  minute: { min: 0, max: 59, label: "Minute" },
  hour: { min: 0, max: 23, label: "Hour" },
  dayOfMonth: { min: 1, max: 31, label: "Day (month)" },
  month: { min: 1, max: 12, label: "Month" },
  dayOfWeek: { min: 0, max: 7, label: "Day (week)" },
};

export const WEEKDAYS: readonly { value: string; labelKey: string }[] = [
  { value: "0", labelKey: "sun" },
  { value: "1", labelKey: "mon" },
  { value: "2", labelKey: "tue" },
  { value: "3", labelKey: "wed" },
  { value: "4", labelKey: "thu" },
  { value: "5", labelKey: "fri" },
  { value: "6", labelKey: "sat" },
];

export function buildExpression(state: CronBuilderState): string {
  switch (state.preset) {
    case "everyMinute":
      return "* * * * *";
    case "everyNMinutes": {
      const n = parseInt(state.intervalMinutes, 10) || 5;
      return `*/${n} * * * *`;
    }
    case "everyHour":
      return `${state.minute || "0"} * * * *`;
    case "everyNHours": {
      const n = parseInt(state.intervalHours, 10) || 2;
      return `${state.minute || "0"} */${n} * * *`;
    }
    case "dailyAt":
      return `${state.minute || "0"} ${state.hour || "0"} * * *`;
    case "weeklyOn":
      return `${state.minute || "0"} ${state.hour || "0"} * * ${state.dayOfWeek || "1"}`;
    case "monthlyOn":
      return `${state.minute || "0"} ${state.hour || "0"} ${state.dayOfMonth || "1"} * *`;
    case "custom":
      return `${state.minute || "*"} ${state.hour || "*"} ${state.dayOfMonth || "*"} ${state.month || "*"} ${state.dayOfWeek || "*"}`;
    default:
      return "* * * * *";
  }
}

export function parseCronExpression(expr: string): CronExpression | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return null;
  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
  };
}

export type CronValidation = {
  valid: boolean;
  errors: string[];
};

function validateField(value: string, field: CronField): string | null {
  if (value === "*") return null;

  const range = FIELD_RANGES[field];

  if (/^\*\/\d+$/.test(value)) {
    const step = parseInt(value.split("/")[1], 10);
    if (step < 1 || step > range.max) {
      return `Step value ${step} is out of range for ${field} (1-${range.max}).`;
    }
    return null;
  }

  const segments = value.split(",");
  for (const seg of segments) {
    if (seg.includes("-")) {
      const [startStr, endStr] = seg.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        start < range.min ||
        end > range.max ||
        start > end
      ) {
        return `Range "${seg}" is invalid for ${field} (${range.min}-${range.max}).`;
      }
    } else if (seg.includes("/")) {
      const [base, stepStr] = seg.split("/");
      const step = parseInt(stepStr, 10);
      if (Number.isNaN(step) || step < 1) {
        return `Step "/${stepStr}" is invalid for ${field}.`;
      }
      if (base !== "*") {
        const baseNum = parseInt(base, 10);
        if (Number.isNaN(baseNum) || baseNum < range.min || baseNum > range.max) {
          return `Base "${base}" in step expression is out of range for ${field}.`;
        }
      }
    } else {
      const num = parseInt(seg, 10);
      if (Number.isNaN(num) || num < range.min || num > range.max) {
        return `Value "${seg}" is out of range for ${field} (${range.min}-${range.max}).`;
      }
    }
  }

  return null;
}

export function validateCron(expr: string): CronValidation {
  const parsed = parseCronExpression(expr);
  if (!parsed)
    return { valid: false, errors: ["Expression must have exactly 5 space-separated fields."] };

  const errors: string[] = [];
  const fields: [CronField, string][] = [
    ["minute", parsed.minute],
    ["hour", parsed.hour],
    ["dayOfMonth", parsed.dayOfMonth],
    ["month", parsed.month],
    ["dayOfWeek", parsed.dayOfWeek],
  ];

  for (const [field, value] of fields) {
    const err = validateField(value, field);
    if (err) errors.push(err);
  }

  return { valid: errors.length === 0, errors };
}

export function describeCron(expr: string): string {
  const parsed = parseCronExpression(expr);
  if (!parsed) return "Invalid expression";

  const { minute, hour, dayOfMonth, month, dayOfWeek } = parsed;

  if (minute === "*" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return "Every minute";
  }

  const parts: string[] = [];

  if (minute.startsWith("*/")) {
    parts.push(`Every ${minute.slice(2)} minutes`);
  } else if (hour.startsWith("*/")) {
    parts.push(`Every ${hour.slice(2)} hours at minute ${minute}`);
  } else if (hour === "*" && minute !== "*") {
    parts.push(`Every hour at minute ${minute}`);
  } else if (hour !== "*" && minute !== "*") {
    parts.push(`At ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);
  }

  if (dayOfWeek !== "*" && dayOfMonth === "*") {
    const days = dayOfWeek
      .split(",")
      .map((d) => weekdayName(d))
      .join(", ");
    parts.push(`on ${days}`);
  }

  if (dayOfMonth !== "*") {
    parts.push(`on day ${dayOfMonth} of the month`);
  }

  if (month !== "*") {
    parts.push(`in month ${month}`);
  }

  return parts.length > 0 ? parts.join(" ") : formatRaw(parsed);
}

function weekdayName(value: string): string {
  const map: Record<string, string> = {
    "0": "Sunday",
    "1": "Monday",
    "2": "Tuesday",
    "3": "Wednesday",
    "4": "Thursday",
    "5": "Friday",
    "6": "Saturday",
    "7": "Sunday",
  };
  return map[value] ?? value;
}

function formatRaw(parsed: CronExpression): string {
  return `min=${parsed.minute} hour=${parsed.hour} dom=${parsed.dayOfMonth} month=${parsed.month} dow=${parsed.dayOfWeek}`;
}

export type CheatsheetEntry = {
  expression: string;
  descriptionKey: string;
};

export const CHEATSHEET_EXAMPLES: readonly CheatsheetEntry[] = [
  { expression: "* * * * *", descriptionKey: "everyMinute" },
  { expression: "*/5 * * * *", descriptionKey: "every5Min" },
  { expression: "0 * * * *", descriptionKey: "everyHour" },
  { expression: "0 */2 * * *", descriptionKey: "every2Hours" },
  { expression: "0 0 * * *", descriptionKey: "midnight" },
  { expression: "0 9 * * 1-5", descriptionKey: "weekdays9am" },
  { expression: "0 0 1 * *", descriptionKey: "monthlyFirst" },
  { expression: "0 0 * * 0", descriptionKey: "weeklySunday" },
  { expression: "30 4 1,15 * *", descriptionKey: "bimonthly" },
  { expression: "0 0 1 1 *", descriptionKey: "yearly" },
];

export type SpecialToken = {
  token: string;
  meaningKey: string;
};

export const SPECIAL_TOKENS: readonly SpecialToken[] = [
  { token: "*", meaningKey: "asterisk" },
  { token: ",", meaningKey: "comma" },
  { token: "-", meaningKey: "dash" },
  { token: "/", meaningKey: "slash" },
];
