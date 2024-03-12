#!/bin/bash
# Counts the number of files in the baileys_auth_info directory of each phone directory

count_files() {
    local dir=$1
    local store_size=$(ls -lh $dir/baileys_store_multi.json | awk '{print $5}')
    local dir2=$dir/baileys_auth_info
    local file_count=$(find "$dir2" -maxdepth 1 -type f | wc -l)
    echo "$dir store size: $store_size, auth files: $file_count"
}

# Iterate through all directories in the current directory
for dir in .baileys-data/* ; do
    if [ -d "$dir" ]; then
        count_files "$dir"
    fi
done