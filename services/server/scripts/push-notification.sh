#!/bin/bash
while true
do
  /usr/bin/node /var/www/nodejs/svapi/services/server/scripts/push-notification.js & processpid=$!
  sleep 10
  wait $processpid
done
