// Entry point Expo looks for when a consuming app references "omikit-plugin"
// in its app.json "plugins" array. Re-exports the compiled config plugin.
module.exports = require('./plugin/build');
