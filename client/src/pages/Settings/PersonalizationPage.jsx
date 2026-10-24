import { useDispatch, useSelector } from 'react-redux';
import { Check } from 'lucide-react';
import { setTheme } from '../../store/slices/themeSlice';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', hint: 'Bright surfaces and dark text' },
  { value: 'dark', label: 'Dark', hint: 'Dim surfaces for low light' },
];

function ThemePreview({ theme }) {
  return (
    <span className={`theme-preview theme-preview--${theme}`} aria-hidden="true">
      <span className="theme-preview__sidebar">
        <span className="theme-preview__brand" />
        <span className="theme-preview__row theme-preview__row--active" />
        <span className="theme-preview__row" />
        <span className="theme-preview__row" />
      </span>
      <span className="theme-preview__main">
        <span className="theme-preview__bar" />
        <span className="theme-preview__card">
          <span className="theme-preview__line" />
          <span className="theme-preview__line theme-preview__line--short" />
        </span>
      </span>
    </span>
  );
}

export default function PersonalizationPage() {
  const dispatch = useDispatch();
  const currentTheme = useSelector((state) => state.theme.currentTheme);

  return (
    <div className="personalization-page">
      <header className="personalization-page__header">
        <h1 className="personalization-page__title">Personalization</h1>
        <p className="personalization-page__subtitle">
          Manage how Alturay looks and feels for you.
        </p>
      </header>

      <section className="settings-group" aria-labelledby="theme-heading">
        <div className="settings-group__header">
          <h2 className="settings-group__title" id="theme-heading">Theme</h2>
          <p className="settings-group__description">
            Choose how Alturay looks across your devices.
          </p>
        </div>

        <div className="settings-group__body">
          <fieldset className="theme-options">
            <legend className="sr-only">Theme</legend>

            {THEME_OPTIONS.map((option) => {
              const selected = currentTheme === option.value;

              return (
                <label
                  key={option.value}
                  className={`theme-option ${selected ? 'theme-option--selected' : ''}`}
                >
                  <input
                    className="theme-option__input"
                    type="radio"
                    name="theme"
                    value={option.value}
                    checked={selected}
                    onChange={() => dispatch(setTheme(option.value))}
                  />
                  <ThemePreview theme={option.value} />
                  <span className="theme-option__footer">
                    <span className="theme-option__text">
                      <span className="theme-option__label">{option.label}</span>
                      <span className="theme-option__hint">{option.hint}</span>
                    </span>
                    <span className="theme-option__indicator" aria-hidden="true">
                      {selected && <Check size={13} strokeWidth={3} />}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        </div>
      </section>
    </div>
  );
}
