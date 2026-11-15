import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * useGSAP
 * Hook conforming to GSAP's official React guidelines.
 * Wraps animations in `gsap.context(callback, scope)` and automatically
 * reverts on unmount, preventing leaks, lingering ScrollTriggers, and stale DOM references.
 *
 * @param {Function} callback - Animation setup callback `(context, contextSafe) => void | Function`
 * @param {Object} [config] - Configuration object: `{ scope, dependencies, revertOnUpdate }`
 * @returns {{ context: gsap.Context | null }}
 */
export const useGSAP = (callback, config = {}) => {
  const { scope, dependencies = [] } =
    typeof config === "function" || Array.isArray(config)
      ? { dependencies: config }
      : config;

  const contextRef = useRef(null);

  useIsomorphicLayoutEffect(() => {
    if (typeof callback !== "function") return undefined;

    const scopeTarget = scope?.current || scope || undefined;

    const ctx = gsap.context((context) => {
      const contextSafe = (fn) => (...args) => {
        if (ctx) {
          return ctx.add(() => fn(...args))();
        }
      };
      return callback(context, contextSafe);
    }, scopeTarget);

    contextRef.current = ctx;

    return () => {
      ctx.revert();
    };
  }, dependencies);

  return { contextRef };
};

export default useGSAP;
