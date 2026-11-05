/**
 * Minimal ambient type definitions for environments where @types/node or @types/react
 * are peer dependencies provided by the consuming Next.js application.
 */

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

declare module 'react' {
  export interface ReactElement<
    P = any,
    T extends string | ((props: P) => any) = string | ((props: P) => any)
  > {
    type: T;
    props: P;
    key: string | null;
  }

  export namespace JSX {
    interface Element extends ReactElement<any, any> {}
  }

  export function createElement(type: any, props?: any, ...children: any[]): ReactElement;
  export const Fragment: any;

  const React: {
    createElement: typeof createElement;
    Fragment: any;
  };

  export default React;
}

