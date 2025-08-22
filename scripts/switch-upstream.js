/**
 * Switches all @atproto/@atproto-labs imports to @gander-social-atproto/@gander-atproto-nest (or vice versa),
 * updates package.json dependencies, named imports/types, and literal string references.
 * Usage: node switch-upstream.js [atproto|gander]
 */
const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');
const semver = require('semver');
const PROJECT_ROOT = process.cwd();
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_DIRS = [
    'node_modules', 'build', 'dist', 'vendor', 'assets', 'android', 'ios', 'web', '__tests__', '__mocks__', '__e2e__'
];
const SRC_FOLDERS = [
    'src', 'gndrembed', 'gndrlink', 'gndrogcard', 'modules'
];

function getUpstreamMap(upstream) {
    if (upstream === 'gander') {
        return {
            '@atproto/api': '@gander-social-atproto/api',
            '@atproto/common': '@gander-social-atproto/common',
            '@atproto/common-web': '@gander-social-atproto/common-web',
            '@atproto/crypto': '@gander-social-atproto/crypto',
            '@atproto/syntax': '@gander-social-atproto/syntax',
            '@atproto/core': '@gander-social-atproto/core',
            '@atproto/did-resolver': '@gander-social-atproto/did-resolver',
            '@atproto/lexicon': '@gander-social-atproto/lexicon',
            '@atproto/lex-cli': '@gander-social-atproto/lex-cli',
            '@atproto/identity': '@gander-social-atproto/identity',
            '@atproto/did': '@gander-social-atproto/did',
            '@atproto/pds': '@gander-social-atproto/pds',
            '@atproto/plc': '@gander-social-atproto/plc',
            '@atproto/repo': '@gander-social-atproto/repo',
            '@atproto/aws': '@gander-social-atproto/aws',
            '@atproto/server': '@gander-social-atproto/server',
            '@atproto/bsync': '@gander-social-atproto/bsync',
            '@atproto/ozone': '@gander-social-atproto/ozone',
            '@atproto/sync': '@gander-social-atproto/sync',
            '@atproto/bsky': '@gander-social-atproto/gndr',
            '@atproto/xrpc': '@gander-social-atproto/xrpc',
            '@atproto/jwk': '@gander-social-atproto/jwk',
            '@atproto/jwk-jose': '@gander-social-atproto/jwk-jose',
            '@atproto/jwk-webcrypto': '@gander-social-atproto/jwk-webcrypto',
            '@atproto/oauth-client': '@gander-social-atproto/oauth-client',
            '@atproto/oauth-client-browser': '@gander-social-atproto/oauth-client-browser',
            '@atproto/oauth-client-browser-example': '@gander-social-atproto/oauth-client-browser-example',
            '@atproto/oauth-client-node': '@gander-social-atproto/oauth-client-node',
            '@atproto/oauth-provider': '@gander-social-atproto/oauth-provider',
            '@atproto/oauth-provider-api': '@gander-social-atproto/oauth-provider-api',
            '@atproto/oauth-provider-frontend': '@gander-social-atproto/oauth-provider-frontend',
            '@atproto/oauth-types': '@gander-social-atproto/oauth-types',
            '@atproto/xrpc-server': '@gander-social-atproto/xrpc-server',
            '@atproto/dev-env': '@gander-social-atproto/dev-env',
            '@atproto-labs/xrpc-utils': '@gander-atproto-nest/xrpc-utils',
            '@atproto-labs/simple-store': '@gander-atproto-nest/simple-store',
            '@atproto-labs/simple-store-memory': '@gander-atproto-nest/simple-store-memory',
            '@atproto-labs/rollup-plugin-bundle-manifest': '@gander-atproto-nest/rollup-plugin-bundle-manifest',
            '@atproto-labs/pipe': '@gander-atproto-nest/pipe',
            '@atproto-labs/handle-resolver': '@gander-atproto-nest/handle-resolver',
            '@atproto-labs/fetch': '@gander-atproto-nest/fetch',
            '@atproto-labs/fetch-node': '@gander-atproto-nest/fetch-node',
            '@atproto-labs/handle-resolver-node': '@gander-atproto-nest/handle-resolver-node',
            '@atproto-labs/did-resolver': '@gander-atproto-nest/did-resolver',
            '@atproto-labs/identity-resolver': '@gander-atproto-nest/identity-resolver',
        }
    } else {
        return {
            '@gander-social-atproto/api': '@atproto/api',
            '@gander-social-atproto/common': '@atproto/common',
            '@gander-social-atproto/common-web': '@atproto/common-web',
            '@gander-social-atproto/crypto': '@atproto/crypto',
            '@gander-social-atproto/syntax': '@atproto/syntax',
            '@gander-social-atproto/core': '@atproto/core',
            '@gander-social-atproto/did-resolver': '@atproto/did-resolver',
            '@gander-social-atproto/lexicon': '@atproto/lexicon',
            '@gander-social-atproto/lex-cli': '@atproto/lex-cli',
            '@gander-social-atproto/identity': '@atproto/identity',
            '@gander-social-atproto/did': '@atproto/did',
            '@gander-social-atproto/pds': '@atproto/pds',
            '@gander-social-atproto/plc': '@atproto/plc',
            '@gander-social-atproto/repo': '@atproto/repo',
            '@gander-social-atproto/aws': '@atproto/aws',
            '@gander-social-atproto/server': '@atproto/server',
            '@gander-social-atproto/bsync': '@atproto/bsync',
            '@gander-social-atproto/ozone': '@atproto/ozone',
            '@gander-social-atproto/sync': '@atproto/sync',
            '@gander-social-atproto/gndr': '@atproto/bsky',
            '@gander-social-atproto/xrpc': '@atproto/xrpc',
            '@gander-social-atproto/jwk': '@atproto/jwk',
            '@gander-social-atproto/jwk-jose': '@atproto/jwk-jose',
            '@gander-social-atproto/jwk-webcrypto': '@atproto/jwk-webcrypto',
            '@gander-social-atproto/oauth-client': '@atproto/oauth-client',
            '@gander-social-atproto/oauth-client-browser': '@atproto/oauth-client-browser',
            '@gander-social-atproto/oauth-client-browser-example': '@atproto/oauth-client-browser-example',
            '@gander-social-atproto/oauth-client-node': '@atproto/oauth-client-node',
            '@gander-social-atproto/oauth-provider': '@atproto/oauth-provider',
            '@gander-social-atproto/oauth-provider-api': '@atproto/oauth-provider-api',
            '@gander-social-atproto/oauth-provider-frontend': '@atproto/oauth-provider-frontend',
            '@gander-social-atproto/oauth-types': '@atproto/oauth-types',
            '@gander-social-atproto/xrpc-server': '@atproto/xrpc-server',
            '@gander-social-atproto/dev-env': '@atproto/dev-env',
            '@gander-atproto-nest/xrpc-utils': '@atproto-labs/xrpc-utils',
            '@gander-atproto-nest/simple-store': '@atproto-labs/simple-store',
            '@gander-atproto-nest/simple-store-memory': '@atproto-labs/simple-store-memory',
            '@gander-atproto-nest/rollup-plugin-bundle-manifest': '@atproto-labs/rollup-plugin-bundle-manifest',
            '@gander-atproto-nest/pipe': '@atproto-labs/pipe',
            '@gander-atproto-nest/handle-resolver': '@atproto-labs/handle-resolver',
            '@gander-atproto-nest/fetch': '@atproto-labs/fetch',
            '@gander-atproto-nest/fetch-node': '@atproto-labs/fetch-node',
            '@gander-atproto-nest/handle-resolver-node': '@atproto-labs/handle-resolver-node',
            '@gander-atproto-nest/did-resolver': '@atproto-labs/did-resolver',
            '@gander-atproto-nest/identity-resolver': '@atproto-labs/identity-resolver',
        }
    }
}

