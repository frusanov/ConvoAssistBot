import { PGlite } from "@electric-sql/pglite";
import { pgDump } from "@electric-sql/pglite-tools/pg_dump";
import { join } from "node:path";

const pg = await PGlite.create({
  dataDir: join(process.cwd(), "./tmp/db"),
});

const dump = await pgDump({ pg });

const dumpContent = await dump.text();

console.log(dumpContent);
