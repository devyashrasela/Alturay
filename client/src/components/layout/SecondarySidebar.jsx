import { Fragment, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { isItemActive } from './navConfig';

export default function SecondarySidebar({
  section,
  collapsed,
  onToggleCollapse,
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const sidebar = section?.sidebar;

  // Tooltip state
  const [tipState, setTipState] = useState({
    visible: false,
    text: '',
    kbd: '',
    soon: false,
    left: 0,
    top: 0,
  });

  // Cached sidebar for unmount transition
  const [cachedSidebar, setCachedSidebar] = useState(sidebar);
  const [mounted, setMounted] = useState(Boolean(sidebar));
  const [isOut, setIsOut] = useState(false);
  const unmountTimerRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    clearTimeout(unmountTimerRef.current);

    if (sidebar) {
      setCachedSidebar(sidebar);
      setMounted(true);
      setIsOut(false);
    } else {
      setIsOut(true);
      unmountTimerRef.current = setTimeout(
        () => {
          setMounted(false);
        },
        prefersReducedMotion ? 0 : 240
      );
    }

    return () => clearTimeout(unmountTimerRef.current);
  }, [sidebar]);

  const showTip = (target) => {
    if (!target) return;
    const t = target.getAttribute('data-tip');
    if (!t) return;
    const k = target.getAttribute('data-kbd') || '';
    const soon = target.hasAttribute('data-soon');
    const r = target.getBoundingClientRect();
    setTipState({
      visible: true,
      text: t,
      kbd: k,
      soon,
      left: r.right + 10,
      top: r.top + r.height / 2,
    });
  };

  const hideTip = () => {
    setTipState((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  };

  const handlePointerOver = (e) => {
    const target = e.target.closest('[data-tip]');
    if (target) showTip(target);
    else hideTip();
  };

  const handleFocusIn = (e) => {
    const target = e.target.closest('[data-tip]');
    if (target) showTip(target);
  };

  const handleNavigate = (path) => {
    hideTip();
    navigate(path);
  };

  const activeSidebar = sidebar || cachedSidebar;
  if (!mounted || !activeSidebar) return null;

  const pillActive = activeSidebar.pill && isItemActive(activeSidebar.pill, pathname);

  return (
    <>
      <aside
        id="sb"
        className={`sb ${collapsed ? 'sb--rail' : ''} ${isOut ? 'sb--out' : ''}`.trim()}
        aria-label={`${activeSidebar.title} navigation`}
        inert={isOut ? '' : undefined}
        onMouseOver={handlePointerOver}
        onMouseLeave={hideTip}
        onFocusCapture={handleFocusIn}
        onBlurCapture={hideTip}
        onScrollCapture={hideTip}
      >
        {collapsed ? (
          <>
            <button
              type="button"
              className="rl rl-toggle"
              id="sbOpen"
              data-tip="Expand sidebar"
              aria-label="Expand sidebar"
              onClick={onToggleCollapse}
            >
              <span className="rl__sec">
                <Icon name={activeSidebar.icon} size={18} />
              </span>
              <span className="rl__exp">
                <Icon name="dchev" size={18} />
              </span>
            </button>

            {activeSidebar.pill && (
              <button
                type="button"
                className={`rl ${activeSidebar.pill.soon ? 'is-soon' : ''}`}
                data-tip={activeSidebar.pill.label}
                aria-label={activeSidebar.pill.label}
                aria-current={pillActive ? 'page' : undefined}
                data-soon={activeSidebar.pill.soon ? '1' : undefined}
                aria-disabled={activeSidebar.pill.soon ? 'true' : undefined}
                onClick={() => !activeSidebar.pill.soon && handleNavigate(activeSidebar.pill.path)}
              >
                <Icon name={activeSidebar.pill.icon} size={18} />
              </button>
            )}

            <div className="sb__scroll">
              {activeSidebar.groups.map((group) => (
                <Fragment key={group.label}>
                  <div className="rl-sep" role="separator" />
                  {group.items.map((item) => {
                    const active = isItemActive(item, pathname);
                    return (
                      <button
                        key={item.id || item.label}
                        type="button"
                        className={`rl ${item.soon ? 'is-soon' : ''}`}
                        data-tip={item.label}
                        aria-label={item.label}
                        data-soon={item.soon ? '1' : undefined}
                        aria-disabled={item.soon ? 'true' : undefined}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => !item.soon && handleNavigate(item.path)}
                      >
                        <Icon name={item.icon} size={18} />
                      </button>
                    );
                  })}
                </Fragment>
              ))}
            </div>

            {activeSidebar.cta ? (
              <div className="rl-foot">
                <button
                  type="button"
                  className="rl rl-cta"
                  data-tip={activeSidebar.cta}
                  aria-label={activeSidebar.cta}
                  onClick={() => activeSidebar.ctaPath && handleNavigate(activeSidebar.ctaPath)}
                >
                  <Icon name={activeSidebar.ctaIcon || 'plus'} size={18} />
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="sb__head">
              <span className="tile">{activeSidebar.tile}</span>
              <span className="sb__title">{activeSidebar.title}</span>
              <button
                type="button"
                className="sb__collapse"
                id="sbClose"
                aria-label="Collapse sidebar"
                onClick={onToggleCollapse}
              >
                <Icon name="dchev" size={18} />
              </button>
            </div>

            {activeSidebar.pill && (
              <div className="sb__quick">
                <button
                  type="button"
                  className="sb__pill"
                  aria-current={pillActive ? 'page' : undefined}
                  disabled={activeSidebar.pill.soon}
                  title={activeSidebar.pill.soon ? 'Available in a later update' : undefined}
                  onClick={() => !activeSidebar.pill.soon && handleNavigate(activeSidebar.pill.path)}
                >
                  <Icon name={activeSidebar.pill.icon} size={16} />
                  <span>{activeSidebar.pill.label}</span>
                  {activeSidebar.pill.soon && <span className="soon">Soon</span>}
                </button>
              </div>
            )}

            <div className="sb__scroll">
              {activeSidebar.groups.map((group) => (
                <div className="sb__group" key={group.label}>
                  <div className="sb__label">{group.label}</div>
                  {group.items.map((item) => {
                    const active = isItemActive(item, pathname);
                    return (
                      <button
                        key={item.id || item.label}
                        type="button"
                        className="sb__item"
                        aria-current={active ? 'page' : undefined}
                        disabled={item.soon}
                        title={item.soon ? 'Available in a later update' : undefined}
                        onClick={() => !item.soon && handleNavigate(item.path)}
                      >
                        <Icon name={item.icon} size={16} />
                        <span>{item.label}</span>
                        {item.soon && <span className="soon">Soon</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {activeSidebar.cta ? (
              <div className="sb__foot">
                <button
                  type="button"
                  className="sb__cta"
                  onClick={() => activeSidebar.ctaPath && handleNavigate(activeSidebar.ctaPath)}
                >
                  <Icon name={activeSidebar.ctaIcon || 'plus'} size={16} />
                  <span>{activeSidebar.cta}</span>
                </button>
              </div>
            ) : (
              <div className="sb__foot" />
            )}
          </>
        )}
      </aside>

      {/* Shared fixed rail tooltip */}
      {tipState.visible && (
        <div
          className={`tip ${tipState.kbd || tipState.soon ? 'tip--chip' : ''}`.trim()}
          id="tip"
          role="tooltip"
          style={{
            left: `${tipState.left}px`,
            top: `${tipState.top}px`,
          }}
        >
          <span>{tipState.text}</span>
          {tipState.kbd && <kbd>{tipState.kbd}</kbd>}
          {tipState.soon && <span className="soon">Soon</span>}
        </div>
      )}
    </>
  );
}
