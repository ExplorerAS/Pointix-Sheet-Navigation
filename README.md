# Pointix Sheet Navigation

A lightweight companion plugin for **Obsidian + Sheet Plus** that improves spreadsheet navigation without replacing Sheet Plus.

## Stable version

**v1.1.2**

### Touch / pen
- Drag to pan the sheet.
- Tap to select a cell.
- Double tap can hand off a copy request to the separate **Pointix Sheet Copy** plugin.

### PC / laptop / macOS
- Normal click keeps native Sheet Plus behavior.
- **Alt / Option + left-click + drag** pans the spreadsheet.

The touch/pen path and the desktop mouse path are intentionally isolated so one does not interfere with the other.

## Requirements

- Obsidian
- Sheet Plus

Optional:
- **Pointix Sheet Copy** for fast cell copying.

## Manual installation

Place this repository's plugin files in:

```
.obsidian/plugins/pointix-sheet-navigation/
```

Required files:

```
main.js
manifest.json
styles.css
```

Then enable **Pointix Sheet Navigation** in Obsidian → Settings → Community plugins.

## Why this exists

Sheet Plus is powerful, but some workflows benefit from a dedicated pan gesture, especially on touch devices and when working with large sheets.

Pointix Sheet Navigation focuses only on navigation. Clipboard behavior lives in a separate plugin so stable navigation does not need to be rewritten when copy behavior changes.

## Compatibility

Designed for:
- Windows desktops and laptops
- macOS / MacBook
- Android phones and tablets
- iPhone / iPad
- Touch screens and pen/stylus input

Input routing uses Pointer Events (`mouse`, `touch`, `pen`) rather than only OS detection.

## Support

If you find a problem, you can:

- Email **[servicios.globix@gmail.com](mailto:servicios.globix@gmail.com)**.
- Open a [GitHub issue](https://github.com/ExplorerAS/Pointix-Sheet-Navigation/issues).

Please include the device, operating system, Obsidian version, Sheet Plus version, expected behavior, actual behavior, and a short screen recording when useful. Please do not include passwords, tokens, private notes, or entire vaults in support requests.

## Support development

If Pointix Sheet Navigation is useful to you, you can voluntarily support its development:

**Ko-fi:** https://ko-fi.com/exprorerit

Support does not unlock features and is not required to use the plugin.

## Related project

**Pointix Sheet Copy**  
https://github.com/ExplorerAS/Pointix-Sheet-Copy

Pointix Sheet Copy is optional. Navigation remains focused on moving around Sheet Plus sheets, while Copy provides dedicated clipboard tools.

## License

Released under the MIT License. See [LICENSE](./LICENSE).

You are free to use, adapt and improve this code, including in your own projects. The MIT License requires keeping the notice **Copyright (c) 2026 Explorer It - Pointix** and the full license text in every copy or adapted version.

If you publish an adapted or improved version, we kindly ask you to also credit the original in a visible place, such as your README or settings screen:

> Based on [Pointix Sheet Navigation](https://github.com/ExplorerAS/Pointix-Sheet-Navigation) by Explorer It · Pointix

### Licencia y créditos

Puedes usar, adaptar y mejorar este código, incluso en tus propios proyectos. La licencia MIT exige conservar el aviso **Copyright (c) 2026 Explorer It - Pointix** y el texto completo de la licencia en cada copia o versión adaptada.

Si publicas una versión adaptada o mejorada, te pedimos dar crédito visible al original, por ejemplo en tu README o en la pantalla de ajustes:

> Basado en [Pointix Sheet Navigation](https://github.com/ExplorerAS/Pointix-Sheet-Navigation) de Explorer It · Pointix
