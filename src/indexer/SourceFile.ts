import {
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Identifier
} from "babel-types";
import { readFile } from "fs";
import { promisify } from "util";
import * as nanoid from "nanoid";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import { NodePath } from "babel-traverse";
import { getFileType } from "../extension/utils/file";
import ImportStatement, { ImportSpecifier } from "./ImportStatement";
import ESModuleItem from "./ESModuleItem";
import { ImportDeclaration } from "@babel/types";

export default class SourceFile {
  public path: string = "";
  public symbols: ESModuleItem[] = [];
  public importStatements: ImportStatement[] = [];

  public async parse(filePath: string) {
    this.path = filePath;

    const content = await promisify(readFile)(filePath);
    const ast = this.getAST(content.toString(), filePath);

    traverse(ast, {
      ExportNamedDeclaration: (path: NodePath<ExportNamedDeclaration>) => {
        this.extractExport(path, "named");
      },
      ExportDefaultDeclaration: (path: NodePath<ExportDefaultDeclaration>) => {
        this.extractExport(path, "default");
      },
      ImportDeclaration: (path: NodePath<ImportDeclaration>) => {
        this.extractImport(path);
      }
    });
  }

  private extractExport(
    path: NodePath<ExportDefaultDeclaration | ExportNamedDeclaration>,
    mode: "default" | "named"
  ) {
    const declaration = path.node.declaration;
    if (declaration) {
      let name = "none";

      if (
        declaration.type === "FunctionDeclaration" ||
        declaration.type === "ClassDeclaration" ||
        declaration.type === "TypeAlias"
      ) {
        name = declaration.id && declaration.id.name;
      } else if (declaration.type === "VariableDeclaration") {
        name =
          declaration.declarations[0] &&
          declaration.declarations[0].id &&
          (declaration.declarations[0].id as any).name;
      }

      const symbol = new ESModuleItem();
      symbol.id = "";
      symbol.name = name;
      symbol.exportStatus = mode;
      symbol.type = declaration.type as any;
      symbol.location = path.node.loc;
      this.symbols.push(symbol);
    }
  }

  private extractImport(path: NodePath<ImportDeclaration>) {
    const defaultSpecifierNode = path.node.specifiers.find(
      specifier => specifier.type === "ImportDefaultSpecifier"
    );

    const importDeclaration: ImportStatement = {
      path: path.node.source.value,
      specifiers: []
    };

    if (defaultSpecifierNode) {
      const referencePaths =
        path.scope.bindings[defaultSpecifierNode.local.name].referencePaths;

      const defaultSpecifier: ImportSpecifier = {
        isDefault: true,
        name: defaultSpecifierNode.local.name,
        references: referencePaths.map(referencePath => {

          const functionParent = referencePath.getFunctionParent();

          let containerName = '';
          if (functionParent.type === "ArrowFunctionExpression") {
            containerName = functionParent.
          } else if (functionParent.type === "") {
            containerName = functionParent.node.id.name
          }

          return {
            containerName,
            containerType: "FunctionDeclaration"
          }
        })
      };
      importDeclaration.specifiers.push(defaultSpecifier);
    }
    this.importStatements.push(importDeclaration);
  }

  private getAST(content: string, path: string) {
    const fileType = getFileType(path);

    const isTS = fileType === "TSX";
    const additionalPlugin = isTS ? "typescript" : "flow";

    return parser.parse(content, {
      sourceType: "module",
      plugins: ["jsx", "classProperties", "dynamicImport", additionalPlugin]
    });
  }
}
