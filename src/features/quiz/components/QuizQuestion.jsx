/**
 * FILE: src/features/quiz/components/QuizQuestion.jsx
 * PURPOSE: Renders one question at a time with radio-style answer options.
 *
 * PROPS:
 *    question: { id, questionText, options: Array<{id, optionText}> }
 *    selectedOptionId: string | null
 *    onSelect: (optionId: string) => void
 *
 * STRUCTURE:
 *    <h3>{questionText}</h3>
 *    {options.map(opt => <label key={opt.id}>
 *      <input type="radio" name={question.id} checked={selectedOptionId===opt.id}
 *        onChange={() => onSelect(opt.id)} /> {opt.optionText}
 *    </label>)}
 *    (styled as clickable option "cards" rather than raw native radios, per
 *    DESIGN.md's minimal aesthetic — hairline border, apple-blue border+bg-tint
 *    when selected, per the single-accent-color selected-state convention)
 *
 * TESTING NOTES: renders question text and all options, clicking an option
 * calls onSelect with correct id, selected option shows selected styling,
 * only one option can be selected at a time (native radio behavior via shared
 * `name` attribute).
 */
import clsx from "clsx";

export function QuizQuestion({ question, selectedOptionId, onSelect }) {
  if (!question) return null;

  const questionText = question.questionText ?? question.question_text;
  const options = Array.isArray(question.options) ? question.options : [];

  return (
    <fieldset>
      <legend className="mb-4 text-heading-sm font-semibold text-carbon">
        {questionText}
      </legend>
      <div className="space-y-2">
        {options.map((option) => {
          const id = option.id;
          const optionText = option.optionText ?? option.option_text;
          const isSelected = selectedOptionId === id;
          return (
            <label
              key={id}
              className={clsx(
                "flex cursor-pointer items-center gap-3 rounded-card border p-card-padding transition-colors focus-within:ring-2 focus-within:ring-link-blue focus-within:ring-offset-2",
                isSelected
                  ? "border-apple-blue bg-apple-blue/5 text-carbon"
                  : "border-mist/40 bg-white text-ash hover:bg-frost"
              )}
            >
              <input
                type="radio"
                name={question.id}
                value={id}
                checked={isSelected}
                onChange={() => onSelect(id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={clsx(
                  "h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
                  isSelected ? "border-apple-blue bg-apple-blue" : "border-mist bg-transparent"
                )}
              />
              <span className="text-body">{optionText}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}