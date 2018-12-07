#!/bin/sh

VERSION=$(jq '.version' package.json | sed 's/"//' | sed 's/"//')

docker build -t faap . --no-cache

docker ps -a

# docker login --username $DOCKER_U --password $DOCKER_P
DOCKER_U='grinat0'

docker tag faap $DOCKER_U/faap:latest
docker tag faap $DOCKER_U/faap:release-$VERSION

docker push $DOCKER_U/faap:latest
docker push $DOCKER_U/faap:release-$VERSION
