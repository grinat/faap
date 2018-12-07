#faap

Fast Api for Any Prototype


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

