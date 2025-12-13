import type { FeedbackState } from "@/components/login/dashboard-types";

type DashboardFeedbackProps = {
  feedback: FeedbackState;
};

export function DashboardFeedback({ feedback }: DashboardFeedbackProps) {
  if (!feedback) {
    return null;
  }

  return (
    <p
      className={`text-sm font-semibold ${
        feedback.tone === "error"
          ? "text-red-600 dark:text-red-400"
          : "text-emerald-600 dark:text-emerald-400"
      }`}
    >
      {feedback.text}
    </p>
  );
}

