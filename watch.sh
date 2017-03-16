#! /usr/bin/env bash

find . | grep -v '.git' | grep -v 'node_modules/' | grep -v 'rendered.html' | entr curl -N --digest -u admin:admin http://localhost:8642/object-describe.sjs &
find rendered.html | entr open -g rendered.html &