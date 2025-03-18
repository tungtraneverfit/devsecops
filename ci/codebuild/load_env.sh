#!/usr/bin/env bash

set -e

if [ "$#" -lt 1 ]; then
    echo "Please provide ENV_PATTERN"
    exit 1

else

    ENV_PATTERN=$1
    if [ "$#" -lt 2 ]; then
        ENV_FILE_NAME=".env"
    else   
        ENV_FILE_NAME=$2
    fi
    
    echo "Load env vars from ssm with patern: $ENV_PATTERN into $ENV_FILE_NAME"

    aws ssm get-parameters-by-path --path $ENV_PATTERN --region $AWS_REGION --with-decryption --recursive | jq '.Parameters' | jq -r ".[]" | jq -r '"\(.Name)=\(.Value)"' > api_env_xml

    pat=$ENV_PATTERN

    while read p; do
    env=$(awk -F"$pat" '{print $2}' <<< "$p")
    echo "$env" >> "$ENV_FILE_NAME"
    done <api_env_xml

    rm api_env_xml

    cat "$ENV_FILE_NAME"
fi