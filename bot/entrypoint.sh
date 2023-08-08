#!/bin/bash

mkdir -p backups
cp db.sqlite backups/db-$(date +%F-%H-%M).sqlite
find backups/ -type f -mtime +7 -name '*.sqlite' -delete

# Bypass npm root issue
npm config set cache /tmp --global
npm i
# npm run prebuild
# npm run build
npm run start