const typeNameMap = {
    AppBskyActorDefs: 'AppGndrActorDefs',
    AppBskyActorGetProfile: 'AppGndrActorGetProfile',
    AppBskyActorGetProfiles: 'AppGndrActorGetProfiles',
    AppBskyActorProfile: 'AppGndrActorProfile',
    AppBskyActorSearchActors: 'AppGndrActorSearchActors',
    AppBskyEmbedExternal: 'AppGndrEmbedExternal',
    AppBskyEmbedImages: 'AppGndrEmbedImages',
    AppBskyEmbedRecord: 'AppGndrEmbedRecord',
    AppBskyEmbedRecordWithMedia: 'AppGndrEmbedRecordWithMedia',
    AppBskyEmbedVideo: 'AppGndrEmbedVideo',
    AppBskyFeedDefs: 'AppGndrFeedDefs',
    AppBskyFeedGetActorFeeds: 'AppGndrFeedGetActorFeeds',
    AppBskyFeedGetAuthorFeed: 'AppGndrFeedGetAuthorFeed',
    AppBskyFeedGetCustomFeed: 'AppGndrFeedGetCustomFeed',
    AppBskyFeedGetFeed: 'AppGndrFeedGetFeed',
    AppBskyFeedGetLikes: 'AppGndrFeedGetLikes',
    AppBskyFeedGetListFeed: 'AppGndrFeedGetListFeed',
    AppBskyFeedGetPosts: 'AppGndrFeedGetPosts',
    AppBskyFeedGetQuotes: 'AppGndrFeedGetQuotes',
    AppBskyFeedGetRepostedBy: 'AppGndrFeedGetRepostedBy',
    AppBskyFeedGetSuggestedFeeds: 'AppGndrFeedGetSuggestedFeeds',
    AppBskyFeedGetTimeline: 'AppGndrFeedGetTimeline',
    AppBskyFeedLike: 'AppGndrFeedLike',
    AppBskyFeedPost: 'AppGndrFeedPost',
    AppBskyFeedPosts: 'AppGndrFeedPosts',
    AppBskyFeedRepost: 'AppGndrFeedRepost',
    AppBskyFeedThreadgate: 'AppGndrFeedThreadgate',
    AppBskyGraphDefs: 'AppGndrGraphDefs',
    AppBskyGraphFollow: 'AppGndrGraphFollow',
    AppBskyGraphGetActorStarterPacks: 'AppGndrGraphGetActorStarterPacks',
    AppBskyGraphGetBlocks: 'AppGndrGraphGetBlocks',
    AppBskyGraphGetFollowers: 'AppGndrGraphGetFollowers',
    AppBskyGraphGetFollows: 'AppGndrGraphGetFollows',
    AppBskyGraphGetKnownFollowers: 'AppGndrGraphGetKnownFollowers',
    AppBskyGraphGetList: 'AppGndrGraphGetList',
    AppBskyGraphGetLists: 'AppGndrGraphGetLists',
    AppBskyGraphGetMutes: 'AppGndrGraphGetMutes',
    AppBskyGraphGetStarterPack: 'AppGndrGraphGetStarterPack',
    AppBskyGraphList: 'AppGndrGraphList',
    AppBskyGraphStarterpack: 'AppGndrGraphStarterpack',
    AppBskyLabelerDefs: 'AppGndrLabelerDefs',
    AppBskyNotificationDeclaration: 'AppGndrNotificationDeclaration',
    AppBskyNotificationDefs: 'AppGndrNotificationDefs',
    AppBskyNotificationListActivitySubscriptions: 'AppGndrNotificationListActivitySubscriptions',
    AppBskyNotificationListNotifications: 'AppGndrNotificationListNotifications',
    AppBskyRichtextFacet: 'AppGndrRichtextFacet',
    AppBskyUnspeccedDefs: 'AppGndrUnspeccedDefs',
    AppBskyUnspeccedGetPostThreadOtherV2: 'AppGndrUnspeccedGetPostThreadOtherV2',
    AppBskyUnspeccedGetPostThreadV2: 'AppGndrUnspeccedGetPostThreadV2',
    AppBskyUnspeccedInitAgeAssurance: 'AppGndrUnspeccedInitAgeAssurance',
    AppBskyVideoDefs: 'AppGndrVideoDefs',
    AppBskyFeedSearchPosts: 'AppGndrFeedSearchPosts',
    AppBskyUnspeccedGetPopularFeedGenerators: 'AppGndrUnspeccedGetPopularFeedGenerators',
    BskyAgent: 'GndrAgent',
    BSKY_APP_ACCOUNT_DID: 'GNDR_APP_ACCOUNT_DID',
    BSKY_DOWNLOAD_URL: 'GNDR_DOWNLOAD_URL',
    BSKY_FEED_OWNER_DIDS: 'GNDR_FEED_OWNER_DIDS',
    BSKY_SERVICE: 'GNDR_SERVICE',
    BSKY_PUBLIC_SERVICE: 'PUBLIC_GNDR_SERVICE',
    BSKY_STORAGE: 'GNDR_STORAGE',
    BSKY_TRUSTED_HOSTS: 'GNDR_TRUSTED_HOSTS',
    BSKY_APP_HOST: 'GNDR_APP_HOST',
    BSKY_LABELER_DID: 'GNDR_LABELER_DID'
};

