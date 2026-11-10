import { formatDate } from '../../../utils/formatDate';

export default function WorkspaceFacts({ business }) {
  if (!business) return null;

  const shortId = business.id
    ? `${business.id.slice(0, 8)}…${business.id.slice(-4)}`
    : '—';

  const roleLabel = business.role
    ? business.role.charAt(0).toUpperCase() + business.role.slice(1)
    : 'Owner';

  const createdDate = business.created_at ? formatDate(business.created_at) : '—';

  return (
    <div className="acard">
      <h2 className="acard__title">Workspace</h2>
      <div className="facts">
        <div className="fact">
          <span>Created</span>
          <span>{createdDate}</span>
        </div>
        <div className="fact">
          <span>Your role</span>
          <span>{roleLabel}</span>
        </div>
        <div className="fact">
          <span>Business ID</span>
          <span className="mono">{shortId}</span>
        </div>
      </div>
    </div>
  );
}
