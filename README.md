# Pointix Sheet Navigation

A lightweight companion plugin for **Obsidian + Sheet Plus** that improves spreadsheet navigation without replacing Sheet Plus.

## Stable version

**v1.1.0**

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

## Feedback

If you find a problem, please open an issue and include:
- device
- operating system
- Obsidian version
- Sheet Plus version
- expected behavior
- actual behavior
- a short screen recording when useful

## Related project

**Pointix Sheet Copy**  
https://github.com/ExplorerAS/Pointix-Sheet-Copy

---

Built to make Sheet Plus easier to navigate without getting in the way.
