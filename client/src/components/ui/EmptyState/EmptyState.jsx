import Button from '../Button/Button';
import './EmptyState.css';

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      {icon && (
        <div className="empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__text">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" className="empty-state__action" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
