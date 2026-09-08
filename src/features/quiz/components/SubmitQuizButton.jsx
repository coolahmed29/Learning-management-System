/**
 * FILE: src/features/quiz/components/SubmitQuizButton.jsx
 * PURPOSE: Final submit action — includes a confirmation step since
 *          submission is a one-way action (per page-wise table's "Confirm
 *          dialog before submit" note).
 *
 * PROPS:
 *    allAnswered: boolean
 *    onSubmit: () => void
 *    isSubmitting: boolean
 *
 * STEPS:
 *    1. Button disabled if !allAnswered, with a tooltip/inline note like
 *       "Answer all questions to submit"
 *    2. Clicking (when enabled) opens a <Modal> (reuse Phase 0 primitive)
 *       asking "Submit your quiz? You won't be able to change your answers."
 *       with Confirm/Cancel actions
 *    3. Confirm -> calls onSubmit(), closes modal, button shows isSubmitting state
 *
 * TESTING NOTES: disabled when !allAnswered, clicking opens confirmation
 * modal, confirming calls onSubmit, canceling does NOT call onSubmit and
 * closes modal, isSubmitting shows loading state.
 */
import { useState } from "react";
import { Button } from "../../../components/ui/Button/Button";
import { Modal } from "../../../components/ui/Modal/Modal";

export function SubmitQuizButton({ allAnswered, onSubmit, isSubmitting }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={() => setIsConfirmOpen(true)}
        isLoading={isSubmitting}
        disabled={!allAnswered}
      >
        Submit Quiz
      </Button>

      {!allAnswered && (
        <p className="text-caption text-ash">Answer all questions to submit</p>
      )}

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Submit your quiz?"
        size="sm"
      >
        <p className="text-body text-carbon">
          You won't be able to change your answers.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outlined"
            onClick={() => setIsConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setIsConfirmOpen(false);
              onSubmit();
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}