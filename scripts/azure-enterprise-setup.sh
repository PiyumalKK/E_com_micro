#!/bin/bash
# ============================================================
# ShopEase - Azure Enterprise Services Setup Script
# ============================================================
# This script creates the following Azure resources:
#   1. Azure Key Vault (secrets management)
#   2. Application Insights (monitoring & distributed tracing)
#   3. Azure Service Bus (event-driven messaging)
#   4. Azure Cache for Redis (product caching)
#   5. Azure Storage Account + CDN (product images)
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - Existing resource group: shopease-rg
#   - Existing Container Apps environment: shopease-env
# ============================================================

set -e

# Configuration
RESOURCE_GROUP="shopease-rg"
LOCATION="eastus"
KEY_VAULT_NAME="shopease-kv-$(openssl rand -hex 4)"
APP_INSIGHTS_NAME="shopease-insights"
LOG_ANALYTICS_NAME="shopease-logs"
SERVICE_BUS_NAMESPACE="shopease-bus-$(openssl rand -hex 4)"
SERVICE_BUS_QUEUE="order-notifications"
REDIS_NAME="shopease-cache-$(openssl rand -hex 4)"
STORAGE_ACCOUNT_NAME="shopeasestorage$(openssl rand -hex 4)"
STORAGE_CONTAINER="product-images"
CDN_PROFILE_NAME="shopease-cdn"
CDN_ENDPOINT_NAME="shopease-images-$(openssl rand -hex 4)"

echo "============================================"
echo "  ShopEase Enterprise Services Setup"
echo "============================================"

# ============================================================
# 1. Azure Key Vault
# ============================================================
echo ""
echo ">>> [1/5] Creating Azure Key Vault..."
az keyvault create \
  --name "$KEY_VAULT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku standard \
  --enable-rbac-authorization false

echo "Adding secrets to Key Vault..."
# These will be replaced with your actual values
az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "jwt-secret" \
  --value "shopease-jwt-secret-key-2026"

az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "user-mongodb-uri" \
  --value "YOUR_MONGODB_URI_FOR_USERS"

az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "product-mongodb-uri" \
  --value "YOUR_MONGODB_URI_FOR_PRODUCTS"

az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "order-mongodb-uri" \
  --value "YOUR_MONGODB_URI_FOR_ORDERS"

az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "notification-mongodb-uri" \
  --value "YOUR_MONGODB_URI_FOR_NOTIFICATIONS"

KEY_VAULT_URL="https://${KEY_VAULT_NAME}.vault.azure.net"
echo "Key Vault URL: $KEY_VAULT_URL"

# ============================================================
# 2. Application Insights + Log Analytics
# ============================================================
echo ""
echo ">>> [2/5] Creating Log Analytics Workspace & Application Insights..."
az monitor log-analytics workspace create \
  --resource-group "$RESOURCE_GROUP" \
  --workspace-name "$LOG_ANALYTICS_NAME" \
  --location "$LOCATION"

LOG_ANALYTICS_ID=$(az monitor log-analytics workspace show \
  --resource-group "$RESOURCE_GROUP" \
  --workspace-name "$LOG_ANALYTICS_NAME" \
  --query id -o tsv)

az monitor app-insights component create \
  --app "$APP_INSIGHTS_NAME" \
  --location "$LOCATION" \
  --resource-group "$RESOURCE_GROUP" \
  --workspace "$LOG_ANALYTICS_ID" \
  --kind web \
  --application-type web

APPINSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show \
  --app "$APP_INSIGHTS_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query connectionString -o tsv)

echo "App Insights Connection String: $APPINSIGHTS_CONNECTION_STRING"

# Store in Key Vault
az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "appinsights-connection-string" \
  --value "$APPINSIGHTS_CONNECTION_STRING"

# ============================================================
# 3. Azure Service Bus
# ============================================================
echo ""
echo ">>> [3/5] Creating Azure Service Bus..."
az servicebus namespace create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$SERVICE_BUS_NAMESPACE" \
  --location "$LOCATION" \
  --sku Basic

az servicebus queue create \
  --resource-group "$RESOURCE_GROUP" \
  --namespace-name "$SERVICE_BUS_NAMESPACE" \
  --name "$SERVICE_BUS_QUEUE" \
  --max-size 1024

SERVICE_BUS_CONNECTION=$(az servicebus namespace authorization-rule keys list \
  --resource-group "$RESOURCE_GROUP" \
  --namespace-name "$SERVICE_BUS_NAMESPACE" \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv)

echo "Service Bus Connection: $SERVICE_BUS_CONNECTION"

# Store in Key Vault
az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "servicebus-connection-string" \
  --value "$SERVICE_BUS_CONNECTION"

# ============================================================
# 4. Azure Cache for Redis
# ============================================================
echo ""
echo ">>> [4/5] Creating Azure Cache for Redis..."
echo "(This may take 10-20 minutes...)"
az redis create \
  --name "$REDIS_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Basic \
  --vm-size C0

# Wait for Redis to be ready
echo "Waiting for Redis to provision..."
az redis wait --name "$REDIS_NAME" --resource-group "$RESOURCE_GROUP" --created

