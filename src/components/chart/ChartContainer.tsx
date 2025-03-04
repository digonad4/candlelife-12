
import { CardContent } from "@/components/ui/card";

interface ChartContainerProps {
  children: React.ReactNode;
}

export function ChartContainer({ children }: ChartContainerProps) {
  return (
    <CardContent className="h-[400px] flex flex-col">
      <div className="flex-1 h-full">
        {children}
      </div>
    </CardContent>
  );
}
