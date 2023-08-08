cp ../db.sqlite db-$(date +%F-%H-%M).sqlite
find ./ -type f -mtime +7 -name '*.sqlite' -delete