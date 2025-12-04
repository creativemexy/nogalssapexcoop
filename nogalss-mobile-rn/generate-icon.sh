#!/bin/bash

# Generate properly sized Android adaptive icon
# The icon should be 1024x1024 with the logo centered and taking up ~65% of the space

LOGO_SOURCE="assets/logo.png"
ICON_OUTPUT="assets/icon-foreground.png"
ICON_SIZE=1024
LOGO_SIZE=$((ICON_SIZE * 65 / 100))  # Logo takes 65% of icon size

echo "Generating Android adaptive icon..."
echo "Source: $LOGO_SOURCE"
echo "Output: $ICON_OUTPUT"
echo "Icon size: ${ICON_SIZE}x${ICON_SIZE}"
echo "Logo size: ${LOGO_SIZE}x${LOGO_SIZE}"

# Create a 1024x1024 white canvas
# Resize logo to fit within the canvas while maintaining aspect ratio
# Center it on the canvas
convert "$LOGO_SOURCE" \
  -resize "${LOGO_SIZE}x${LOGO_SIZE}" \
  -background white \
  -gravity center \
  -extent "${ICON_SIZE}x${ICON_SIZE}" \
  "$ICON_OUTPUT"

if [ $? -eq 0 ]; then
  echo "✓ Icon generated successfully: $ICON_OUTPUT"
  identify "$ICON_OUTPUT"
else
  echo "✗ Failed to generate icon"
  exit 1
fi



