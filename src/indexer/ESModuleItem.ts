export interface Marker {
  location: SymbolLocation;
  filePath: string;
  name: string;
}

export interface SymbolLocation {
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
}

export default class ESModuleItem {
  public id: string = "";
  public name: string = "";
  public location?: SymbolLocation;
  public path: string = "";
  public kind: string = "";
  public code: string = "";
  public markers: Marker[] = [];
}
