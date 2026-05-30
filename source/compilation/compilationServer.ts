import * as ts from 'typescript';
import { SourceFile } from './sourceFile.js';

export class CompilationServer
{
    public compilerOptions: ts.CompilerOptions =
        {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.ES2020,
            noLib: true,
            skipLibCheck: true,
            skipDefaultLibCheck: true,
            noUnusedLocals: true,
            typeRoots: []
        };
    public languageServiceHost: ts.LanguageServiceHost;
    public languageService: ts.LanguageService;

    public documentRegistry: ts.DocumentRegistry;

    public sourceFiles: Map<string, SourceFile> = new Map();

    constructor()
    {
        this.languageServiceHost = {
            getCompilationSettings: () => this.compilerOptions,
            getScriptFileNames: () => [...this.sourceFiles.keys()],
            getScriptVersion: fileName => this.sourceFiles.get(fileName)!.version.toString(),
            getScriptSnapshot: fileName => ts.ScriptSnapshot.fromString(this.sourceFiles.get(fileName)!.contents),
            getCurrentDirectory: () => process.cwd(),
            getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
            fileExists: path => this.sourceFiles.has(path),
            readFile: path => this.sourceFiles.get(path)?.contents,
            readDirectory: path => [...this.sourceFiles.keys()].filter(name => name.startsWith(path)),
            getDirectories: path => [...this.sourceFiles.keys()].filter(name => name.startsWith(path)),
            directoryExists: path => [...this.sourceFiles.keys()].some(name => name.startsWith(path)),
            writeFile: (path, content) => { throw new Error("Not implemented"); }
        };

        this.documentRegistry = ts.createDocumentRegistry();
        this.languageService = ts.createLanguageService(this.languageServiceHost, this.documentRegistry);
    }

    get program()
    {
        return this.languageService.getProgram()!;
    }

    get typeChecker()
    {
        return this.program.getTypeChecker();
    }

    async loadFile(name: string)
    {
        const file = await SourceFile.fromDiskFile(this, name);
        this.sourceFiles.set(file.fileName, file);
        return file;
    }
}

class CodeRange
{
    static fromNode(sourceFile: SourceFile, node: ts.Node)
    {
        return new CodeRange(sourceFile, node.pos, node.end);
    }

    static fromSpan(sourceFile: SourceFile, span: ts.TextSpan)
    {
        return new CodeRange(sourceFile, span.start, span.start + span.length);
    }

    constructor(
        public sourceFile: SourceFile,
        public start: number,
        public end: number
    ) { };

    get length()
    {
        return this.end - this.start;
    }

    get text()
    {
        return this.sourceFile.contents.slice(this.start, this.end);
    }

    exceeds(range: CodeRange)
    {
        return this.start <= range.start && this.end >= range.end && this.length > range.length;
    }

    startsIn(range: CodeRange)
    {
        return (this.start >= range.start) && (this.start < range.end);
    }

    endsIn(range: CodeRange)
    {
        return (this.end > range.start) && (this.end <= range.end);
    }

    fitsInto(range: CodeRange)
    {
        return (this.start >= range.start) && (this.end <= range.end);
    }

    normalize()
    {
        const leadingWhites = this.length - this.text.trimStart().length;
        const trainlingWhites = this.length - this.text.trimEnd().length;

        this.start += leadingWhites;
        this.end -= trainlingWhites;
    }
}