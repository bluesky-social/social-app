#!/bin/bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu focal stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
sudo apt update -y
nvm install 18
nvm use 18
sudo apt install -y git jq docker-ce
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
git clone https://github.com/bluesky-social/atproto
cd /atproto && npm install --global pnpm && make deps && make build && make run-dev-env
