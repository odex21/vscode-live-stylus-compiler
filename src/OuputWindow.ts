import * as vscode from "vscode";

export class OutputWindow {
  private static _msgChannel: vscode.OutputChannel;

  private static get MsgChannel() {
    if (!OutputWindow._msgChannel) {
      OutputWindow._msgChannel = vscode.window.createOutputChannel(
        "Live Stylus Compile"
      );
    }

    return OutputWindow._msgChannel;
  }

  static Show(
    msgHeadline: string | null,
    MsgBody: string[] | Error | null,
    popUpToUI: boolean = false,
    addEndLine = true
  ) {
    if (msgHeadline) {
      OutputWindow.MsgChannel.appendLine(msgHeadline);
    }

    if (MsgBody) {
      if (Array.isArray(MsgBody)) {
        MsgBody.forEach((msg) => {
          OutputWindow.MsgChannel.appendLine(msg);
        });
      } else {
        OutputWindow.MsgChannel.appendLine(MsgBody.message);
      }
    }

    if (popUpToUI) {
      OutputWindow.MsgChannel.show(true);
    }

    if (addEndLine) {
      OutputWindow.MsgChannel.appendLine("--------------------");
    }
  }

  static dispose() {
    this.MsgChannel.dispose();
  }
}
