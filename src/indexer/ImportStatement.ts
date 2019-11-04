import ESModuleItem from "./ESModuleItem";

export interface ImportSpecifier {
  name: string;
  isDefault: boolean;
  references: {
    containerName: string;
    containerType: string;
  }[];
}

export default interface ImportStatement {
  path: string;
  specifiers: ImportSpecifier[];
}
