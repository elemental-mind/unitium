import path from 'path';
import ts from 'typescript';
import fs from 'fs/promises';
import { CompilationServer } from './compilationServer.js';

export class SourceFile
{
    public version = 0;
    #compilerNode?: ts.SourceFile;
    #compilerNodeVersion?: number;

    static async fromDiskFile(server: CompilationServer, name: string)
    {
        const absoluteName = path.resolve(name).replaceAll("\\", "/");
        const file = new SourceFile(absoluteName, await fs.readFile(absoluteName, "utf-8"), server);
        return file;
    }

    static async fromCopyOf(sourceFile: SourceFile, name: string)
    {
        const absoluteName = path.resolve(name).replaceAll("\\", "/");
        const file = new SourceFile(absoluteName, sourceFile.contents, sourceFile.compileServer);
        return file;
    }

    static async fromEmptyString(server: CompilationServer, name: string)
    {
        const absoluteName = path.resolve(name).replaceAll("\\", "/");
        const file = new SourceFile(absoluteName, "", server);
        return file;
    }

    private constructor(
        public fileName: string,
        public contents: string,
        private compileServer: CompilationServer
    ) { };

    get compilerNode()
    {
        if (!this.#compilerNode || this.version !== this.#compilerNodeVersion)
        {
            this.#compilerNode = this.compileServer.languageService.getProgram()!.getSourceFile(this.fileName)!;
            this.#compilerNodeVersion = this.version;
        }
        return this.#compilerNode;
    }

    removeUnusedCode()
    {
        let unusedImportEdits, unusedSymbolEdits;
        do
        {
            unusedImportEdits = this.compileServer.languageService
                .getCombinedCodeFix({ fileName: this.fileName, type: "file" }, "unusedIdentifier_deleteImports", {}, {})
                .changes[0]?.textChanges;

            unusedSymbolEdits = this.compileServer.languageService
                .getCombinedCodeFix({ fileName: this.fileName, type: "file" }, "unusedIdentifier_delete", {}, {})
                .changes[0]?.textChanges;

            const consolidatedEdits = [];

            if (unusedImportEdits)
                consolidatedEdits.push(...unusedImportEdits);
            if (unusedSymbolEdits)
                consolidatedEdits.push(...unusedSymbolEdits);

            consolidatedEdits.sort((A, B) => B.span.start - A.span.start);

            for (const edit of consolidatedEdits)
                this.contents = this.contents.slice(0, edit.span.start) + edit.newText + this.contents.slice(edit.span.start + edit.span.length);

            this.version++;
        } while (unusedImportEdits || unusedSymbolEdits);
    }

    getJSString()
    {
        let jsString;
        this.compileServer.program?.emit(this.compilerNode, (fileName, text) => jsString = text);
        return jsString;
    }

    get typeChecker()
    {
        return this.compileServer.typeChecker;
    }

    get imports()
    {
        return this.compilerNode
            .statements
            .filter(s => s.kind === ts.SyntaxKind.ImportDeclaration)
            .map(imp => new Import(this, imp));
    }

    get classes()
    {
        return this.compilerNode
            .statements
            .filter(s => s.kind === ts.SyntaxKind.ClassDeclaration)
            .map(imp => new Class(this, imp));
    }

    removeNodes(nodes: ts.Node[])
    {

    }

    // private findNodesByRange(node: ts.Node, editRange: CodeRange, nodes: ts.Node[])
    // {
    //     const nodeRange = CodeRange.fromNode(this, node);
    //     nodeRange.normalize();

    //     if (nodeRange.fitsInto(editRange))
    //     {
    //         nodes.push(node);
    //         return;
    //     }
    //     else
    //     {
    //         for (const child of node.getChildren(this.compilerNode))
    //         {
    //             if (child.end < editRange.start)
    //                 continue;
    //             else if (child.pos > editRange.end)
    //                 break;
    //             else
    //             {
    //                 const childRange = CodeRange.fromNode(this, child);
    //                 childRange.normalize();

    //                 if (childRange.exceeds(editRange))
    //                 {
    //                     this.findNodesByRange(child, editRange, nodes);
    //                     continue;
    //                 } else if (childRange.fitsInto(editRange))
    //                 {
    //                     nodes.push(child);
    //                 }
    //             }
    //         }
    //     }
    // }
}

