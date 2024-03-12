#!/bin/bash

# Ask the user for confirmation
read -p "Are you sure you want to restart Ozer? (y/n): " confirm

# Check the user's response
if [ "$confirm" = "y" ]; then
  sudo systemctl restart ozer
else
  # Abort the operation
  echo "Operation aborted."
fi

