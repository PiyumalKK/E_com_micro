#!/bin/sh
envsubst '$API_GATEWAY_URL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
echo "Nginx config generated with API_GATEWAY_URL=${API_GATEWAY_URL}"
cat /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
