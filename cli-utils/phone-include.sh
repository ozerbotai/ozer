#!/bin/bash
# Move a phone number back to active use

# Check if a parameter was provided
if [ -z "$1" ]; then
  echo "Usage: $0 <phone_number>"
  exit 1
fi

# Get the phone number from the command line parameter
PHONE_NUMBER="$1"

# Names of the source and destination directories
SOURCE_DIR=".baileys-data-excluded/user-$PHONE_NUMBER/"

# Check if the source directory exists
if [ -d "$SOURCE_DIR" ]; then
  # Move the source directory to the destination directory
  if mv "$SOURCE_DIR" .baileys-data/; then
    echo "$PHONE_NUMBER successfully moved back to .baileys-data."
  else
    echo "Error: Failed to move $SOURCE_DIR to .baileys-data/"
    exit 1
  fi
else
  echo "Error: Source directory $SOURCE_DIR does not exist."
  exit 1
fi