declare module 'rison-node' {
  const rison: {
    encode(obj: any): string;
    decode(str: string): any;
  };
  export default rison;
}