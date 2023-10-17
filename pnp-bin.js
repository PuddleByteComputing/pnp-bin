#!/usr/bin/env node

import path from "path";
import { PnpBin } from "./index.js";

const targetPnpPath = path.resolve(process.cwd(), process.argv[2]);
const pnpBin = PnpBin(targetPnpPath);

if (!targetPnpPath) {
  console.log(
    `Usage: ${process.argv[0]} <path to .pnp.cjs file> [name of binary]`,
  );
  process.exit(1);
}

if (process.argv[3]) {
  pnpBin.findBinary(process.argv[3]).then((path) => {
    if (path) {
      console.log(path);
    } else {
      console.error(`Could not find binary '${process.argv[3]}' in package`);
      process.exit(1);
    }
  });
} else {
  pnpBin.listBinaries().then((binaries) =>
    console.log(
      binaries
        .map((b) => b[0])
        .sort()
        .join("\n"),
    ),
  );
}
