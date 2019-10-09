import {
  Arg,
  Mutation,
  Query,
  Resolver,
  Subscription,
  Root
} from "type-graphql";
import { ContainerInstance, Service } from "typedi";

import Indexer from "indexer/Indexer";
import Project from "indexer/Project";
import { pubSub } from "common/pubSub";
import { Status } from "./Status";
import { SearchResult } from "../../entities/SearchResult";
import { Flake } from "entities/Symbol";

@Service()
@Resolver(SearchResult)
export default class SymbolsResolver {
  constructor(
    private readonly container: ContainerInstance,
    private readonly indexer: Indexer
  ) {}

  @Query(returns => SearchResult)
  results() {
    return new SearchResult();
  }

  @Mutation(returns => String)
  public async reindex() {
    const project: Project = {
      root: process.env.projectRoot || ""
    };
    await this.indexer.parse(project);
    return Status.OK;
  }

  @Mutation(returns => SearchResult)
  public search(
    @Arg("query") query: string,
    @Arg("selector") selector: string
  ) {
    const symbols: Flake[] = [];
    const categories: Set<String> = new Set();

    const selectorFn = eval(`(${selector})`);

    Object.entries(this.indexer.files).forEach(([path, file]) => {
      const selectorResult = selectorFn(path);
      categories.add(selectorResult.category);

      file.classes
        .filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
        .forEach(classSymbol => {
          if (selectorResult.include) {
            symbols.push({
              id: classSymbol.id,
              exportStatus: classSymbol.exportStatus,
              filePath: path,
              name: classSymbol.name,
              type: "class",
              category: selectorResult.category,
              location: classSymbol.location
            });
          }
        });

      file.functions
        .filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
        .forEach(functionSymbol => {
          if (selectorResult.include) {
            symbols.push({
              id: functionSymbol.id,
              exportStatus: functionSymbol.exportStatus,
              filePath: path,
              name: functionSymbol.name,
              type: "function",
              category: selectorResult.category,
              location: functionSymbol.location
            });
          }
        });

      file.variables
        .filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
        .forEach(variableSymbol => {
          if (selectorResult.include) {
            symbols.push({
              id: variableSymbol.id,
              exportStatus: variableSymbol.exportStatus,
              filePath: path,
              name: variableSymbol.name,
              type: "variable",
              category: selectorResult.category,
              location: variableSymbol.location
            });
          }
        });
    });

    const result = new SearchResult();
    result.items = symbols;
    result.categories = Array.from(categories);

    return result;
  }
}