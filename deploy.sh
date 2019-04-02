#!/bin/bash

CUR_NPM_VERSION=$(npm info  @conceptho/adonis-service-layer | grep 'latest' | sed 's/[^0-9|\.]/''/g')
LOCAL_VERSION=$(cat package.json | grep version | sed 's/[^0-9|\.]/''/g')

if [ $CUR_NPM_VERSION != $LOCAL_VERSION ]; then
  echo $CUR_NPM_VERSION >> $LOCAL_VERSION
  echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/repo/.npmrc

  npm publish
else
  echo SKIPPING VERSION $LOCAL_VERSION
fi