#!/bin/bash

yarn docs
git commit -am "ci: Updated docs" --no-verify
yarn build
