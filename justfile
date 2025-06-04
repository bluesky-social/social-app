export PATH := "./node_modules/.bin:" + env_var('PATH')

# lots of just -> yarn, but this lets us chain yarn command deps

[group('dist')]
dist-build-web: intl build-web

[group('dist')]
dist-build-android-sideload: intl build-android-sideload

[group('build')]
intl:
    yarn intl:build

[group('build')]
prebuild-android:
    expo prebuild -p android

[group('build')]
build-web: && postbuild-web
    yarn build-web

[group('build')]
build-android-sideload: prebuild-android
    eas build --local --platform android --profile sideload-android

[group('build')]
postbuild-web:
    # build system outputs some srcs and hrefs like src="static/"
    # need to rewrite to be src="/static/" to handle non root pages
    sed -i 's/\(src\|href\)="static/\1="\/static/g' web-build/index.html

    # we need to copy the static iframe html to support youtube embeds
    cp -r bskyweb/static/iframe/ web-build/iframe

    # copy our static pages over!
    cp -r blacksky-static-about web-build/about

[group('dev')]
dev-android-setup: prebuild-android
    yarn android

[group('dev')]
dev-web:
    yarn web

[group('dev')]
dev-web-functions: build-web
    wrangler pages dev ./web-build

[group('lint')]
typecheck:
    yarn typecheck