REDIS_KEY=$(az redis list-keys \
  --name "$REDIS_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query primaryKey -o tsv)

REDIS_HOST="${REDIS_NAME}.redis.cache.windows.net"
REDIS_URL="rediss://:${REDIS_KEY}@${REDIS_HOST}:6380"

echo "Redis URL: rediss://:***@${REDIS_HOST}:6380"

# Store in Key Vault
az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "redis-connection-string" \
  --value "$REDIS_URL"

# ============================================================
# 5. Azure Storage Account + CDN
# ============================================================
echo ""
echo ">>> [5/5] Creating Storage Account & CDN..."
az storage account create \
  --name "$STORAGE_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --allow-blob-public-access true

STORAGE_CONNECTION=$(az storage account show-connection-string \
  --name "$STORAGE_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query connectionString -o tsv)

# Create blob container
az storage container create \
  --name "$STORAGE_CONTAINER" \
  --account-name "$STORAGE_ACCOUNT_NAME" \
  --public-access blob

echo "Storage Connection: $STORAGE_CONNECTION"

# Store in Key Vault
az keyvault secret set --vault-name "$KEY_VAULT_NAME" --name "storage-connection-string" \
  --value "$STORAGE_CONNECTION"

# Create CDN Profile and Endpoint
echo "Creating CDN..."
az cdn profile create \
  --name "$CDN_PROFILE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --sku Standard_Microsoft

STORAGE_ORIGIN="${STORAGE_ACCOUNT_NAME}.blob.core.windows.net"

az cdn endpoint create \
  --name "$CDN_ENDPOINT_NAME" \
  --profile-name "$CDN_PROFILE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --origin "$STORAGE_ORIGIN" \
  --origin-host-header "$STORAGE_ORIGIN"

CDN_URL="https://${CDN_ENDPOINT_NAME}.azureedge.net"
echo "CDN URL: $CDN_URL"

# ============================================================
# Configure Container Apps with new environment variables
# ============================================================
echo ""
echo ">>> Configuring Container Apps with enterprise services..."

SERVICES=("api-gateway" "user-service" "product-service" "order-service" "notification-service")

for SERVICE in "${SERVICES[@]}"; do
  echo "Updating $SERVICE..."
  
  # Base env vars for all services
  ENV_VARS="KEY_VAULT_URL=$KEY_VAULT_URL APPINSIGHTS_CONNECTION_STRING=$APPINSIGHTS_CONNECTION_STRING"
  
  # Service-specific env vars
  case $SERVICE in
    product-service)
      ENV_VARS="$ENV_VARS REDIS_URL=$REDIS_URL AZURE_STORAGE_CONNECTION_STRING=$STORAGE_CONNECTION AZURE_STORAGE_CONTAINER_NAME=$STORAGE_CONTAINER"
      ;;
    order-service)
      ENV_VARS="$ENV_VARS SERVICE_BUS_CONNECTION_STRING=$SERVICE_BUS_CONNECTION"
      ;;
    notification-service)
      ENV_VARS="$ENV_VARS SERVICE_BUS_CONNECTION_STRING=$SERVICE_BUS_CONNECTION"
      ;;
  esac
  
  az containerapp update \
    --name "$SERVICE" \
    --resource-group "$RESOURCE_GROUP" \
    --set-env-vars $ENV_VARS \
    2>/dev/null || echo "  Warning: Could not update $SERVICE (may not exist yet)"
done

# Grant Container Apps managed identity access to Key Vault
echo ""
echo ">>> Setting up Key Vault access for Container Apps..."
for SERVICE in "${SERVICES[@]}"; do
  PRINCIPAL_ID=$(az containerapp show \
    --name "$SERVICE" \
    --resource-group "$RESOURCE_GROUP" \
    --query "identity.principalId" -o tsv 2>/dev/null)
  
  if [ -n "$PRINCIPAL_ID" ] && [ "$PRINCIPAL_ID" != "None" ]; then
    az keyvault set-policy \
      --name "$KEY_VAULT_NAME" \
      --object-id "$PRINCIPAL_ID" \
      --secret-permissions get list \
      2>/dev/null || echo "  Warning: Could not set policy for $SERVICE"
  else
    echo "  Enabling managed identity for $SERVICE..."
    az containerapp identity assign \
      --name "$SERVICE" \
      --resource-group "$RESOURCE_GROUP" \
      --system-assigned 2>/dev/null || true
    
    PRINCIPAL_ID=$(az containerapp show \
      --name "$SERVICE" \
      --resource-group "$RESOURCE_GROUP" \
      --query "identity.principalId" -o tsv 2>/dev/null)
    
    if [ -n "$PRINCIPAL_ID" ] && [ "$PRINCIPAL_ID" != "None" ]; then
      az keyvault set-policy \
        --name "$KEY_VAULT_NAME" \
        --object-id "$PRINCIPAL_ID" \
        --secret-permissions get list
    fi
  fi
done

# ============================================================
# Summary
# ============================================================
echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "Resources Created:"
echo "  Key Vault:        $KEY_VAULT_NAME"
echo "  App Insights:     $APP_INSIGHTS_NAME"
echo "  Service Bus:      $SERVICE_BUS_NAMESPACE"
echo "  Redis Cache:      $REDIS_NAME"
echo "  Storage Account:  $STORAGE_ACCOUNT_NAME"
echo "  CDN Endpoint:     $CDN_ENDPOINT_NAME"
echo ""
echo "Key Values:"
echo "  KEY_VAULT_URL:                    $KEY_VAULT_URL"
echo "  APPINSIGHTS_CONNECTION_STRING:    $APPINSIGHTS_CONNECTION_STRING"
echo "  SERVICE_BUS_CONNECTION_STRING:    (stored in Key Vault)"
echo "  REDIS_URL:                        (stored in Key Vault)"
echo "  AZURE_STORAGE_CONNECTION_STRING:  (stored in Key Vault)"
echo "  CDN_URL:                          $CDN_URL"
echo ""
echo "GitHub Secrets to add:"
echo "  KEY_VAULT_URL=$KEY_VAULT_URL"
echo "  APPINSIGHTS_CONNECTION_STRING=$APPINSIGHTS_CONNECTION_STRING"
echo ""
echo "All sensitive connection strings are stored in Key Vault"
echo "and will be loaded by the services at startup."
echo "============================================"
