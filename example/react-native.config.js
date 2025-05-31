module.exports = {
    dependencies: {
        'omikit-plugin': {
            platforms: {
                android: {
                    sourceDir: '../../android',
                    packageImportPath: 'import com.omikitplugin.OmikitPluginPackage;',
                    packageInstance: 'new OmikitPluginPackage()',
                },
                ios: {
                    podspecPath: '../../omikit-plugin.podspec',
                },
            },
        },
    },
}; 