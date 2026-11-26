import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FormProblemProps {
  problem: string | null;
}

export const FormProblem = ({ problem }: FormProblemProps) =>
  problem ? (
    <Alert variant="destructive" className="mb-3.5">
      <CircleAlert aria-hidden />
      <AlertDescription className="text-[13px] text-destructive">
        {problem}
      </AlertDescription>
    </Alert>
  ) : null;
