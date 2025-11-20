#!/bin/bash
# Setup Android SDK environment variables

export ANDROID_HOME=/home/mexy/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

echo "Android SDK environment configured:"
echo "ANDROID_HOME=$ANDROID_HOME"
echo "adb location: $(which adb)"

