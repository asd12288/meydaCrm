/**
 * Theme initialization script that runs before React hydration.
 * Prevents flash of unstyled content (FOUC) by applying the theme
 * class immediately based on localStorage or system preference.
 */
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var stored = localStorage.getItem('crm-theme');
        var theme = stored === 'dark' ? 'dark'
          : stored === 'light' ? 'light'
          : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {}
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
