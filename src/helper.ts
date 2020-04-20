import * as vscode from "vscode";

export interface IFormat {
  extensionName: string;
  savePath: string;
}

export class Helper {
  private static get configSettings() {
    return vscode.workspace.getConfiguration("stylusCompile.settings");
  }

  static getConfigSettings<T>(val: string): T {
    return this.configSettings.get(val) as T;
  }
}
