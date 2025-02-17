import {
  inject,
  defineComponent,
  h
} from 'vue'
import createCache                         from '@emotion/cache'
import { getRegisteredStyles, insertStyles } from '@emotion/utils'
import { serializeStyles } from '@emotion/serialize'
import {nanoid} from "nanoid";


const ILLEGAL_ESCAPE_SEQUENCE_ERROR =
  process.env.NODE_ENV === 'production' ?
    '' :
    `You have illegal escape sequence in your template literal, most likely inside content's property value.
Because you write your CSS inside a JavaScript string you actually have to do double escaping, so for example "content: '\\00d7';" should become "content: '\\\\00d7';".
You can read more about this here:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#ES2018_revision_of_illegal_escape_sequences`

const createStyled = (tag, options = {}) => {
  if (process.env.NODE_ENV !== 'production') {
    if (tag === undefined) {
      throw new Error(
        'You are trying to create a styled element with an undefined component.\nYou may have forgotten to import it.'
      )
    }
  }

  const identifierName = options.label
  const targetClassName = options.target

  let isReal = tag.__emotion_real === tag
  let baseTag = (isReal && tag.__emotion_base) || tag

  let defaultProps = typeof tag === 'string' ? undefined : tag.defaultProps

  if (typeof tag !== 'string') {
    isReal = tag.__emotion_real === tag
    baseTag = (isReal && tag.__emotion_base) || tag
  }

  return function (...args) {
    let styles = isReal && typeof tag !== 'string' && tag.__emotion_styles !== undefined
      ? tag.__emotion_styles.slice(0)
      : []

    if (identifierName !== undefined) {
      styles.push(`label:${identifierName};`)
    }

    if (args[0] === null || args[0].raw === undefined) {
      styles.push(...args)
    } else {
      if (process.env.NODE_ENV !== 'production' && args[0][0] === undefined) {
        console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR)
      }

      styles.push(args[0][0])
      const len = args.length
      let i = 1
      for (; i < len; i++) {
        if (process.env.NODE_ENV !== 'production' && args[0][i] === undefined) {
          console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR)
        }

        styles.push(args[i], args[0][i])
      }
    }

    const component = defineComponent({
      "displayName": identifierName !== void 0 ? identifierName : `Styled(${typeof baseTag === "string" ? baseTag : baseTag.displayName || baseTag.name || "Component"})`,
      "defaultProps": defaultProps,
      "__emotion_base": baseTag,
      "__emotion_styles": styles,
      "withComponent": (nextTag, nextOptions) => {
        return createStyled(
          nextTag,
          nextOptions === void 0 ? options : { ...options || {}, ...nextOptions }
        )(...styles);
      },
      setup(props, { slots, attrs = {} }) {
        const { as, theme, ...restAttrs } = attrs || {};

        const finalTag = as || baseTag;
        const emotionCache = inject("$emotionCache", createCache({ key: "css" }));

        const finalTheme = theme || inject("theme", {});

        console.debug("Vue Emotion - Component Created: ");

        return () => {
          const classInterpolations = [];

          const mergedProps = {
            ...attrs,
            theme: finalTheme
          };

          const newProps = { ...defaultProps || {}, ...props };
          let classNames = "";

          if (attrs.class) {
            classNames += getRegisteredStyles(
              emotionCache.registered,
              classInterpolations,
              ""
            );
          }

          const serialized = serializeStyles(
            styles.concat(classInterpolations),
            emotionCache.registered,
            mergedProps
          );

          insertStyles(
            emotionCache,
            serialized,
            typeof finalTag === "string"
          );

          classNames += `${emotionCache.key}-${serialized.name}`;
          if (targetClassName !== void 0) {
            classNames += ` ${targetClassName}`;
          }

          console.debug("Vue Emotion - Component Rendered: ");
          const component_props = { class: classNames, ...newProps };

          return h(finalTag, component_props, slots);
        }
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
    })

    component.__emotion_real = component

    return component
  }
}

export const styled = createStyled
