#!/bin/sh

cd docker/test

docker volume create --name=faap-mongo-data

docker-compose up --abort-on-container-exit || exit 1
