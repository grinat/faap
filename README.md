# faap
[![Travis CI status](https://api.travis-ci.org/grinat/faap.svg?branch=master)](https://travis-ci.org/grinat/faap)

Fast Api for Any Prototype

Allows via rest api add, edit, sort, filter any arbitrary data sets. What is convenient when creating demos and prototypes, since there is no need to write server api, models, migrations, etc.

There is a built-in authorization by token, or you can connect to an existing one.

## Example

[Example app](https://grinat.github.io/faap/examples/items.html)

## Swagger Api Docs

Local
[http://localhost:3200/faap/v1/docs/swagger](http://localhost:3200/faap/v1/docs/swagger)

Remote
[https://faap-app.herokuapp.com/faap/v1/docs/swagger](https://faap-app.herokuapp.com/faap/v1/docs/swagger)


## Run
### Docker image

```
docker run -d -p 3200:3200 --name faap --restart always grinat0/faap
```

With enable auth
```
docker run -d -p 3200:3200 -e "USE_INNER_AUTH=true" --name faap --restart always grinat0/faap
```

With you auth url (all headers was sent to that url by get response)
```
docker run -d -p 3200:3200 -e "CHECK_AUTH_URL=http://loc/check-auth.php" --name faap --restart always grinat0/faap
```

### Dev

```
# run db
cd docker/dev && docker-compose up

# run hot reload server
npm i && npm run dev
```

### Prod

Docker compose

```
cd docker/prod && docker-compose up
```

Or build docker file and run

```
docker run -p 3200:3200 faap
```

## Build
### Build docker file

```
docker build -t faap .
```

## Testing

With docker

```
cd docker/test && docker-compose up --abort-on-container-exit
```

Local (need running db)

```
npm run-test
```

## Heroku
1. Create new app
2. Fork repo and add to app
3. Enable metadata support:
```
heroku labs:enable runtime-dyno-metadata -a you_app_name
```
4. Get free mongodb on https://mlab.com/ and create new db or set you mongo url
5. Set db config:
```
heroku config:set MONGO_URL="mongodb://user:pass@host:port/dbname" -a you_app_name
```
6. Set other configs if need via enviroment avalibled in config.js
7. ???
8. Profit!
