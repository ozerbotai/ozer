#!/bin/bash

# Ask the user for confirmation
read -p "Are you sure you want to stop Ozer? (y/n): " confirm

# Check the user's response
if [ "$confirm" = "y" ]; then
  sudo systemctl stop ozer
else
  # Abort the operation
  echo "Operation aborted."
fi

