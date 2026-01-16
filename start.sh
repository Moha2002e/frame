#!/bin/bash
cd qcm-app
npm install
npm run build
npm run preview -- --host --port $PORT