const literalStringMap = {
    'app.bsky.': 'app.gndr.',
    'app.gndr.': 'app.bsky.',
};

function processFile(filePath, upstreamMap, typeNameMap, literalStringMap, direction) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Upstream package renaming
    for (const [from, to] of Object.entries(upstreamMap)) {
        if (content.includes(from)) {
            content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
            changed = true;
        }
    }

    // Type name handling (import statements)
    if (direction === 'atproto') {
        // Update import statements for type casts, including 'type' keyword
        content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['\"]([^'\"]+)['\"]/g, (match, imports, fromPath) => {
            let newImports = imports.split(',').map(imp => {
                imp = imp.trim();
                // Handle 'type' keyword
                const typeMatch = imp.match(/^(type\s+)?(\w+)$/);
                if (typeMatch) {
                    const typeKeyword = typeMatch[1] || '';
                    const typeName = typeMatch[2];
                    for (const [fromType, toType] of Object.entries(typeNameMap)) {
                        if (typeName === toType) {
                            return `${typeKeyword}${fromType} as ${toType}`.trim();
                        }
                    }
                }
                return imp;
            }).join(', ');
            return `import { ${newImports} } from '${fromPath}'`;
        });
        changed = true;
    } else if (direction === 'gander') {
        // Remove cast in import statements, including 'type' keyword
        content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['\"]([^'\"]+)['\"]/g, (match, imports, fromPath) => {
            let newImports = imports.split(',').map(imp => {
                imp = imp.trim();
                // Handle 'type' keyword
                const typeMatch = imp.match(/^(type\s+)?(\w+)\s+as\s+(\w+)$/);
                if (typeMatch) {
                    const typeKeyword = typeMatch[1] || '';
                    const fromType = typeMatch[2];
                    const toType = typeMatch[3];
                    for (const [bskyType, gndrType] of Object.entries(typeNameMap)) {
                        if (fromType === bskyType && toType === gndrType) {
                            return `${typeKeyword}${gndrType}`.trim();
                        }
                    }
                }
                return imp;
            }).join(', ');
            return `import { ${newImports} } from '${fromPath}'`;
        });
        changed = true;
    }

    // All-uppercase constant replacements
    for (const [fromType, toType] of Object.entries(typeNameMap)) {
        // Only process if both are all uppercase
        if (/^[A-Z0-9_]+$/.test(fromType) && /^[A-Z0-9_]+$/.test(toType)) {
            if (direction === 'atproto') {
                // Replace GNDR_* with BSKY_*
                if (content.includes(toType)) {
                    content = content.replace(new RegExp(`\\b${toType}\\b`, 'g'), fromType);
                    changed = true;
                }
            } else if (direction === 'gander') {
                // Replace BSKY_* with GNDR_*
                if (content.includes(fromType)) {
                    content = content.replace(new RegExp(`\\b${fromType}\\b`, 'g'), toType);
                    changed = true;
                }
            }
        }
    }

    // Literal string replacements
    for (const [from, to] of Object.entries(literalStringMap)) {
        if (direction === 'gander' && from === 'app.bsky.') {
            content = content.replace(new RegExp(from, 'g'), to);
            changed = true;
        } else if (direction === 'atproto' && from === 'app.gndr.') {
            content = content.replace(new RegExp(from, 'g'), to);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function getAvailableVersions(pkg) {
    try {
        const result = execSync(`npm view ${pkg} versions --json`, {
            encoding: 'utf8',
        });
        return JSON.parse(result);
    } catch (e) {
        return [];
    }
}

function findClosestVersion(currentVersion, availableVersions) {
    if (!semver.valid(currentVersion))
        return availableVersions[availableVersions.length - 1];
    let closest = availableVersions[0];
    let minDiff = Infinity;
    for (const v of availableVersions) {
        if (!semver.valid(v)) continue;
        const diff = Math.abs(
            semver.diff(currentVersion, v) === null
                ? 0
                : semver.compare(currentVersion, v),
        );
        if (diff < minDiff) {
            minDiff = diff;
            closest = v;
        }
    }
    return closest;
}

function updatePackageJson(upstream, versionStrategy) {
    // Always include the root package.json
    const rootPkgPath = path.join(PROJECT_ROOT, 'package.json');
    let allPkgPaths = [rootPkgPath];
    // Scan only SRC_FOLDERS for additional package.json files
    function findPackageJsonsInFolders(folders) {
        let results = [];
        for (const folder of folders) {
            const absFolder = path.join(PROJECT_ROOT, folder);
            if (!fs.existsSync(absFolder)) continue;
            function walk(dir) {
                for (const entry of fs.readdirSync(dir)) {
                    const fullPath = path.join(dir, entry);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        if (!EXCLUDE_DIRS.includes(entry)) walk(fullPath);
                    } else if (entry === 'package.json') {
                        results.push(fullPath);
                    }
                }
            }
            walk(absFolder);
        }
        return results;
    }
    allPkgPaths = allPkgPaths.concat(findPackageJsonsInFolders(SRC_FOLDERS));
    const upstreamMap = getUpstreamMap(upstream);
    // Also build a reverse map for switching back
    const reverseMap = {};
    for (const [from, to] of Object.entries(upstreamMap)) {
        reverseMap[to] = from;
    }
    let updatedFiles = [];
    let rootPkgChanged = false;
    for (const pkgPath of allPkgPaths) {
        try {
            console.log(`[switch-upstream] Processing: ${pkgPath}`);
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            let changed = false;
            const depFields = [
                'dependencies',
                'devDependencies',
                'peerDependencies',
                'optionalDependencies',
            ];
            for (const field of depFields) {
                if (!pkg[field]) continue;
                const depsToUpdate = Object.keys(pkg[field]);
                for (const dep of depsToUpdate) {
                    let newDep = null;
                    // Forward switch (atproto -> gander)
                    if (upstream === 'gander') {
                        for (const [from, to] of Object.entries(upstreamMap)) {
                            if (dep === from || dep.startsWith(from + '/')) {
                                newDep = dep.replace(from, to);
                                break;
                            }
                        }
                    }
                    // Reverse switch (gander -> atproto)
                    else {
                        for (const [to, from] of Object.entries(reverseMap)) {
                            if (dep === to || dep.startsWith(to + '/')) {
                                newDep = dep.replace(to, from);
                                break;
                            }
                        }
                    }
                    if (newDep && newDep !== dep) {
                        const currentVersion = pkg[field][dep];
                        const availableVersions = getAvailableVersions(newDep);
                        let selectedVersion = availableVersions[availableVersions.length - 1];
                        if (versionStrategy === 'closest' && semver.valid(currentVersion)) {
                            selectedVersion = findClosestVersion(
                                currentVersion,
                                availableVersions,
                            );
                        }
                        pkg[field][newDep] = selectedVersion;
                        delete pkg[field][dep];
                        changed = true;
                        if (pkgPath === rootPkgPath) rootPkgChanged = true;
                        console.log(
                            `[switch-upstream] Updated dependency in ${pkgPath}: ${dep}@${currentVersion} -> ${newDep}@${selectedVersion}`,
                        );
                    }
                }
            }
            if (changed) {
                fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
                updatedFiles.push(pkgPath);
                console.log(`[switch-upstream] package.json dependencies updated for upstream: ${upstream} in ${pkgPath}`);
            } else if (pkgPath === rootPkgPath) {
                console.log('[switch-upstream] No relevant dependencies found in root package.json. No changes made.');
            }
        } catch (err) {
            console.error(`[switch-upstream] Error processing ${pkgPath}:`, err);
        }
    }
    if (updatedFiles.length === 0) {
        console.log('[switch-upstream] No package.json files were updated.');
    } else {
        console.log(`[switch-upstream] Updated package.json files: ${updatedFiles.join(', ')}`);
    }
    if (!rootPkgChanged) {
        console.log('[switch-upstream] Root package.json was not changed.');
    }
}

function main() {
    const direction = process.argv[2];
    if (!['atproto', 'gander'].includes(direction)) {
        console.error('Usage: node switch-upstream.js [atproto|gander]');
        process.exit(1);
    }
    const upstreamMap = getUpstreamMap(direction);
    const literalMap = direction === 'gander'
        ? {'app.bsky.': 'app.gndr.'}
        : {'app.gndr.': 'app.bsky.'};
    const versionStrategy = process.env.UPSTREAM_VERSION_STRATEGY || 'closest';

    for (const folder of SRC_FOLDERS) {
        const absFolder = path.join(PROJECT_ROOT, folder);
        if (fs.existsSync(absFolder)) {
            function walk(dir) {
                for (const entry of fs.readdirSync(dir)) {
                    const fullPath = path.join(dir, entry);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        if (!EXCLUDE_DIRS.includes(entry)) walk(fullPath);
                    } else if (FILE_EXTENSIONS.includes(path.extname(fullPath))) {
                        processFile(fullPath, upstreamMap, typeNameMap, literalMap, direction);
                    }
                }
            }
            walk(absFolder);
        }
    }
    updatePackageJson(direction, versionStrategy);
    console.log(`Switch complete: ${direction}`);
}

main();
