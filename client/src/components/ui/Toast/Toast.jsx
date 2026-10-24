import { useSelector, useDispatch } from 'react-redux';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { removeToast } from '../../../store/slices/uiSlice';
import { useEffect } from 'react';

const icons = {
  success: <CheckCircle size={18} color="var(--color-success)" />,
  error: <XCircle size={18} color="var(--color-danger)" />,
  warning: <AlertTriangle size={18} color="var(--color-warning)" />,
  info: <Info size={18} color="var(--color-info)" />,
};

function ToastItem({ toast }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(toast.id)), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  return (
    <div className={`toast toast--${toast.type}`} role="status">
      {icons[toast.type]}
      <span className="toast__message">{toast.message}</span>
      <button type="button" className="toast__close" aria-label="Dismiss notification" onClick={() => dispatch(removeToast(toast.id))}>
        <X size={16} />
      </button>
    </div>
  );
}

export default function Toast() {
  const { toasts } = useSelector((state) => state.ui);
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
