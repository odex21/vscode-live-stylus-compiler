import * as vscode from "vscode"
import * as path from "path"

const getBasePath = () => {
  return (
    vscode.workspace.rootPath ||
    path.basename(vscode.window.activeTextEditor!.document.fileName)
  )
}

export {
  getBasePath
}
