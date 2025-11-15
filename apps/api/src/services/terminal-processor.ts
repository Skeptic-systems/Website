import { ChatOpenAI } from "@langchain/openai";
import { encode } from "@toon-format/toon";
import { z } from "zod";
import { terminalModerationEnv } from "../config/env";
import { loadTerminalContext } from "../config/terminal-context";
import type { TerminalSession } from "./terminal-session";

type TerminalModerationInput = {
  message: string;
  session: TerminalSession;
};

const moderationSchema = z.object({
  allowed: z.boolean(),
  reason: z.string(),
  sanitized: z.string(),
  translations: z.object({
    en: z.string(),
    de: z.string(),
  }),
});

type TerminalModerationResult =
  | {
      allowed: true;
      reason: string;
      textDefault: string;
      textEn: string;
      textDe: string;
    }
  | {
      allowed: false;
      reason: string;
    };

const createModerationChain = () => {
  const model = new ChatOpenAI({
    apiKey: terminalModerationEnv.openAIApiKey,
    model: terminalModerationEnv.model,
    temperature: 0,
  });

  return model.withStructuredOutput(moderationSchema, {
    name: "TerminalModeration",
  });
};

const logDebug = (message: string, detail?: unknown): void => {
  if (!terminalModerationEnv.debugVerbose) {
    return;
  }

  if (typeof detail === "undefined") {
    console.debug(`[terminal-moderation] ${message}`);
    return;
  }

  console.debug(`[terminal-moderation] ${message}`, detail);
};

const createToonPayload = (input: TerminalModerationInput, context: string | null): string => {
  const payload: {
    session: {
      id: string;
      textCount: number;
      textLimit: number;
    };
    submission: {
      text: string;
    };
    context?: {
      instructions: string;
    };
  } = {
    session: {
      id: input.session.id,
      textCount: input.session.textCount,
      textLimit: input.session.textLimit,
    },
    submission: {
      text: input.message,
    },
  };

  const trimmedContext = context?.trim();

  if (trimmedContext && trimmedContext.length > 0) {
    payload.context = {
      instructions: trimmedContext,
    };
  }

  return encode(payload, { indent: 2 });
};

const systemInstructions = [
  "You are a strict moderation system for a public terminal on a personal website.",
  "Reject any submission containing harassment, hate speech, extremist propaganda, explicit sexual content, personal data, spam, malware instructions, or illegal activity.",
  "If the submission is acceptable, provide a sanitized version in the original language that preserves intent without disallowed content.",
  "Translate safe submissions to English and German, keeping tone neutral and professional.",
  "If the submission is unsafe, return empty strings for sanitized and translated fields.",
].join(" ");

const buildUserPrompt = (toonPayload: string): string =>
  [
    "Evaluate the following submission and decide if it can be displayed on the public terminal.",
    "Respond strictly according to the provided schema.",
    "Toon-formatted submission:",
    "```toon",
    toonPayload,
    "```",
  ].join("\n\n");

export const moderateTerminalMessage = async (
  input: TerminalModerationInput,
): Promise<TerminalModerationResult> => {
  try {
    const baseContext = await loadTerminalContext();
    logDebug("Loaded moderation context", { length: baseContext.length });
    const toonPayload = createToonPayload(input, baseContext);
    logDebug("Prepared Toon payload", { sessionId: input.session.id, payload: toonPayload });
    const chain = createModerationChain();
    logDebug("Invoking moderation chain", {
      sessionId: input.session.id,
      textCount: input.session.textCount,
      textLimit: input.session.textLimit,
    });

    const result = await chain.invoke([
      {
        role: "system",
        content: systemInstructions,
      },
      {
        role: "user",
        content: buildUserPrompt(toonPayload),
      },
    ]);

    logDebug("Received moderation result", { sessionId: input.session.id, result });

    const trimmedReason = result.reason.trim();
    const trimmedSanitized = result.sanitized.trim();
    const trimmedEn = result.translations.en.trim();
    const trimmedDe = result.translations.de.trim();

    if (!result.allowed) {
      return {
        allowed: false,
        reason: trimmedReason,
      };
    }

    if (trimmedSanitized.length === 0) {
      throw new Error("Moderation result missing sanitized text");
    }

    if (trimmedEn.length === 0 || trimmedDe.length === 0) {
      throw new Error("Moderation result missing translations");
    }

    return {
      allowed: true,
      reason: trimmedReason,
      textDefault: trimmedSanitized,
      textEn: trimmedEn,
      textDe: trimmedDe,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown moderation failure";
    logDebug("Moderation exception", { sessionId: input.session.id, error: message });
    throw new Error(`Terminal moderation failed: ${message}`);
  }
};

export type { TerminalModerationInput, TerminalModerationResult };

