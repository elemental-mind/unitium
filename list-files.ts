import path from 'path';
import fs from 'fs/promises';

async function traverseDirectory(dirPath: string, filePaths: string[], cwd: string)
{
    const files = await fs.readdir(dirPath);
    for (const file of files)
    {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        if (stats.isDirectory())
        {
            await traverseDirectory(filePath, filePaths, cwd);
        } else if (!file.endsWith('.test.ts') && !file.endsWith('.spec.ts'))
        {
            const relativeFilePath = path.relative(cwd, filePath);
            filePaths.push(relativeFilePath);
        }
    }
}

async function listFiles()
{
    const cwd = process.cwd();
    const folderPaths = process.argv.slice(2);
    const filePaths: string[] = [];

    for (const folderPath of folderPaths)
    {
        const absoluteFolderPath = path.join(cwd, folderPath);
        await traverseDirectory(absoluteFolderPath, filePaths, cwd);
    }

    console.log(filePaths.map(path => "@" + path).join(" "));
}

listFiles();
