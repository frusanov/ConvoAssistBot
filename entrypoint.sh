#!/bin/sh

export NODE_ENV=production

bun drizzle-kit push && bun run start
