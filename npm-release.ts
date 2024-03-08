import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

async function prepareRelease()
{
    await deleteOldDistFolder();
    await compileProject();
    await cleanupDistributionFolder();
    await copyCSSFiles();
}

async function deleteOldDistFolder()
{
    try
    {   
        await fs.rm("distribution", { recursive: true });
    } catch {};
}

async function compileProject()
{
    try {
        execSync('tsc', { stdio: 'inherit' });
    } catch (error) {
        await fs.rm("tmp", { recursive: true });
        console.log("Release aborted due to compilation error.");
        process.exit(1);
    }
    await fs.rename("tmp/source", "distribution");
    await fs.rm("tmp", { recursive: true });
}

async function cleanupDistributionFolder()
{
    await removeTestFiles("distribution");
    await fs.rm("distribution/tests", { recursive: true });
}

async function removeTestFiles(folder: string)
{
    const entries = await fs.readdir(folder);

    for (const entry of entries) 
    {
        const entryPath = path.join(folder, entry);
        const stats = await fs.stat(entryPath);

        if (stats.isDirectory())
            removeTestFiles(entryPath);
        else if (entry.endsWith('.test.d.ts') || entry.endsWith('.spec.d.ts') || entry.endsWith(".test.js") || entry.endsWith(".spec.js"))
            await fs.unlink(entryPath);
    };
}

async function copyCSSFiles()
{
    await fs.copyFile("source/browser/style.css", "distribution/browser/style.css");
}

prepareRelease();