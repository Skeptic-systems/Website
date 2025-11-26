import { getAccentColor, hexToRgba, type GitHubRepositoryLanguage } from "@/lib/github";

type LanguageBadgeProps = {
  language: GitHubRepositoryLanguage;
};

export function LanguageBadge({ language }: LanguageBadgeProps) {
  const primaryColor = getAccentColor(language);

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-700 transition dark:text-neutral-200"
      style={{
        borderColor: hexToRgba(primaryColor, 0.45),
        backgroundColor: hexToRgba(primaryColor, 0.12),
        color: primaryColor,
      }}
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{
          backgroundColor: primaryColor,
        }}
      />
      {language.name}
    </span>
  );
}


