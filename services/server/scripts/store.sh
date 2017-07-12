#!/bin/bash
while true
do
  /usr/bin/node /var/www/nodejs/svapi/services/server/scripts/store.js & processpid=$!
  sleep 15
  wait $processpid
done
