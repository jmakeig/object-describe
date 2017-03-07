#! /usr/bin/env bash

find . | grep -v '.git' | entr open -g rendered.html