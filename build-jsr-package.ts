import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

type PackageJSON = {
    version: string;
    dependencies?: Record<string, string>;
};

type DenoConfigJSON = {
    version: string;
    imports?: Record<string, string>;
};

const distributionFolder = "distribution";
const denoDistributionFolder = path.join(distributionFolder, "deno");
const jsrDenoTemplatePath = path.join("configuration", "jsr-deno.json");
const jsrPublishCommand = "deno publish";
const jsrValidationCommand = `${jsrPublishCommand} --allow-dirty --dry-run`;

async function build()
{
    console.log("Preparing JSR build...");
    console.log("Deleting old Deno distribution folder...");
    await deleteOldDenoDistFolder();
    console.log("Preparing Deno distribution folder...");
    await copySourceFiles();
    await copyReadme();
    await removeTestsAndNonDenoModules();
    await writeDenoConfig();
    console.group("Validating JSR package...");
    await validateJSRPackage();
    console.groupEnd();
    console.log();
    console.log(`JSR release ready. Publish from distribution/deno with \`${jsrPublishCommand}\`.`);
}

async function deleteOldDenoDistFolder()
{
    await fs.rm(denoDistributionFolder, { recursive: true, force: true });
}

async function copySourceFiles()
{
    await fs.mkdir(distributionFolder, { recursive: true });
    await fs.cp("source", denoDistributionFolder, { recursive: true });
}

async function copyReadme()
{
    await fs.copyFile("README.md", path.join(denoDistributionFolder, "README.md"));
}

async function removeTestsAndNonDenoModules()
{
    await removeTestFiles(denoDistributionFolder);
    await fs.rm(path.join(denoDistributionFolder, "environments/cli/node"), { recursive: true, force: true });
    await fs.rm(path.join(denoDistributionFolder, "environments/cli/bun"), { recursive: true, force: true });
}

async function removeTestFiles(folder: string)
{
    const entries = await fs.readdir(folder);

    for (const entry of entries)
    {
        const entryPath = path.join(folder, entry);
        const stats = await fs.stat(entryPath);

        if (stats.isDirectory())
            await removeTestFiles(entryPath);
        else if (entry.endsWith('.test.ts') || entry.endsWith('.spec.ts'))
            await fs.unlink(entryPath);
    };
}

async function writeDenoConfig()
{
    const packageJSON = await readJSONFile<PackageJSON>("package.json");
    const denoConfig = await readJSONFile<DenoConfigJSON>(jsrDenoTemplatePath);
    const dependencyImports = Object.fromEntries(
        Object.entries(packageJSON.dependencies ?? {})
            .map(([dependency, version]) => [dependency, `npm:${dependency}@${version}`])
    );

    denoConfig.version = packageJSON.version;
    denoConfig.imports = {
        ...denoConfig.imports,
        ...dependencyImports,
    };

    await fs.writeFile(
        path.join(denoDistributionFolder, "deno.json"),
        `${JSON.stringify(denoConfig, undefined, 2)}\n`
    );
}

async function validateJSRPackage()
{
    try {
        execSync(jsrValidationCommand, { cwd: denoDistributionFolder, stdio: 'inherit' });
    } catch (error) {
        console.log("JSR release aborted due to publish validation error.");
        process.exit(1);
    }
}

async function readJSONFile<T>(filePath: string): Promise<T>
{
    return JSON.parse(await fs.readFile(filePath, "utf8"));
}

build();
