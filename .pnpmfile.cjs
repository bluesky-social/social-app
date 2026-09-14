module.exports = {
  hooks: {
    readPackage(pkg) {
      /*
       * Oxlint loads these plugins directly. Remove their ESLint peers so
       * pnpm's autoInstallPeers does not install the unused ESLint runtime.
       */
      if (
        pkg.name === 'eslint-plugin-react-native-a11y' ||
        pkg.name === 'eslint-plugin-simple-import-sort'
      ) {
        delete pkg.peerDependencies?.eslint
      }
      return pkg
    },
  },
}
