#!/bin/bash

# ============================================================
# ShopEase - Cleanup Script
# Removes all Azure resources to avoid charges
# ============================================================

set -e

RESOURCE_GROUP="shopease-rg"

echo "WARNING: This will delete ALL resources in resource group '$RESOURCE_GROUP'"
read -p "Are you sure? (y/N): " confirm

if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
  echo "Deleting resource group $RESOURCE_GROUP..."
  az group delete --name $RESOURCE_GROUP --yes --no-wait
  echo "Resource group deletion initiated. This may take a few minutes."
else
  echo "Cancelled."
fi
