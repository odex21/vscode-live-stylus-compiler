import * as vscode from "vscode"
import { AppModel } from "./appModel"

export function activate (context: vscode.ExtensionContext) {
  console.log('"live-stylus-compiler" is now actived! Go and Debug :P ')

  let appModel = new AppModel()

  let disposablecompileAll = vscode.commands.registerCommand(
    "liveStylus.command.watchMyStylus",
    () => {
      appModel.compileAllFiles()
    }
  )

  let disposableStopWaching = vscode.commands.registerCommand(
    "liveStylus.command.donotWatchMyStylus",
    () => {
      appModel.StopWaching()
    }
  )

  let disposableOneTimeCompileStylus = vscode.commands.registerCommand(
    "liveStylus.command.oneTimeCompileStylus",
    () => {
      appModel.compileAllFiles(false)
    }
  )

  let disposableOpenOutputWindow = vscode.commands.registerCommand(
    "liveStylus.command.openOutputWindow",
    () => {
      appModel.openOutputWindow()
    }
  )
  let disposableOnDivSave = vscode.workspace.onDidSaveTextDocument(() => {
    appModel.compileOnSave()
  })


  context.subscriptions.push(
    disposablecompileAll,
    disposableStopWaching,
    disposableOnDivSave,
    disposableOneTimeCompileStylus,
    disposableOpenOutputWindow,
    appModel,
  )
}

export function deactivate () { }
