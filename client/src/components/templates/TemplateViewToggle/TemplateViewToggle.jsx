import { LayoutGrid, List } from 'lucide-react';
import './TemplateViewToggle.css';

const VIEW_OPTIONS = [
  { value: 'grid', label: 'Grid view', Icon: LayoutGrid },
  { value: 'list', label: 'List view', Icon: List },
];

export default function TemplateViewToggle({ view = 'grid', onChange }) {
  return (
    <div className="template-view-toggle" role="group" aria-label="Template layout">
      {VIEW_OPTIONS.map(({ value, label, Icon }) => {
        const isActive = view === value;

        return (
          <button
            key={value}
            type="button"
            className={`template-view-toggle__button ${isActive ? 'template-view-toggle__button--active' : ''}`}
            aria-label={label}
            aria-pressed={isActive}
            title={label}
            onClick={() => onChange?.(value)}
          >
            <Icon size={16} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
