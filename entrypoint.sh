#!/bin/sh

export NODE_ENV=production

yarn db:migrate && yarn start
