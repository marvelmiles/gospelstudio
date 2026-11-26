import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supportEmail } from "../../../lib/supportEmail";
import type { UserProblem } from "../../../lib/userProblem";

interface FormProblemProps {
  problem: UserProblem | null;
}

const SupportContact = () => {
  const email = supportEmail();
  if (!email) return null;
  return (
    <p className="m-0">
      If this keeps happening, email us at{" "}
      <a
        href={`mailto:${email}`}
        className="font-semibold wrap-anywhere underline underline-offset-2"
      >
        {email}
      </a>
      .
    </p>
  );
};

export const FormProblem = ({ problem }: FormProblemProps) =>
  problem ? (
    <Alert variant="destructive" className="mb-3.5">
      <CircleAlert aria-hidden />
      <AlertDescription className="text-[13px] text-destructive">
        <p className="m-0">{problem.message}</p>
        {problem.suggestSupport && <SupportContact />}
      </AlertDescription>
    </Alert>
  ) : null;
