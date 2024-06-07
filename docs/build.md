<!-- TOC start (generated with https://github.com/derlin/bitdowntoc) -->

- [Build instructions](#build-instructions)
   * [App Build](#app-build)
      + [Installation on Linux](#installation-on-linux)
      + [Installation on macOS](#installation-on-macos)
      + [Start Dev Server](#start-dev-server)
      + [Start Front Server](#start-front-server)
   * [Possible errors](#possible-errors)
      + [NVM not found](#nvm-not-found)
      + [Docker compose not found](#docker-compose-not-found)

<!-- TOC end -->

<!-- TOC --><a name="build-instructions"></a>
# Build instructions

<!-- TOC --><a name="app-build"></a>
## App Build

Necessary Programs:
- Git
- Nvm
- Jq
- Golang
- Docker

<!-- TOC --><a name="installation-on-linux"></a>
### Installation on Linux

For the installation and configuration of Docker, you can execute the following commands:
The package manager command can vary depending on the Linux distribution you are using. For Debian-based systems, use `apt`. For Arch Linux, use `pacman`. Other distributions may have their own specific package managers, such as `yum` for CentOS or `dnf` for Fedora.

```bash
sudo apt install git jq golang docker
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
nvm install 18
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod - aG docker $USER
reboot
```

<!-- TOC --><a name="installation-on-macos"></a>
### Installation on macOS

```bash
brew install git jq
curl -o- https:/raw.githubusercontent.com/nvm-sh/nvm/v0 .39.1/install.sh | bash
```

To proceed with the installation of Golang, you need to obtain the package from the official website of
Go ahead and follow the instructions provided. Similarly, this process would apply to the installation
from Docker.

<!-- TOC --><a name="start-dev-server"></a>
### Start Dev Server

The deployment process for **atproto** begins by cloning the repository from GitHub and navigating to the project directory. Next, the necessary tools (pnpm and yarn) are installed globally to manage dependencies. Subsequently, the Node.js environment is configured using NVM, the project dependencies are installed, and the source code is compiled. Finally, the development environment is launched, allowing work with atproto to begin in a fully configured and ready environment for development and testing.

> The following commands work on both Linux and MacOS.

```bash
git clone git@github.com:bluesky-social/atproto.git
cd at proto
npm install --global pnpm
npm install --global yarn
cd atproto
make nvm-setup
make deps
make build
make run-dev-env
```

If everything goes well, the following services should be displayed in the console.

| Puerto       | Servicio           |
|--------------|--------------------|
| localhost:2582 | DID Placeholder   |
| localhost:2583 | Personal Data     |
| localhost:34593 | Ozone server      |
| localhost:2584 | Bsky Appview      |
| localhost:35683 | Feed Generator    |
| localhost:40975 | Feed Generator    |

---

<!-- TOC --><a name="start-front-server"></a>
### Start Front Server

The deployment process for the **social-app** involves several steps. Firstly, navigating to the social-app directory, the project dependencies are installed using Yarn, followed by the building of the web application. Moving to the bskyweb directory, the Go module dependencies are updated and tidied. Then, the bskyweb executable is built with specified build tags. Finally, the bskyweb server is initiated with the designated appview host, ensuring the deployment is set up and ready to serve the application.

```bash
cd social-app
yarn && yarn build-web
cd bskyweb/
go mod tidy
go build -v -tags timetzdata -o bskyweb ./cmd/bskyweb
./bskyweb serve --appview-host=https://public.api.bsky.app
```

On build success, access the application at [http://localhost:8100/](http://localhost:8100/).

----

<!-- TOC --><a name="possible-errors"></a>
## Possible errors
<!-- TOC --><a name="nvm-not-found"></a>
### NVM not found
The issue lies in NVM not being available in the context of the make command because NVM is a shell script and not a globally installed application. This means that NVM needs to be loaded in every new shell instance that starts.
Below is the error output when running `make nvm-setup`:

```bash
> make nvm - setup
nvm install 18
/bin/bash: line 1: nvm : command not found
make : *** [Makefile:52: nvm-setup] Error 127
```

To fix this error, it is necessary to edit the Makefile and modify it as seen in the following code snippet.

```bash
> git diff Makefile
diff --git a/Makefile b/Makefile
index 2ec47b289..b9715896d 100644
--- a/Makefile
+++ b/Makefile
@@ -49,6 +49,7 @@ deps: ## Installs dependent libs using 'pnpm install'
 
.PHONY: nvm-setup
nvm-setup: ## Use NVM to install and activate node+pnpm
-       nvm install 18
-       nvm use 18
+       . $$NVM_DIR/nvm.sh; \
+       nvm install 18; \
+       nvm use 18; \
        npm install --global pnpm
```

<!-- TOC --><a name="docker-compose-not-found"></a>
### Docker compose not found
This error occurs because the project uses version 25.X or higher, which triggers the following error message:

```bash
> pnpm run start
@atproto/dev-env@0.3.14 start 
  /home/noroot/app/atproto/packages/dev-env  
  ../dev-infra/with-test-redis-and-db.sh node dist/bin.js

  unknown flag: --file                                             
  See 'docker --help'.
  Usage:  docker [OPTIONS] COMMAND                                 
...
ELIFECYCLE Command failed with exit code 125.
```

To resolve this issue, it's necessary to update to the latest version. Alternatively, you can modify the `docker-compose.yaml` file, replacing `docker compose` with `docker-compose`.
Additionally, you'll need to manually create a PostgreSQL database using the following command:

```bash
docker run --name bluesky -e POSTGRES_PASSWORD=password -e POSTGRES_USER=pg -e POSTGRES_DB=postgres -d -p 5433:5432 postgres
# Stop container
docker stop bluesky
# Start container
docker start bluesky
```
> If you still want to update Docker, you can use the following commands.

```sh
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian bullseye stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo usermod -aG docker $USER
```
