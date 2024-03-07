import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

async function prepareRelease()
{
    await deleteOldDistFolder();
    compileProject();
    await cleanupDistributionFolder();
    await copyCSSFiles();
}

async function deleteOldDistFolder()
{
    await fs.rm("distribution", { recursive: true });
}

function compileProject()
{
    execSync('tsc', { stdio: 'inherit' });
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