import { PosixFS } from "@yarnpkg/fslib";
import { ZipOpenFS } from "@yarnpkg/libzip";
import path from "path";

export async function PnpBin(targetPnpPath) {
  const { default: pnp } = await import(path.resolve(targetPnpPath));
  const zipOpenFs = new ZipOpenFS();
  const crossFs = new PosixFS(zipOpenFs);

  function getPackageJson(packagePath) {
    try {
      return JSON.parse(
        crossFs.readFileSync(path.resolve(packagePath, "package.json")),
      );
    } catch (e) {
      return undefined;
    }
  }

  function getPackageLocation(locator) {
    const path = pnp.getPackageInformation(locator).packageLocation;
    return locator.reference.startsWith("virtual:")
      ? pnp.resolveVirtual(path)
      : path;
  }

  function listPnpPackageLocations() {
    const dependencies = pnp.getPackageInformation(
      pnp.topLevel,
    ).packageDependencies;
    const locators = [...dependencies.entries()].map((d) =>
      pnp.getLocator(d[0], d[1]),
    );
    return locators.map((locator) => [
      locator.name,
      getPackageLocation(locator),
    ]);
  }

  function listBinaries() {
    const locations = listPnpPackageLocations();
    return locations
      .filter((l, i, a) => a.indexOf(l) === i)
      .map((l) => [l[1], getPackageJson(l[1])])
      .filter((m) => "bin" in m[1])
      .reduce((acc, m) => {
        if (typeof m[1]["bin"] === "string") {
          acc.push([m[1].name, path.resolve(m[0], m[1].bin)]);
        } else if (typeof m[1]["bin"] === "object") {
          acc.push(
            ...Object.entries(m[1].bin).map(([name, pth]) => [
              name,
              path.resolve(m[0], pth),
            ]),
          );
        }

        return acc;
      }, []);
  }

  function findPackageBinary(location, binaryName) {
    if (location) {
      const packagePath = location[1];
      const packageJson = getPackageJson(packagePath);
      if (packageJson && packageJson.bin) {
        if (
          typeof packageJson.bin === "string" &&
          (packageJson.name === binaryName ||
            path.basename(packageJson.name) === binaryName)
        ) {
          return path.resolve(packagePath, packageJson.bin);
        } else if (packageJson?.bin?.[binaryName]) {
          return path.resolve(packagePath, packageJson.bin[binaryName]);
        }
      }
    }
  }

  function findBinary(binaryName) {
    const locations = listPnpPackageLocations(targetPnpPath);

    // pulling the package.json from a package zip archive is expensive, so...
    // if there's a package with the same name as the binary, try that first
    const exactMatchLocation = locations.find(
      (l) => l[0] === binaryName || path.basename(l[0]) === binaryName,
    );
    if (exactMatchLocation) {
      const binary = findPackageBinary(exactMatchLocation, binaryName);
      if (binary) {
        return binary;
      }
    }

    let binary = undefined;
    locations.find((l) => (binary = findPackageBinary(l, binaryName)));
    return binary;
  }

  return Object.freeze({ listBinaries, findBinary });
}

export default PnpBin;
