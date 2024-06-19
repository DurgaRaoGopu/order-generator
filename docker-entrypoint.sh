#!/bin/bash
echo $REACT_APP_API_HOST > /usr/src/app/.env
exec "$@"
