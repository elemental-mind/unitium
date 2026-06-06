import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

type PackageJSON = {
    name: string;
    version: string;
    description?: string;
    keywords?: string[];
    author?: string;
    license?: string;
    engines?: Record<string, string>;
    dependencies?: Record<string, string>;
    repository?: unknown;
    homepage?: string;
};

const distributionFolder = "distribution";
const nodeDistributionFolder = path.join(distributionFolder, "node");
const npmPackageTemplatePath = path.join("configuration", "npm-package.json");
const npmReleaseTSConfigPath = path.join("configuration", "tsconfig.npm-release.json");

async function prepareRelease()
{
    console.log("Preparing release...");
    console.log("Deleting old Node distribution folder...");
    await deleteOldNodeDistFolder();
    console.group("Compiling project...");
    await compileProject();
    console.groupEnd();
    console.log("Preparing distribution folder...");
    await copyCSSFiles();
    await copyReadme();
    await writeNodePackageJSON();
    console.log();
    console.log("Release ready for publishing.");
}

async function deleteOldNodeDistFolder()
{
    await fs.rm(nodeDistributionFolder, { recursive: true, force: true });
}

async function compileProject()
{
    try
    {
        execSync(`npm exec tsc -- --project ${npmReleaseTSConfigPath}`, { stdio: 'inherit' });
    } catch (error)
    {
        console.log("Release aborted due to compilation error.");
        process.exit(1);
    }
}

async function copyCSSFiles()
{
    await fs.copyFile("source/environments/browser/style.css", path.join(nodeDistributionFolder, "environments/browser/style.css"));
}

async function copyReadme()
{
    await fs.copyFile("README.md", path.join(nodeDistributionFolder, "README.md"));
}

async function writeNodePackageJSON()
{
    const packageJSON = JSON.parse(await fs.readFile("package.json", "utf8")) as PackageJSON;
    const nodePackageJSON = JSON.parse(await fs.readFile(npmPackageTemplatePath, "utf8")) as PackageJSON;

    nodePackageJSON.version = packageJSON.version;
    nodePackageJSON.dependencies = packageJSON.dependencies;

    await fs.writeFile(
        path.join(nodeDistributionFolder, "package.json"),
        `${JSON.stringify(nodePackageJSON, undefined, 2)}\n`
    );
}

prepareRelease();
