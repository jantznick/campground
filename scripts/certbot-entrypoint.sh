#!/bin/bash
set -e

# This script runs on certbot container start. It will:
# 1. Check if a certificate exists.
# 2. If not, it will request one (requires nginx to be running).
# 3. Then it will start the auto-renewal process in the background.

DOMAIN="demo.campground.nickjantz.com"
EMAIL="thenickjantz@gmail.com"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
RSA_KEY_SIZE=4096

echo "### Certbot entrypoint started ###"

if [ -f "$CERT_PATH" ]; then
    echo "--> Certificate found for $DOMAIN. Skipping creation."
else
    echo "--> Certificate not found. Requesting one..."
    
    # We need a webroot to be available for the challenge.
    # Nginx in the web container provides this.
    certbot certonly \
        --webroot -w /var/www/certbot \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN" \
        --rsa-key-size "$RSA_KEY_SIZE"
    
    echo "--> Certificate obtained successfully."
fi

echo "--> Starting renewal check process..."
# Execute the command passed to the container, which is the renewal command.
exec "$@" 