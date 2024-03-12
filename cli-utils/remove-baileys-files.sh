#!/bin/bash

# Ask the user for confirmation
read -p "Are you sure you want to delete the Baileys data directories? (y/n): " confirm

# Check the user's response
if [ "$confirm" = "y" ]; then
  # Proceed with deletion
  rm -rf .baileys-data/*
  rm -rf .baileys-data-excluded/*
  echo "Baileys data directories have been deleted."
else
  # Abort the operation
  echo "Operation aborted."
fi