import rison from "rison";

export function encodeRison(obj: any): string {
  return rison.encode(obj);
}
