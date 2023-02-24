import * as vscode from "vscode"
import * as path from "path"
import * as glob from "glob"
import * as autoprefixer from "autoprefixer"
import * as postcss from "postcss"

import { FileHelper, IFileResolver } from "./FileHelper"
import { StylusHelper } from "./StylusCompileHelper"
import { OutputWindow } from "./OuputWindow"
import { Helper, IFormat } from "./helper"
import { StatusBarUi } from "./StatubarUi"
import { getBasePath } from './utils'

export class AppModel {
  isWatching: boolean

  constructor () {
    this.isWatching = false
    StatusBarUi.init()
  }



  /**
   * Compile All file with watch mode.
   * @param WatchingMode WatchingMode = false for without watch mode.
   */
  compileAllFiles (WatchingMode = true) {
    if (this.isWatching) {
      vscode.window.showInformationMessage("already watching...")
      return
    }
    StatusBarUi.working()

    let showOutputWindow = Helper.getConfigSettings<boolean>(
      "showOutputWindow"
    )

    this.GenerateAllCss(showOutputWindow).then(() => {
      if (!WatchingMode) {
        this.isWatching = true // tricky to toggle status
      }
      this.toggleStatusUI()
    })
  }

  openOutputWindow () {
    OutputWindow.Show(null, null, true)
  }

  async compileOnSave () {
    if (!this.isWatching) {
      return
    }

    let currentFile = vscode.window.activeTextEditor!.document.fileName
    if (!this.isAStylusFile(currentFile, true)) {
      return
    }
    OutputWindow.Show("Change Detected...", [ path.basename(currentFile) ])

    if (!this.isAStylusFile(currentFile)) {
      // Partial Or not
      this.GenerateAllCss(false).then(() => {
        OutputWindow.Show("Watching...", null)
      })
    } else {
      let formats = Helper.getConfigSettings<IFormat[]>("formats")
      let stylusPath = currentFile
      formats.forEach((format) => {
        // Each format
        let cssMapPath = this.generateCssUri(
          stylusPath,
          format.savePath,
          format.extensionName
        )
        this.generateCss(stylusPath, cssMapPath.css).then(() => {
          OutputWindow.Show("Watching...", null)
        })
      })
    }
  }

  StopWaching () {
    if (this.isWatching) {
      this.toggleStatusUI()
    } else {
      vscode.window.showInformationMessage("not watching...")
    }
  }

  private toggleStatusUI () {
    this.isWatching = !this.isWatching
    let showOutputWindow = Helper.getConfigSettings<boolean>(
      "showOutputWindow"
    )

    if (!this.isWatching) {
      StatusBarUi.notWatching()
      OutputWindow.Show("Not Watching...", null, showOutputWindow)
    } else {
      StatusBarUi.watching()
      OutputWindow.Show("Watching...", null, showOutputWindow)
    }
  }

  isAStylusFile (pathUrl: string, partialStylus = false): boolean {
    const filename = path.basename(pathUrl)
    return (
      (partialStylus || !filename.startsWith("_")) &&
      (filename.endsWith("styl") || filename.endsWith("stylus"))
    )
  }

  getStylusFiles (queryPatten = "**/[^_]*.styl[us]"): Thenable<string[]> {
    let excludedList = Helper.getConfigSettings<string[]>("excludeList")
    let includeItems = Helper.getConfigSettings<string[] | null>(
      "includeItems"
    )

    let options = {
      ignore: excludedList,
      mark: true,
      cwd: getBasePath(),
    }

    if (includeItems && includeItems.length) {
      if (includeItems.length === 1) {
        queryPatten = includeItems[ 0 ]
      } else {
        queryPatten = `{${includeItems.join(",")}}`
      }
    }

    return new Promise((resolve) => {
      glob(queryPatten, options, (err, files: string[]) => {
        if (err) {
          OutputWindow.Show("Error To Seach Files", err, true)
          resolve([])
          return
        }
        const filePaths = files
          .filter((file) => this.isAStylusFile(file))
          .map((file) => path.join(getBasePath(), file))
        return resolve(filePaths || [])
      })
    })
  }

  /**
   * [Deprecated]
   * Find ALL Stylus from workspace & It also exclude Stylus from exclude list settings
   * @param callback - callback(filepaths) with be called with Uri(s) of Stylus(s) (string[]).
   */
  private findAllStylusFilesAsync (callback: Function) {
    this.getStylusFiles().then((files) => callback(files))
  }

