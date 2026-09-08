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