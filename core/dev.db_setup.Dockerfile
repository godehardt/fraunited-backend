#         .-._
#       .-| | |
#     _ | | | |__FRANKFURT
#   ((__| | | | UNIVERSITY
#      OF APPLIED SCIENCES
#
#   (c) 2022-2023

FROM alpine

# Bundle app source
COPY ./ ./core

RUN apk add jq && apk add curl

