import { Button } from './Button';

type ConfirmBoxProps = { message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void };

export function ConfirmBox({ message, confirmLabel, onConfirm, onCancel }: ConfirmBoxProps) {
  return (
    <div className="confirm" role="alertdialog" aria-label={message}>
      <p>{message}</p>
      <div className="row-actions">
        <Button variant="primary" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
