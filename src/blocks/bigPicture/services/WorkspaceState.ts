import vscode from "vscode";
import { Events } from "../Events";
import { WebviewMessageEvent } from "common/types";

export class WorkspaceState {
  constructor(
    public webview: vscode.Webview,
    public context: vscode.ExtensionContext
  ) {
    webview.onDidReceiveMessage((event: WebviewMessageEvent) => {
      if (event.type === Events.GetWorkspaceState) {
        const state = context.workspaceState.get("InsightWorkspaceState");
        webview.postMessage({
          type: Events.GetWorkspaceState,
          payload: state
        });
      } else if (event.type === Events.SaveWorkspaceState) {
        context.workspaceState.update("InsightWorkspaceState", event.payload);
      }
    }, context.subscriptions);
  }
}
