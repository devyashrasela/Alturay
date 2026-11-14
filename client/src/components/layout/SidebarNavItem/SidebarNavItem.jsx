import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';

export default function SidebarNavItem({ item, collapsed }) {
  const Icon = item.icon;
  const tooltipId = useId();
  const linkRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  // Never leave a floating tooltip behind when the sidebar expands.
  const [lastCollapsed, setLastCollapsed] = useState(collapsed);
  if (collapsed !== lastCollapsed) {
    setLastCollapsed(collapsed);
    setTooltip(null);
  }

  useEffect(() => {
    if (!tooltip) return undefined;
    const hide = () => setTooltip(null);
    document.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      document.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [tooltip]);

  const showTooltip = () => {
    if (!collapsed) return;
    const rect = linkRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      top: rect.top + rect.height / 2,
      left: rect.right + 8,
    });
  };

  const hideTooltip = () => setTooltip(null);

  return (
    <>
      <NavLink
        ref={linkRef}
        to={item.path}
        className={({ isActive }) => `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
        aria-label={collapsed ? item.label : undefined}
        aria-describedby={tooltip ? tooltipId : undefined}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onClick={hideTooltip}
      >
        <Icon size={20} className="sidebar__item-icon" aria-hidden="true" />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>

      {tooltip && collapsed && createPortal(
        <div
          className="sidebar-tooltip"
          role="tooltip"
          id={tooltipId}
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          {item.label}
        </div>,
        document.body,
      )}
    </>
  );
}
