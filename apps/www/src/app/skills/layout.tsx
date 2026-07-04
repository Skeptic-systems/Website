import { StarField } from "@/components/ui/star-field";

export default function SkillsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StarField />
      {children}
    </>
  );
}
