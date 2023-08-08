#!/bin/bash

# Bypass npm root issue
npm config set cache /tmp --global
npm i
# npm run prebuild
# npm run build
npm run start
