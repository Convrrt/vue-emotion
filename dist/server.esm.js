import { extractCritical } from '@emotion/server';

const renderStyle = (html) => {
  const { css, ids } = extractCritical(html);
  return `<style data-emotion-${cache.key}="${ids.join(" ")}">${css}</style>`;
};

export { renderStyle };
