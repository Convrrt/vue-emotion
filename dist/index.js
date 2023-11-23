'use strict';

var createCache = require('@emotion/cache');
var vue = require('vue');
var utils = require('@emotion/utils');
var serialize = require('@emotion/serialize');
var nanoid = require('nanoid');

const ILLEGAL_ESCAPE_SEQUENCE_ERROR =
  process.env.NODE_ENV === 'production' ?
    '' :
    `You have illegal escape sequence in your template literal, most likely inside content's property value.
Because you write your CSS inside a JavaScript string you actually have to do double escaping, so for example "content: '\\00d7';" should become "content: '\\\\00d7';".
You can read more about this here:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#ES2018_revision_of_illegal_escape_sequences`;

const createStyled = (tag, options = {}) => {
  if (process.env.NODE_ENV !== 'production') {
    if (tag === undefined) {
      throw new Error(
        'You are trying to create a styled element with an undefined component.\nYou may have forgotten to import it.'
      )
    }
  }

  const identifierName = options.label;
  const targetClassName = options.target;

  let isReal = tag.__emotion_real === tag;
  let baseTag = (isReal && tag.__emotion_base) || tag;

  let defaultProps = typeof tag === 'string' ? undefined : tag.defaultProps;

  if (typeof tag !== 'string') {
    isReal = tag.__emotion_real === tag;
    baseTag = (isReal && tag.__emotion_base) || tag;
  }

  return function (...args) {
    let styles = isReal && typeof tag !== 'string' && tag.__emotion_styles !== undefined
      ? tag.__emotion_styles.slice(0)
      : [];

    if (identifierName !== undefined) {
      styles.push(`label:${identifierName};`);
    }

    if (args[0] === null || args[0].raw === undefined) {
      styles.push(...args);
    } else {
      if (process.env.NODE_ENV !== 'production' && args[0][0] === undefined) {
        console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR);
      }

      styles.push(args[0][0]);
      const len = args.length;
      let i = 1;
      for (; i < len; i++) {
        if (process.env.NODE_ENV !== 'production' && args[0][i] === undefined) {
          console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR);
        }

        styles.push(args[i], args[0][i]);
      }
    }

    const component = vue.defineComponent({
      'displayName': identifierName !== undefined ? identifierName : `Styled(${
        typeof baseTag === 'string' ? baseTag : baseTag.displayName || baseTag.name || 'Component'
      })`,
      'defaultProps': defaultProps,
      '__emotion_base': baseTag,
      '__emotion_styles': styles,
      'withComponent': (nextTag, nextOptions) => {
        return createStyled(
          nextTag,
          nextOptions === undefined ?
            options :
            {...(options || {}), ...nextOptions}
        )(...styles)
      },
      setup(props, {slots, attrs = {}}) {

        const emotionCache = vue.inject('$emotionCache', createCache({key: 'css'}));
        const theme = vue.inject('theme', {});

        const classInterpolations = [];
        const mergedProps = {
          ...attrs,
          theme
        };
        const newProps = {...(defaultProps || {}), ...props};

        let classNames = '';
        if (attrs.class) {
          classNames += utils.getRegisteredStyles(
            emotionCache.registered,
            classInterpolations,
            ''
          );
        }

        const serialized = serialize.serializeStyles(
          styles.concat(classInterpolations),
          emotionCache.registered,
          mergedProps
        );

        utils.insertStyles(
          emotionCache,
          serialized,
          typeof baseTag === 'string'
        );

        classNames += `${emotionCache.key}-${serialized.name}`;
        if (targetClassName !== undefined) {
          classNames += ` ${targetClassName}`;
        }
        const key = nanoid.nanoid(6);
        console.log("Vue Emotion - Component Key: ", key);

        const component_props = {class:classNames, ...newProps, key: key};
        return () => vue.h(baseTag, component_props, slots)
      }
    });

    Object.defineProperty(component, 'toString', {
      value() {
        if (
          targetClassName === undefined &&
          process.env.NODE_ENV !== 'production'
        ) {
          return 'NO_COMPONENT_SELECTOR'
        }
        return `.${targetClassName}`
      }
    });

    component.__emotion_real = component;

    return component
  }
};

const styled = createStyled;

function insertWithoutScoping(cache, serialized) {
  if (cache.inserted[serialized.name] === undefined) {
    return cache.insert("", serialized, cache.sheet, true);
  }
}

const createGlobalStyle = (...styles) => ({
  inheritAttrs: false,
  inject: {
    $emotionCache: {
      default: null,
    }
  },
  render({ $parent, $attrs, $props }) {
    const cache = $parent.$emotionCache || this.$emotionCache;
    const mergedProps = { ...$props, ...$attrs };
    const serialized = serialize.serializeStyles(styles, cache.registered, mergedProps);
    insertWithoutScoping(cache, serialized);
  },
});

function VueEmotion(app, opts= {}) {
  const cache = opts.emotionCache || createCache({key: 'css'});
  cache.compat = true;
  app.provide('$emotionCache', cache);
}

exports.createCache = createCache;
exports.VueEmotion = VueEmotion;
exports.createGlobalStyle = createGlobalStyle;
exports.styled = styled;
