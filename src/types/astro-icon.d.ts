declare module 'astro-icon/components' {
  export interface Props {
    name: string;
    class?: string;
    [key: string]: unknown;
  }
  export const Icon: (props: Props) => unknown;
}
