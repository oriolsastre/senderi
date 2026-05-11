declare module "archiver" {
  import { Transform } from "stream";

  interface EntryData {
    name: string;
    date?: Date | string;
    mode?: number;
    prefix?: string;
    stats?: import("fs").Stats;
    store?: boolean;
  }

  class Archiver extends Transform {
    abort(): this;
    append(source: string | Buffer | NodeJS.ReadableStream, data?: EntryData): this;
    directory(dirpath: string, destpath?: false | string, data?: Partial<EntryData>): this;
    file(filename: string, data: EntryData): this;
    finalize(): Promise<void>;
    pointer(): number;
  }

  class ZipArchive extends Archiver {
    constructor(options?: { zlib?: { level?: number }; comment?: string; forceUTC?: boolean; store?: boolean; namePrependSlash?: boolean });
  }

  class TarArchive extends Archiver {
    constructor(options?: { gzip?: boolean; gzipOptions?: object });
  }

  export { Archiver, ZipArchive, TarArchive };
}