import * as Stylus from "stylus"
import * as fs from "fs"
import { getBasePath } from './utils'


export class StylusHelper {
  static get instance () {
    return new StylusHelper()
  }

  async getCustomConfig () {
    const base = getBasePath()
    const fn = await import(base + '/.liveStylusConfig.js')
      .catch(err => {
        console.error(err)
        console.log('import config fail')
      })
    return fn
  }

  compileOne (stylusPath: string) {
    return new Promise<any>(async (resolve, reject) => {
      const config = await this.getCustomConfig()
      const str = fs.readFileSync(stylusPath, "utf8")
      const instance = Stylus(str)
      if (config?.set) {
        instance.use(config.set)
      }

      instance.render((error, css) => {
        const result = {
          text: "",
          formatted: "",
          status: 0,
        }
        if (error) {
          result.formatted = error.name
          result.text = `/* \n Error: ${error.message} \n */`
          result.status = 1
        } else {
          result.text = css
        }
        resolve(result)
      })
    })
  }

  compileMultiple (stylusPaths: string[]) {
    return new Promise<any[]>((resolve, reject) => {
      let promises: Promise<{}>[] = []

      stylusPaths.forEach((stylusPath) => {
        promises.push(this.compileOne(stylusPath))
      })

      Promise.all(promises).then((results) => resolve(results))
    })
  }
}
