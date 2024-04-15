import fs from 'fs/promises';
import path from 'path';
import { frameworkServer } from '../orchestration/frameworkServer.js';

export class File
{
    constructor(
        public filePath: string
    )
    {
        this.filePath = this.normalizeFilePath(filePath);
    }

    get fileURL(): string
    {
        return `file://${this.filePath}`;
    }

    get serverURL(): string
    {
        const relativePath = path.relative(frameworkServer.servePath, this.filePath);
        return new URL(relativePath, frameworkServer.baseURL).toString();
    }

    async getContents(): Promise<string>
    {
        return fs.readFile(this.filePath, 'utf8');
    }

    async setContents(data: string)
    {
        await fs.writeFile(this.filePath, data, 'utf8');
    }

    async append(data: string): Promise<void>
    {
        await fs.appendFile(this.filePath, data, 'utf8');
    }

    async import(): Promise<any>
    {
        return import(this.fileURL);
    }

    private normalizeFilePath(filePath: string): string
    {
        // Normalize Windows and Unix file paths
        return path.resolve(filePath).replace(/\\/g, '/');
    }

    async delete(): Promise<void>
    {
        await fs.unlink(this.filePath);
    }
}
