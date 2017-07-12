#!/bin/bash
while true
do
  /usr/bin/node /var/www/nodejs/svapi/services/server/scripts/product.js & processpid=$!
  sleep 30
  wait $processpid
done
