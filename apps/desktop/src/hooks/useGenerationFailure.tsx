import { useState } from "react";
import FeedbackDialog from "../components/FeedbackDialog";
import type { IssueReportInput } from "../services/beta";

export interface FailureContext extends IssueReportInput {
  errorMessage: string;
}

export function useGenerationFailure() {
  const [failure, setFailure] = useState<FailureContext | null>(null);

  function showFailure(context: FailureContext) {
    setFailure(context);
  }

  function clearFailure() {
    setFailure(null);
  }

  const dialog = failure ? (
    <FeedbackDialog context={failure} onClose={clearFailure} />
  ) : null;

  return { showFailure, clearFailure, failureDialog: dialog };
}
