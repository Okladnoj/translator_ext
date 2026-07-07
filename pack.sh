#!/bin/bash

# Run command [sh pack.sh]

APP_DIR="$(pwd)/app"
BUILD_DIR="$(pwd)/build"
PEM_FILE="$BUILD_DIR/translator_ext.pem"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Pack the extension into a zip (for Chrome Web Store upload)
(cd "$APP_DIR" && zip -r "$BUILD_DIR/translator_ext.zip" .)

# Pack the extension into a .crx (for local distribution)
if [ -f "$PEM_FILE" ]; then
  cp "$PEM_FILE" "$(pwd)/app.pem"
fi

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ -f "$(pwd)/app.pem" ]; then
  "$CHROME" --pack-extension="$APP_DIR" --pack-extension-key="$(pwd)/app.pem"
else
  "$CHROME" --pack-extension="$APP_DIR"
fi

mv -f "$(pwd)/app.crx" "$BUILD_DIR/translator_ext.crx"
mv -f "$(pwd)/app.pem" "$BUILD_DIR/translator_ext.pem"

unzip -o "$BUILD_DIR/translator_ext.zip" -d "$BUILD_DIR/translator_ext"

echo "Build complete → $BUILD_DIR/"
ls -lh "$BUILD_DIR/"