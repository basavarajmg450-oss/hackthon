## Root Cause
- The build shows many “Failed to parse source map … html5-qrcode … .ts” warnings.
- These come from `html5-qrcode` shipping JS files with sourcemap references to TypeScript sources that aren’t present.
- CRA (via `source-map-loader`) tries to read those maps and logs warnings; they don’t break the app but clutter the console.

## Fix Options
1. Exclude `html5-qrcode` from `source-map-loader` in webpack (recommended).
2. Ignore these warnings via webpack `ignoreWarnings`.
3. Update/downgrade `html5-qrcode` to a version with corrected sourcemaps (optional if 1–2 suffice).

## Implementation (CRACO)
- Edit `frontend/craco.config.js` to customize CRA’s webpack:

### A) Exclude `html5-qrcode` from source-map-loader
- In `webpack.configure`, find the rule using `source-map-loader` and add an `exclude`:

```js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // existing config …
      const rules = webpackConfig.module.rules || [];
      const sourceMapRule = rules.find(r => r.enforce === 'pre' && r.use && r.use.some(u => (u.loader || u).includes('source-map-loader')));
      if (sourceMapRule) {
        sourceMapRule.exclude = [...(sourceMapRule.exclude || []), /node_modules\/html5-qrcode/];
      }
      return webpackConfig;
    }
  }
};
```

### B) Ignore specific warnings (optional, belt-and-braces)
- Add `ignoreWarnings` to silence remaining warnings from this package:

```js
webpackConfig.ignoreWarnings = [
  (warning) => {
    const msg = warning.message || '';
    return /html5-qrcode/.test(msg) && /Failed to parse source map/.test(msg);
  }
];
```

## Steps to Apply
1. Update `craco.config.js` with A (and optionally B).
2. Restart frontend: PowerShell `Stop` the dev server if running, then `$env:PORT=3001; npm start`.
3. Confirm the dev server compiles without the 23 sourcemap warnings.

## Verification
- Terminal should show “Starting the development server…” then compile with no `source-map-loader` warnings.
- QR-related features still work; this change only affects sourcemap handling.

## Alternative
- Upgrade `html5-qrcode` to the latest patch release or pin to a version known without sourcemap issues, then reinstall dependencies.
- This may also eliminate warnings, but the webpack exclusion is a stable fix and avoids dependency churn.

## Rollback
- Remove the `exclude` and `ignoreWarnings` changes from `craco.config.js` to restore default CRA behavior if needed.

## Next Step
- Confirm, and I’ll apply the CRACO config changes, restart the dev server, and verify the warnings are gone.