#!/bin/bash

# Enhanced script for creating an Azure Web PubSub instance with detailed logging, error handling, and Azure login check

# Usage: ./_webPubSub.sh [-u]
# Use -u to enable updating the .env file with the connection string

# Configuration
WEBPUBSUB="wps$(date +%s | sha256sum | base64 | head -c 6)"
RESOURCE_GROUP="${WEBPUBSUB}rg"
LOCATION="EastUS"
SKU="Free_F1"
LOG_FILE="webpubsub_creation.log"
ENV_FILE=".env"

echo "Starting Azure Web PubSub creation process at $(date)" > $LOG_FILE

echo "Checking Azure CLI login status..." | tee -a $LOG_FILE
az account show &> /dev/null
if [ $? != 0 ]; then
    echo "Not logged in to Azure. Please log in..." | tee -a $LOG_FILE
    az login
    if [ $? != 0 ]; then
        echo "Azure login failed. Exiting..." | tee -a $LOG_FILE
        exit 1
    fi
fi
echo "Azure CLI login confirmed." | tee -a $LOG_FILE

update_env() {
    local connectionString=$1
    if [ -f "$ENV_FILE" ]; then
        echo "Updating .env file with Web PubSub connection string..."
        echo "WEBPUBSUB_CONNECTION_STRING='$connectionString'" >> $ENV_FILE
        echo "Updated .env file successfully." | tee -a $LOG_FILE
    else
        echo "Error: .env file does not exist." | tee -a $LOG_FILE
    fi
}

echo "Creating Azure Web PubSub instance..." | tee -a $LOG_FILE
{
    az group create --name $RESOURCE_GROUP --location $LOCATION 2>&1 | tee -a $LOG_FILE &&
    az extension add --upgrade --name webpubsub 2>&1 | tee -a $LOG_FILE &&
    az webpubsub create --name $WEBPUBSUB --resource-group $RESOURCE_GROUP --location $LOCATION --sku $SKU 2>&1 | tee -a $LOG_FILE &&
    connectionString=$(az webpubsub key show --resource-group $RESOURCE_GROUP --name $WEBPUBSUB --query primaryConnectionString --output tsv 2>&1 | tee -a $LOG_FILE)
    echo "Azure Web PubSub instance created successfully." | tee -a $LOG_FILE
    if [[ $1 == "-u" ]]; then
        update_env "$connectionString"
    fi
} || {
    echo "Error encountered during Web PubSub creation. See $LOG_FILE for details." >&2
    exit 1
}

exit 0