  /**
   * To Generate one One Css & Map file from Stylus
   * @param stylusPath Stylus file URI (string)
   * @param targetCssUri Target CSS file URI (string)
   * @param mapFileUri Target MAP file URI (string)
   * @param options - Object - It includes target CSS style and some more.
   */
  private generateCss<T extends object> (
    stylusPath: string,
    targetCssUri: string
  ) {
    let showOutputWindow = Helper.getConfigSettings<boolean>(
      "showOutputWindow"
    )

    return new Promise((resolve) => {
      StylusHelper.instance.compileOne(stylusPath).then(async (result) => {
        if (result.status !== 0) {
          OutputWindow.Show(
            "Compilation Error",
            [ result.formatted, result.text ],
            showOutputWindow
          )
          StatusBarUi.compilationError(this.isWatching)

          if (!showOutputWindow) {
            vscode.window.setStatusBarMessage(
              (result.formatted || "").split("\n")[ 0 ],
              4500
            )
          }

          resolve(true)
        } else {
          let promises: Promise<IFileResolver>[] = []

          result.text = await this.autoprefix(result.text)

          promises.push(
            FileHelper.Instance.writeToOneFile(targetCssUri, `${result.text}`)
          )

          Promise.all(promises).then((fileResolvers) => {
            OutputWindow.Show("Generated :", null, false, false)
            StatusBarUi.compilationSuccess(this.isWatching)
            fileResolvers.forEach((fileResolver) => {
              if (fileResolver.Exception) {
                OutputWindow.Show(
                  "Error:",
                  [
                    fileResolver.Exception.errno!.toString(),
                    fileResolver.Exception.path!,
                    fileResolver.Exception.message,
                  ],
                  true
                )
                console.error("error :", fileResolver)
              } else {
                OutputWindow.Show(null, [ fileResolver.FileUri ], false, false)
              }
            })
            OutputWindow.Show(null, null, false, true)
            resolve(true)
          })
        }
      })
    })
  }

  /**
   * To compile all Stylus files
   * @param popUpOutputWindow To control output window.
   */
  private GenerateAllCss (popUpOutputWindow: boolean) {
    let formats = Helper.getConfigSettings<IFormat[]>("formats")

    return new Promise((resolve) => {
      this.findAllStylusFilesAsync((stylusPaths: string[]) => {
        OutputWindow.Show(
          "Compiling Stylus Files: ",
          stylusPaths,
          popUpOutputWindow
        )
        let promises: Promise<unknown>[] = []
        stylusPaths.forEach((stylusPath) => {
          formats.forEach((format) => {
            // Each format
            let cssMapUri = this.generateCssUri(
              stylusPath,
              format.savePath,
              format.extensionName
            )
            promises.push(this.generateCss(stylusPath, cssMapUri.css))
          })
        })

        Promise.all(promises).then((e) => resolve(e))
      })
    })
  }

  private generateCssUri (
    filePath: string,
    savePath: string,
    _extensionName?: string
  ) {
    let extensionName = _extensionName || ".css" // Helper.getConfigSettings<string>('extensionName');

    // If SavePath is NULL, CSS uri will be same location of Stylus.
    if (savePath) {
      try {
        let workspaceRoot = vscode.workspace.rootPath || ""
        let generatedUri = null

        if (savePath.startsWith("~")) {
          generatedUri = path.join(
            path.dirname(filePath),
            savePath.substring(1)
          )
        } else {
          generatedUri = path.join(workspaceRoot, savePath)
        }

        FileHelper.Instance.MakeDirIfNotAvailable(generatedUri)

        filePath = path.join(generatedUri, path.basename(filePath))
      } catch (err) {
        console.log(err)

        OutputWindow.Show(
          "Error:",
          [ err.errno.toString(), err.path, err.message ],
          true
        )

        throw Error("Something Went Wrong.")
      }
    }

    let cssUri =
      filePath.substring(0, filePath.lastIndexOf(".")) + extensionName
    return {
      css: cssUri,
    }
  }

  /**
   * Autoprefixes CSS properties
   *
   * @param css String representation of CSS to transform
   * @param target What browsers to be targeted, as supported by [Browserslist](https://github.com/ai/browserslist)
   */
  private async autoprefix (css: string): Promise<string> {
    let showOutputWindow = Helper.getConfigSettings<boolean>(
      "showOutputWindow"
    )
    const prefixer = postcss([
      autoprefixer({
        grid: "autoplace",
      }),
    ])

    return await prefixer.process(css, { from: undefined }).then((res) => {
      res.warnings().forEach((warn) => {
        OutputWindow.Show("Autoprefix Error", [ warn.text ], showOutputWindow)
      })
      return res.css
    })
  }

  dispose () {
    StatusBarUi.dispose()
    OutputWindow.dispose()
  }
}
