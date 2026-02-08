# Docker

## Docker build

To build a docker container run
'''
docker build --tag nfexplorer:latest .
'''

To run the docker

'''
mkdir ./config
mkdir ./data
mkdir ./logs
docker run -d --rm --env-file .env -p "8080:8080/tcp" -p "9995:9995/udp" -v "./config:/app/config" -v "./data:/app/flow-data" -v "./logs:/app/logs" nfexplorer:latest
'''

## Docker compose

To run under docker compose, update the env.example file and copy to .env.  Then start with docker compose

'''
docker-compose up -d
'''
