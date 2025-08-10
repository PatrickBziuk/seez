// Astro JSX type declarations
declare global {
  namespace JSX {
    type Element = astroHTML.JSX.Element;
    interface ElementAttributesProperty {
      props: unknown;
    }
    interface ElementChildrenAttribute {
      children: unknown;
    }
    interface IntrinsicAttributes {
      slot?: string;
      'data-*'?: string | number | boolean;
      'aria-*'?: string | number | boolean;
      class?: string;
      className?: string;
      id?: string;
      style?: string | Record<string, string | number>;
      [key: string]: unknown;
    }
    interface IntrinsicElements {
      // HTML elements
      [elemName: string]: {
        [key: string]: unknown;
        children?: unknown;
        class?: string;
        className?: string;
        id?: string;
        style?: string | Record<string, string | number>;
      };
    }
  }
}

export {};
