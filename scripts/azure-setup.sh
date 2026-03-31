#!/bin/bash

# ============================================================
# ShopEase - Azure Container Apps Infrastructure Setup Script
# ============================================================
# This script sets up the Azure infrastructure required for
# deploying the ShopEase microservices application.
#
# Prerequisites:
# - Azure CLI installed and logged in (az login)
# - A valid Azure subscription
# ============================================================

set -e

# ---- Configuration ----
RESOURCE_GROUP="shopease-rg"
LOCATION="eastus"
ACR_NAME="shopeaseacr$(openssl rand -hex 4)"  # Must be globally unique
ENVIRONMENT_NAME="shopease-env"
COSMOS_DB_ACCOUNT="shopease-cosmos-$(openssl rand -hex 4)"

echo "=========================================="
echo "ShopEase Azure Infrastructure Setup"
echo "=========================================="
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "ACR Name: $ACR_NAME"
echo "Environment: $ENVIRONMENT_NAME"
echo ""

# Step 1: Create Resource Group
echo "[1/8] Creating Resource Group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Step 2: Create Azure Container Registry (ACR)
echo "[2/8] Creating Azure Container Registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

echo "ACR Login Server: $ACR_NAME.azurecr.io"

# Step 3: Create Azure Cosmos DB for MongoDB API (Free Tier)
echo "[3/8] Creating Azure Cosmos DB (MongoDB API - Free Tier)..."
az cosmosdb create \
  --name $COSMOS_DB_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --kind MongoDB \
  --server-version "4.2" \
  --default-consistency-level Eventual \
  --enable-free-tier true \
  --locations regionName=$LOCATION

