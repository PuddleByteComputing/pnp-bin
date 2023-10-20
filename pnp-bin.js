#!/usr/bin/env node

import path from "path";
import { PnpBin } from "./index.js";

const usage = () =>
  console.error(
    `Usage: ${process.argv[1]} <path to target .pnp.cjs file> [name of binary to locate]`,
  );

export default function main() {
  if (!process.argv[2]) {
    usage();
    exit(1);
  }

  const targetPnpPath = path.resolve(process.cwd(), process.argv[2]);
  PnpBin(targetPnpPath).then((pnpBin) => {
    if (process.argv[3]) {
      const path = pnpBin.findBinary(process.argv[3]);
      if (path) {
        console.log(path);
      } else {
        console.error(`Could not find binary '${process.argv[3]}' in package`);
        process.exit(1);
      }
    } else {
      const binaries = pnpBin.listBinaries();
      console.log(
        binaries
          .map((b) => path.basename(b[0]))
          .sort()
          .join("\n"),
      );
    }
  });
}

main();
