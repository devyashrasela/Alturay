import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, size = '', children, footer }) {
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog; restore it to the opener on close.
    const previousFocus = document.activeElement;
    const frame = requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        ref={dialogRef}
        className={`modal ${size === 'lg' ? 'modal--lg' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal__header">
          <h2 className="modal__title" id={titleId}>{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close modal">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
