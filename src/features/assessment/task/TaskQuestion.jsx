import classNames from "classnames/bind";
import { Button } from "@/shared/ui/components/button";
import { useTaskAnswer } from "./hooks/useTaskAnswer";
import styles from "./Task.module.scss";

const cx = classNames.bind(styles);

export default function TaskQuestion({ runtime, question }) {
  const mutation = useTaskAnswer(runtime, question);
  const editable = runtime.status === "IN_PROGRESS";
  const multiple = question.type === "MULTIPLE_CHOICE";

  function select(answerId) {
    const ids = multiple
      ? question.selectedAnswerIds.includes(answerId)
        ? question.selectedAnswerIds.filter((id) => id !== answerId)
        : [...question.selectedAnswerIds, answerId]
      : [answerId];
    mutation.save(ids);
  }

  return (
    <fieldset className={cx("question")}
      disabled={!editable || mutation.isPending || mutation.isSubmitting}
      aria-busy={mutation.isPending || mutation.isSubmitting}>
      <legend className={cx("legend")}>Question {question.order}</legend>
      <p className={cx("content")}>{question.content}</p>
      <div className={cx("options")}>
        {question.options.map((option) => (
          <label key={option.answerId} className={cx("option")}>
            <input
              type={multiple ? "checkbox" : "radio"}
              name={question.questionId}
              checked={question.selectedAnswerIds.includes(option.answerId)}
              onChange={() => select(option.answerId)}
            />
            <span>{option.content}</span>
          </label>
        ))}
      </div>
      {editable && question.selectedAnswerIds.length > 0 && (
        <Button onClick={() => mutation.save([])} disabled={mutation.isPending || mutation.isSubmitting}>Clear answer</Button>
      )}
      {mutation.error && <p role="alert">{mutation.error.message}</p>}
    </fieldset>
  );
}
