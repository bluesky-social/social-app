FROM mcr.microsoft.com/vscode/devcontainers/base:ubuntu-22.04

RUN echo "Rename vscode user to bluesky" \
  && usermod --login bluesky --move-home --home /home/bluesky vscode \
  && groupmod --new-name bluesky vscode \
  && adduser bluesky sudo \
  && mv /etc/sudoers.d/vscode /etc/sudoers.d/bluesky \
  && sed -i 's/vscode/bluesky/g' /etc/sudoers.d/bluesky \
  && cat /etc/sudoers.d/bluesky

COPY .nvmrc /.nvmrc
RUN echo "Install dependencies" \
  && set -x && export DEBIAN_FRONTEND=noninteractive && apt-get update \
  && apt-get upgrade -yq \
  && apt-get install -yq curl \
  && curl -LsSf https://deb.nodesource.com/setup_$(cat /.nvmrc).x | bash \
  && apt-get install -y nodejs \
  && npm install -g npm \
  && npm install -g yarn
