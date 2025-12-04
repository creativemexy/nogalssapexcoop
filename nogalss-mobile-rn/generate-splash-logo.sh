#!/bin/bash

# Generate properly sized splash screen logo
# The splash logo should be centered on a white background with appropriate padding

LOGO_SOURCE="assets/logo.png"
SPLASH_OUTPUT="assets/splash-logo.png"
SPLASH_SIZE=1024
LOGO_SIZE=$((SPLASH_SIZE * 70 / 100))  # Logo takes 70% of splash size

echo "Generating splash screen logo..."
echo "Source: $LOGO_SOURCE"
echo "Output: $SPLASH_OUTPUT"
echo "Splash size: ${SPLASH_SIZE}x${SPLASH_SIZE}"
echo "Logo size: ${LOGO_SIZE}x${LOGO_SIZE}"

# Create a 1024x1024 white canvas
# Resize logo to fit within the canvas while maintaining aspect ratio
# Center it on the canvas
convert "$LOGO_SOURCE" \
  -resize "${LOGO_SIZE}x${LOGO_SIZE}" \
  -background white \
  -gravity center \
  -extent "${SPLASH_SIZE}x${SPLASH_SIZE}" \
  "$SPLASH_OUTPUT"

if [ $? -eq 0 ]; then
  echo "✓ Splash logo generated successfully: $SPLASH_OUTPUT"
  identify "$SPLASH_OUTPUT"
else
  echo "✗ Failed to generate splash logo"
  exit 1
fi



