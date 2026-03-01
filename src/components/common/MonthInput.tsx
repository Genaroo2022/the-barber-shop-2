import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MonthInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function MonthInput({ value, onChange, className }: MonthInputProps) {
  return (
    <Input
      type="month"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("w-full min-w-[12rem] sm:w-48 bg-background", className)}
    />
  );
}

