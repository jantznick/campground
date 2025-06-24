# Troubleshooting Guide: Connecting Docker Services to External/Local Network Hosts

This document outlines a solution for a common development problem: a service running inside a Docker container (like our API) needs to communicate with another service running on the host machine or its local area network (LAN), but outside the Docker network.

## The Problem: `ECONNREFUSED` or Connection Timeouts

You may encounter errors like `ECONNREFUSED`, `ECONNRESET`, or connection timeouts when the API container tries to make a request to a URL like `http://localhost:9000` or `http://192.168.1.50:9000`.

This typically happens during development when:
- Integrating with an OIDC/SSO provider running locally for testing.
- Connecting to a database GUI running on the host machine.
- Accessing any other service that is on your local network but not within the `docker-compose` network.

### Root Cause: Docker Network Isolation

By default, `docker-compose` creates an isolated "bridge" network for your services. From inside the API container:
- `localhost` refers to the container itself, *not* the host machine.
- A LAN IP like `192.168.1.50` may not be reachable, depending on your operating system and Docker's networking implementation.

## The Solution: An Internal Reverse Proxy

The most reliable solution is to add a lightweight reverse proxy (like Nginx) to your `docker-compose` setup. This proxy sits on the same internal Docker network as your API container and is responsible for forwarding requests to the external service.

**How it works:**
1.  The **API Container** is configured to send requests to the proxy using its simple service name (e.g., `http://auth-proxy`).
2.  The **Nginx Proxy Container** receives the request.
3.  Nginx forwards (**proxies**) the request to the real destination on the local network, using a special Docker DNS name `host.docker.internal` which resolves to the host machine's IP address.

![Diagram of the Nginx proxy flow](https://i.imgur.com/gK2e5y7.png)


### Step 1: Create an `nginx.conf` file

Create a new configuration file for Nginx. You can place this anywhere, for example in a new `proxy/` directory at the project root.

**`proxy/nginx.conf`:**
```nginx
# This is a basic Nginx configuration for proxying requests.
# It listens on port 80 within the Docker network.

server {
    listen 80;
    # The server_name can be anything; it's used for internal resolution.
    server_name local-proxy;

    location / {
        # 'host.docker.internal' is a special DNS name provided by Docker
        # that resolves to the internal IP address of the host machine.
        # This makes the configuration portable across different machines.
        #
        # Replace 9000 with the actual port your external service is listening on.
        proxy_pass http://host.docker.internal:9000;

        # These headers are important for passing along original request info.
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 2: Update `docker-compose.yml`

Modify your `docker-compose.yml` to include the new Nginx proxy service and ensure both the API and the proxy are on the same network.

```yaml
# docker-compose.yml

services:
  # ... other services like db, web ...

  api:
    # ... existing api configuration ...
    environment:
      # Update the OIDC URL (or any other relevant URL)
      # to point to the nginx service name 'auth-proxy' on port 80.
      OIDC_DISCOVERY_URL: 'http://auth-proxy/.well-known/openid-configuration'
    networks:
      - app-network
    # Make sure the API service depends on the proxy
    depends_on:
      - auth-proxy

  auth-proxy:
    image: nginx:alpine
    container_name: local-auth-proxy
    # Mount the config file you created into the container.
    # The path on the left must match where you saved your file.
    volumes:
      - ./proxy/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

```

### Step 3: Rebuild and Restart

After saving the changes, run `docker-compose up --build` to rebuild your services with the new configuration. The API should now be able to successfully connect to your external service via the proxy.

## Final Consideration: Destination Firewall

If you implement the proxy and still face connection refused errors, the problem is almost certainly **not** with Docker networking. It means the destination service itself (e.g., the OIDC provider application at `http://host.docker.internal:9000`) is rejecting the connection.

Check the logs and configuration of that service. It may have a firewall or an IP allow-list that needs to be updated to accept requests coming from the Docker network's IP address range. 