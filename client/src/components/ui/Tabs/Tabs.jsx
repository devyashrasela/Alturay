export default function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={`tabs__item ${activeTab === tab.value ? 'tabs__item--active' : ''}`}
          aria-pressed={activeTab === tab.value}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span style={{ marginLeft: 6, fontSize: 12, color: activeTab === tab.value ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
              ({tab.count})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
