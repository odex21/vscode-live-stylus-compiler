# live-stylus-compiler README

A ext like live sass compiler but a stylus ver.

## Features

- Live Stylus Compile.  
- Use with Stylus 's JS API!  
- Customizable file location of exported CSS.  
- Customizable extension name (.css or .wxss).  
- Quick Status bar control.  
- Exclude Specific Folders by settings.  
- Live Reload to browser (Dependency on Live Server extension).  
- Autoprefix Supported (See setting section)  

## Extension Settings

You can create a file name .liveStylusConfig.js in root path that export a fn like:

```js
const set = (stylus) => {
  stylus.define("odex", "red");
};

module.exports = {
  set,
};
```

And the fn will be used in

```js
const config = await this.getCustomConfig();
const str = fs.readFileSync(stylusPath, "utf8");

const instance = Stylus(str);
if (config?.set) {
  instance.use(config.set);
}
```

> Tip: More JS API of Stylus can see in [https://github.com/stylus/stylus/blob/dev/docs/js.md]

This extension contributes the following settings:

- `myExtension.formats`: `[{extensionName: '.wxss', savePath: null}]`

Find more in settings.

## Known Issues

Nothing.

## Release Notes

Nothing.

### 0.0.1

### 0.0.4 

- feat: log error message
...
