import { Sparkles } from 'lucide-react';

/* Honest placeholder for sections whose backend does not exist yet. */
export default function ComingSoonPage({
  title,
  description = 'This section is being built and will appear here soon.',
  icon: Icon = Sparkles,
}) {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">{title}</h1>
        </div>
      </div>
      <div className="card">
        <div className="empty-state">
          <div className="empty-state__icon">
            <Icon size={22} aria-hidden="true" />
          </div>
          <h2 className="empty-state__title">{title} is coming soon</h2>
          <p className="empty-state__text">{description}</p>
        </div>
      </div>
    </div>
  );
}
