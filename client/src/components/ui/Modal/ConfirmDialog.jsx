import Modal from './Modal';
import Button from '../Button/Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading = false }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Confirm Action'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="confirm-dialog">
        <div className="confirm-dialog__icon">
          <AlertTriangle size={20} color="var(--color-danger)" />
        </div>
        <p className="confirm-dialog__message">
          {message || 'Are you sure? This action cannot be undone.'}
        </p>
      </div>
    </Modal>
  );
}
