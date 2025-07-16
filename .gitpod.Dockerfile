FROM gitpod/workspace-full

# تثبيت Chromium
RUN sudo apt-get update && \
    sudo apt-get install -y chromium-browser
