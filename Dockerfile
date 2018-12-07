# install mongo
FROM mongo:4.0.4-xenial
RUN mkdir -p /data/db

# install supervisor and curl
RUN apt-get update && apt-get install -y supervisor ca-certificates curl

# install node
RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt-get install -y nodejs

# clean
RUN apt-get purge --auto-remove -y \
    && rm -rf /var/lib/apt/lists/*

# copy project files
COPY ./ /home/faap
RUN chmod +x /home/faap/docker/supervisord/entrypoint.sh

ENV MONGO_URL="mongodb://localhost:27017/faap"

EXPOSE 3200

ENTRYPOINT ["home/faap/docker/supervisord/entrypoint.sh"]
