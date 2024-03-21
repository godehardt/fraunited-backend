#         .-._
#       .-| | |
#     _ | | | |__FRANKFURT
#   ((__| | | | UNIVERSITY
#      OF APPLIED SCIENCES
#
#   (c) 2022-2023

ARG NODE_VERSION=20.9.0

FROM node:${NODE_VERSION}-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ../package*.json ./

RUN npm install

# Bundle app source
COPY ./core .

EXPOSE 80
#CMD [ "/bin/ls", "-l" ]
CMD [ "node", "index.js" ]
