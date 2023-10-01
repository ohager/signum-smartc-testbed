#!/bin/bash

yarn compile
yarn docs
git add -A
git commit -am "ci: Updated docs" --no-verify
