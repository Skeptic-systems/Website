import { StarField } from "@/components/ui/star-field";

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StarField />
      {children}
    </>
  );
}
