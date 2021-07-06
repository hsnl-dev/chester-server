#!/bin/bash
set -e

if [ "$1" = 'service' ]; then
    exec npm run "service:$2"
fi

exec "$@"
