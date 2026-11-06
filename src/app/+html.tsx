import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const bootstrapStyles = `
  #assessmatrix-web-loader {
    align-items: center;
    background: #f5f8fc;
    color: #142033;
    display: flex;
    inset: 0;
    justify-content: center;
    position: fixed;
    transition: opacity 180ms ease;
    z-index: 2147483647;
  }

  #assessmatrix-web-loader[data-hiding='true'] {
    opacity: 0;
    pointer-events: none;
  }

  .assessmatrix-web-loader__content {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .assessmatrix-web-loader__mark {
    align-items: center;
    background: #0b6fa8;
    border-radius: 18px;
    box-shadow: 0 14px 32px rgba(11, 111, 168, 0.22);
    color: #ffffff;
    display: flex;
    font: 700 22px/1 system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    height: 60px;
    justify-content: center;
    width: 60px;
  }

  .assessmatrix-web-loader__ring {
    animation: assessmatrix-spin 800ms linear infinite;
    border: 3px solid rgba(11, 111, 168, 0.18);
    border-radius: 999px;
    border-top-color: #0b6fa8;
    height: 30px;
    width: 30px;
  }

  .assessmatrix-web-loader__label {
    font: 600 14px/1.4 system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    letter-spacing: 0.01em;
  }

  @keyframes assessmatrix-spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-color-scheme: dark) {
    #assessmatrix-web-loader {
      background: #0a101a;
      color: #eef4fb;
    }

    .assessmatrix-web-loader__mark {
      background: #1687c2;
      box-shadow: 0 14px 32px rgba(0, 0, 0, 0.42);
    }

    .assessmatrix-web-loader__ring {
      border-color: rgba(116, 199, 242, 0.2);
      border-top-color: #74c7f2;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .assessmatrix-web-loader__ring {
      animation-duration: 1600ms;
    }
  }
`;

const hideBootstrapLoader = `
  window.addEventListener('load', function () {
    window.requestAnimationFrame(function () {
      var loader = document.getElementById('assessmatrix-web-loader');
      if (!loader) return;
      loader.setAttribute('data-hiding', 'true');
      window.setTimeout(function () { loader.remove(); }, 200);
    });
  });
`;

export default function Root({ children }: PropsWithChildren) {
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();

  return (
    <html {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1, viewport-fit=cover" name="viewport" />
        <ScrollViewStyleReset />
        {headNodes}
        <style dangerouslySetInnerHTML={{ __html: bootstrapStyles }} />
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
        <div aria-label="Loading AssessMatrix" id="assessmatrix-web-loader" role="status">
          <div className="assessmatrix-web-loader__content">
            <div aria-hidden="true" className="assessmatrix-web-loader__mark">
              A
            </div>
            <div aria-hidden="true" className="assessmatrix-web-loader__ring" />
            <div className="assessmatrix-web-loader__label">Loading AssessMatrix…</div>
          </div>
        </div>
        <script dangerouslySetInnerHTML={{ __html: hideBootstrapLoader }} />
      </body>
    </html>
  );
}
