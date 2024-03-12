#!/bin/bash
# Move a phone number out of active use. Useful to find problematic phone numbers causing chaos in baileys.

# Check if a parameter was provided
if [ -z "$1" ]; then
  echo "Usage: $0 <phone_number>"
  exit 1
fi

# Get the phone number from the command line parameter
PHONE_NUMBER="$1"

# Name of the source and destination directories
SOURCE_DIR=".baileys-data/user-$PHONE_NUMBER/"

# Check if the destination directory exists
if [ ! -d .baileys-data-excluded/ ]; then
  mkdir -p .baileys-data-excluded/
fi

# Check if the source directory exists
if [ -d "$SOURCE_DIR" ]; then
  # Move the source directory to the destination directory
  if mv "$SOURCE_DIR" .baileys-data-excluded/; then
    echo "$PHONE_NUMBER successfully moved to .baileys-data-excluded."
  else
    echo "Error: Failed to move $SOURCE_DIR to .baileys-data-excluded/"
    exit 1
  fi
else
  echo "Error: Source directory $SOURCE_DIR does not exist."
  exit 1
fi