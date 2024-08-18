#!/bin/bash
API_DIR="${PWD}/../bevor_api"
FILE_DIR="${API_DIR}/src/endpoints"
echo "${API_DIR}"
if [ -d "$API_DIR" ]; 
then
    echo "Located dir: bevor_api"
    eval "$(ROUTE_COMPILATION=true npx tsx server/routes/helpers/echoEndpoints.ts)"
    if ! [ -d "${FILE_DIR}" ]; 
    then
        mkdir $FILE_DIR
    fi
    echo "${exports} ${endpoints}export {Endpoints, Exports}" > ${API_DIR}/src/endpoints/endpoints.ts
else
    echo -e "Error: Unable to locate /bevor_api\n\nDir(s): bevor_server, bevor_api\nMust exist in the same directory to export endpoints locally."
fi
