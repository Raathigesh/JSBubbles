import { Arg, Mutation, Query, Resolver, Args } from "type-graphql";
import { ContainerInstance, Service } from "typedi";
import Indexer from "indexer/Indexer";
import Project from "indexer/Project";
import { Status } from "./Status";
import { SearchResult } from "../../entities/SearchResult";
import { GqlSymbolInformation } from "entities/GqlSymbolInformation";
import ESModuleItem from "indexer/ESModuleItem";
import { ReIndexArgs } from "./ReIndexArgs";
import { sep } from "path";
import * as vscode from "vscode";
import { ProjectInfo } from "entities/GqlProjectInfo";

@Service()
@Resolver(SearchResult)
export default class SymbolsResolver {
  private activeEditorPath: string | undefined;

  constructor(
    private readonly container: ContainerInstance,
    private readonly indexer: Indexer
  ) {
    vscode.window.onDidChangeActiveTextEditor(e => {
      if (e) {
        this.activeEditorPath = e.document.fileName;
      }
    });
  }

  @Query(returns => SearchResult)
  results() {
    return new SearchResult();
  }

  @Mutation(returns => String)
  public async reindex(@Args() { items }: ReIndexArgs) {
    let pathAlias = {};
    if (items) {
      pathAlias = items.reduce(
        (acc, item) => ({
          ...acc,
          [item.alias || ""]: item.path
        }),
        {}
      );
    }

    const project: Project = {
      root: process.env.projectRoot || "",
      pathAlias
    };
    await this.indexer.parse(project);
    return Status.OK;
  }

  @Query(returns => String)
  public indexingStatus() {
    return this.indexer.status;
  }

  @Query(returns => ProjectInfo)
  public project() {
    const info = new ProjectInfo();
    info.separator = sep;
    info.root = process.env.projectRoot || "";
    return info;
  }

  @Mutation(returns => SearchResult)
  public async search(@Arg("query") query: string) {
    try {
      const result = new SearchResult();
      const items = this.indexer.search(query);
      result.items = items.map(({ obj }: { obj: ESModuleItem }) => {
        const item = new GqlSymbolInformation();
        item.filePath = obj.path;
        item.kind = obj.kind;
        item.name = obj.name;
        item.id = obj.id;
        item.location = obj.location;

        return item;
      });
      return result;
    } catch (e) {
      const result = new SearchResult();
      result.errorMessage = e.stack;
      return result;
    }
  }

  @Query(returns => GqlSymbolInformation)
  public async getSymbolWithMarkers(
    @Arg("path") path: string,
    @Arg("name") name: string
  ) {
    const symbol = this.indexer.getSymbolWithMarkers(path, name);

    const item = new GqlSymbolInformation();
    if (symbol) {
      item.filePath = symbol.path;
      item.kind = symbol.kind;
      item.name = symbol.name;
      item.id = symbol.id;
      item.markers = symbol.markers;
      item.location = symbol.location;
    }

    return item;
  }

  @Query(returns => [GqlSymbolInformation])
  public async getSymbolsForActiveFile() {
    if (this.activeEditorPath) {
      return this.indexer
        .getSymbolsForPath(this.activeEditorPath)
        .map((symbol: ESModuleItem) => {
          const item = new GqlSymbolInformation();
          item.filePath = symbol.path;
          item.kind = symbol.kind;
          item.name = symbol.name;
          item.id = symbol.id;
          return item;
        });
    }
    return [];
  }

  @Query(returns => String)
  public async getCode(@Arg("path") path: string, @Arg("id") id: string) {
    return this.indexer.getCode(path, id);
  }
}
