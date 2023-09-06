'use strict';

var server = require('@emotion/server');

const renderStyle = (html) => {
  const { css, ids } = server.extractCritical(html);
  return `<style data-emotion-${cache.key}="${ids.join(" ")}">${css}</style>`;
};

exports.renderStyle = renderStyle;
