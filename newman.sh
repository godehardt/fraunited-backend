#!/bin/bash
echo "run collection with newman"
newman run protocol_api.postman_collection.json
echo "collection run successfully"
