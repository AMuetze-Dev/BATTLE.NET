/**
 * CSS Modules Type Declaration - Battle.Net Quiz Platform
 * 
 * Allows TypeScript to understand CSS Module imports.
 */

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: { readonly [key: string]: string };
  export default content;
}