# Get Cosmos DB connection string
COSMOS_CONNECTION_STRING=$(az cosmosdb keys list \
  --name $COSMOS_DB_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" -o tsv)

# Create databases
echo "Creating databases..."
az cosmosdb mongodb database create --account-name $COSMOS_DB_ACCOUNT --resource-group $RESOURCE_GROUP --name shopease-users
az cosmosdb mongodb database create --account-name $COSMOS_DB_ACCOUNT --resource-group $RESOURCE_GROUP --name shopease-products
az cosmosdb mongodb database create --account-name $COSMOS_DB_ACCOUNT --resource-group $RESOURCE_GROUP --name shopease-orders
az cosmosdb mongodb database create --account-name $COSMOS_DB_ACCOUNT --resource-group $RESOURCE_GROUP --name shopease-notifications

# Step 4: Create Container Apps Environment
echo "[4/8] Creating Container Apps Environment..."
az containerapp env create \
  --name $ENVIRONMENT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Step 5: Build and push Docker images
echo "[5/8] Building and pushing Docker images..."
az acr login --name $ACR_NAME

# Build each service
for SERVICE in user-service product-service order-service notification-service api-gateway; do
  echo "Building $SERVICE..."
  docker build -t $ACR_NAME.azurecr.io/$SERVICE:latest ./$SERVICE
  docker push $ACR_NAME.azurecr.io/$SERVICE:latest
done

# Step 6: Deploy microservices to Container Apps
JWT_SECRET="shopease-jwt-secret-$(openssl rand -hex 16)"

echo "[6/8] Deploying User Service..."
az containerapp create \
  --name shopease-user-service \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT_NAME \
  --image $ACR_NAME.azurecr.io/user-service:latest \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 3001 \
  --ingress 'internal' \
  --min-replicas 1 \
  --max-replicas 3 \
  --env-vars \
    PORT=3001 \
    MONGODB_URI="$COSMOS_CONNECTION_STRING&database=shopease-users" \
    JWT_SECRET=$JWT_SECRET \
    JWT_EXPIRES_IN=24h \
    NODE_ENV=production

USER_SERVICE_FQDN=$(az containerapp show --name shopease-user-service --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv)

echo "[6/8] Deploying Product Service..."
az containerapp create \
  --name shopease-product-service \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT_NAME \
  --image $ACR_NAME.azurecr.io/product-service:latest \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 3002 \
  --ingress 'internal' \
  --min-replicas 1 \
  --max-replicas 3 \
  --env-vars \
    PORT=3002 \
    MONGODB_URI="$COSMOS_CONNECTION_STRING&database=shopease-products" \
    JWT_SECRET=$JWT_SECRET \
    NODE_ENV=production \
    USER_SERVICE_URL=https://$USER_SERVICE_FQDN

PRODUCT_SERVICE_FQDN=$(az containerapp show --name shopease-product-service --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv)

echo "[7/8] Deploying Order Service..."
az containerapp create \
  --name shopease-order-service \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT_NAME \
  --image $ACR_NAME.azurecr.io/order-service:latest \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 3003 \
  --ingress 'internal' \
  --min-replicas 1 \
  --max-replicas 3 \
  --env-vars \
    PORT=3003 \
    MONGODB_URI="$COSMOS_CONNECTION_STRING&database=shopease-orders" \
    JWT_SECRET=$JWT_SECRET \
    NODE_ENV=production \
    USER_SERVICE_URL=https://$USER_SERVICE_FQDN \
    PRODUCT_SERVICE_URL=https://$PRODUCT_SERVICE_FQDN

ORDER_SERVICE_FQDN=$(az containerapp show --name shopease-order-service --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv)

echo "[7/8] Deploying Notification Service..."
az containerapp create \
  --name shopease-notification-service \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT_NAME \
  --image $ACR_NAME.azurecr.io/notification-service:latest \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 3004 \
  --ingress 'internal' \
  --min-replicas 1 \
  --max-replicas 3 \
  --env-vars \
    PORT=3004 \
    MONGODB_URI="$COSMOS_CONNECTION_STRING&database=shopease-notifications" \
    JWT_SECRET=$JWT_SECRET \
    NODE_ENV=production \
    USER_SERVICE_URL=https://$USER_SERVICE_FQDN \
    ORDER_SERVICE_URL=https://$ORDER_SERVICE_FQDN

NOTIFICATION_SERVICE_FQDN=$(az containerapp show --name shopease-notification-service --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv)

# Update Order Service with Notification Service URL
az containerapp update \
  --name shopease-order-service \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars \
    NOTIFICATION_SERVICE_URL=https://$NOTIFICATION_SERVICE_FQDN

echo "[8/8] Deploying API Gateway (public-facing)..."
az containerapp create \
  --name shopease-api-gateway \
  --resource-group $RESOURCE_GROUP \
  --environment $ENVIRONMENT_NAME \
  --image $ACR_NAME.azurecr.io/api-gateway:latest \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --target-port 3000 \
  --ingress 'external' \
  --min-replicas 1 \
  --max-replicas 5 \
  --env-vars \
    PORT=3000 \
    NODE_ENV=production \
    USER_SERVICE_URL=https://$USER_SERVICE_FQDN \
    PRODUCT_SERVICE_URL=https://$PRODUCT_SERVICE_FQDN \
    ORDER_SERVICE_URL=https://$ORDER_SERVICE_FQDN \
    NOTIFICATION_SERVICE_URL=https://$NOTIFICATION_SERVICE_FQDN

GATEWAY_FQDN=$(az containerapp show --name shopease-api-gateway --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv)

echo ""
echo "=========================================="
echo "  DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "API Gateway URL: https://$GATEWAY_FQDN"
echo ""
echo "Service Endpoints:"
echo "  Health Check: https://$GATEWAY_FQDN/health"
echo "  User Service: https://$GATEWAY_FQDN/api/auth"
echo "  Products:     https://$GATEWAY_FQDN/api/products"
echo "  Orders:       https://$GATEWAY_FQDN/api/orders"
echo "  Notifications:https://$GATEWAY_FQDN/api/notifications"
echo ""
echo "=========================================="
echo "  GitHub Secrets to Configure:"
echo "=========================================="
echo "  ACR_NAME=$ACR_NAME"
echo "  ACR_USERNAME=$ACR_USERNAME"
echo "  ACR_PASSWORD=$ACR_PASSWORD"
echo "  AZURE_RESOURCE_GROUP=$RESOURCE_GROUP"
echo ""
echo "For AZURE_CREDENTIALS, run:"
echo "  az ad sp create-for-rbac --name shopease-github --role contributor \\"
echo "    --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/$RESOURCE_GROUP \\"
echo "    --sdk-auth"
echo "=========================================="
