# faap
[![Travis CI status](https://api.travis-ci.org/grinat/faap.svg?branch=master)](https://travis-ci.org/grinat/faap)

Fast Api for Any Prototype (like postgrest, but you don't need create schema manually)

Allows via rest api add, edit, sort, filter any arbitrary data sets. What is convenient when creating demos and prototypes, since there is no need to write server api, models, migrations, etc.

There is a built-in authorization by token, or you can connect to an existing one.

Included data generation tool.

## Example

[Example app](https://grinat.github.io/faap/examples/items.html)

## Swagger Api Docs

Local
[http://localhost:3200/faap/v1/docs/swagger](http://localhost:3200/faap/v1/docs/swagger)

Remote
[https://faap-app.herokuapp.com/faap/v1/docs/swagger](https://faap-app.herokuapp.com/faap/v1/docs/swagger)


## Run
### Express extension
Simple usage:
```
const faap = require('faap')

app.use(faap({
   MONGO_URL: 'mongodb://localhost:27017/test',
   SWAGGER_UI_ENABLED: true,
   ENABLE_TOOLS: true
}))
```

Advanced usage:
```
const faap = require('faap')

// optional, below are the default values
const config = {
  // for example: 'mongodb://localhost:27017/test'
  MONGO_URL: null,

  // set url, faap send GET response to that url
  // with all headers and if credentials invalid, send any http code out of the range of 2xx
  CHECK_AUTH_URL: null,
  // if true, you can login/register/edit profile at site
  INNER_AUTH_ENABLED: false,
  // where save users data
  INNER_AUTH_COLLECTION: 'user',
  INNER_AUTH_SALT: 'w@N:X+nG Fhu!N~PW|>,Wyl1M8)4[&so1-=&Pd8aO+wkIn;,:;gi4n<+aZGH-|.Q',

  // max size of json content which sended my client
  BODY_SIZE_LIMIT: '4mb',

  BASE_API_PATH: '/faap/v1/',

  // show in console.log('Created collection with id...')
  SHOW_DEBUG_MSG: false,

  // if true on /faap/v1/docs/swagger you can see swagger ui
  SWAGGER_UI_ENABLED: false,

  // enable upload files
  UPLOADS_ENABLED: true,
  // where saved uploaded files
  // for example: path.join(__dirname, 'uploads')
  UPLOADS_DIR: null,
  UPLOADS_ACCEPTED_MIMES: ['image/png', 'image/jpeg', 'image/pjpeg', 'image/gif', 'text/plain'],
  UPLOADS_SIZE_LIMIT: 4 * 1024 * 1024,
  
  // enable tools for admin collections (truncate, gen fake data and etc)
  ENABLE_TOOLS: false
}

// optional, set you auth and db
const callbacks = {
  getDB: async (config) => await mongoClient.connect(mongoUrl),
  checkIdentify: async (request, config, db) => isLogged ? true : Promise.reject(new Error('Not authorized')),
  transformList: ({data, _meta, _links}, collectionName, req) => ({data, _meta, _links}),
  transformItem: (item, collectionName, req) => item,
  validateRequest: async (request, config, db, auth) => {
    await auth.isLoggedUser()
    return enableValidate === false || (auth.user && auth.user.foo === request.body.foo)
      ? true
      : Promise.reject({foo: 'you cant change foo'})
  }
}

app.use(faap(config, callbacks))
```

## Heroku
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/grinat/faap)

Or

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
6. Set other configs if need via enviroment avalibled in serverConfig.js
```
// enabling swager ui
heroku config:set SWAGGER_UI_ENABLED=true -a you_app_name
```
7. ???
8. Profit!

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
npm run test
```
