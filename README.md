# faap

Fast Api for Any Prototype

## Example

[Open](https://faap-app.herokuapp.com)

## Run
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

Docker file

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
npn run-test
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
7. ...
8. Profit!
