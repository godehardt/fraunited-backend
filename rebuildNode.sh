#!/bin/bash
#         .-._
#       .-| | |
#     _ | | | |__FRANKFURT
#   ((__| | | | UNIVERSITY
#      OF APPLIED SCIENCES
#
#   (c) 2021-2023

yarn stop
mv mongo ..
yarn build
mv ../mongo .
yarn start

