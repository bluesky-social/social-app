
# Project Overview

This document details the necessary procedures to implement the BlueSky social network on AWS, utilizing IAM, EC2, and ECR services, and automating the workflow via GitHub Actions. Additionally, it presents a method to automate this deployment without the need for direct interaction with the AWS web interface.

Figure 1 illustrates the workflow for continuous deployment on AWS, where GitHub Actions is used to automate code deployment to ECR. However, IAM and EC2 must be configured manually.

![Deployment Architecture](https://raw.githubusercontent.com/debiantano/temp/main/6.PNG)
*Figure 1: Deployment Architecture*

# Testing with GitHub Actions

There are two workflows for the testing process, as shown in Figure 2.

## Golang Test

This GitHub Actions workflow, defined in the file **golang-test-lint.yaml**, is triggered by **pull request** and **push** events to the `main` branch and runs concurrently to perform build, test, and linting tasks in an Ubuntu environment. It consists of two jobs: `build-and-test` and `lint`.

In `build-and-test`, code verification is performed with `make check`, the binary is compiled with `make build`, and tests are executed with `make test` after configuring Go and simulating the presence of static files.

In the `lint` job, after configuring Go and simulating static files, `make lint` is executed to analyze the code for style and quality issues.

## Lint

This GitHub Actions workflow, called **lint.yml**, runs on every **pull request** and **push** to the `main` branch. It has two jobs: `linting` and `testing`. In the `linting` job, the code is checked out from the repository, dependencies are installed with Yarn, and various checks are executed: linters, Prettier, internationalization compilation, and type checking. In the `testing` job, the code is also checked out and dependencies are installed, compiled, and then tests are run with the Node environment already configured.

![Testing Workflows](https://github.com/debiantano/temp/blob/main/7.PNG)
*Figure 2: Testing Workflows*

# AWS Configuration

## Creating an IAM Account

To configure the cloud environment, having an AWS account is essential. Within AWS, the IAM (Identity and Access Management) service allows for the creation of users with the necessary permissions. It is crucial to create a specific user and assign the appropriate permissions. Additionally, an access key must be generated to authenticate the user via **AWS CLI** and **Terraform**.

As shown in Figure 3, full access to AWS services has been granted to avoid any authorization issues.

![Full Access Policy in AWS](https://github.com/debiantano/temp/blob/main/1.PNG)
*Figure 3: Full Access Policy in AWS*

## ECR Configuration

Amazon ECR (Elastic Container Registry) is an AWS service for storing, managing, and deploying Docker containers.

In this section, a private repository named `bskyweb` will be created. It is crucial that the repository is private and has exactly this name, as any discrepancy will cause errors in the GitHub configured workflow, as illustrated in Figure 4.

![Creating a Private Repository in ECR](https://github.com/debiantano/temp/blob/main/2.PNG)
*Figure 4: Creating a Private Repository in ECR*

From this point, the workflow named **build-and-push-bskyweb-aws** will run automatically whenever a `push` is made to the `main` branch. It verifies credentials and the repository; if valid, it performs a series of steps in Ubuntu: code checkout, Docker configuration, registry login, metadata extraction, outputs configuration, and finally, Docker image build and push. If the repository is invalid, the process fails and shows an error. The workflow ends with the successful deployment of the image or a workflow failure. The description of this workflow is illustrated in Figure 5.

![Workflow for Creating the Bluesky Image](https://github.com/debiantano/temp/blob/main/8.PNG)
*Figure 5: Workflow for Creating the Bluesky Image*

## Amazon EC2 Configuration

Amazon EC2 is an AWS service that provides scalable computing capacity in the cloud, allowing for the creation and management of virtual servers.
Two instances will be created: one for `atproto` and another for `social-app`.

![Creating Instances](https://github.com/debiantano/temp/blob/main/4.PNG)
*Figure 6: Creating Instances*

In the `atproto` instance, the following build commands should be executed:

```bash
sudo apt install git jq golang docker
NVM=https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh
curl -o- $NVM | bash
sudo systemctl enable docker
sudo systemctl start docker
git clone https://github.com/bluesky-social/atproto
cd atproto
npm install --global pnpm
make nvm-setup
make deps
make build
make run-dev-env
```

In the `social-app` instance, the following commands should be executed:

```bash
sudo apt install -y docker-ce 
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
sudo docker pull public.ecr.aws/t8b2r8w9/social-app:latest
sudo docker run -d --name social-app -p 80:8100 public.ecr.aws/t8b2r8w9/social-app:latest /bin/sh -c "/usr/bin/bskyweb serve"
sudo iptables -A PREROUTING -t nat -i enX0 -p tcp --dport 80 -j REDIRECT --to-port 8100
```

## Application Deployment

Figure 7 shows the architecture of the BlueSky application hosted on AWS. Users access the 'social-app' through port 80. Within AWS, 'social-app' communicates with 'at-proto' on port 2583, which in turn connects to an external service called Render on port 5432. Render hosts a PostgreSQL database. The 'at-proto' component also uses port 2581 internally. This structure allows the separation of the user interface, business logic, and data storage into different interconnected services.

![Cloud Deployment](https://github.com/debiantano/temp/blob/main/9.PNG)
*Figure 7: Cloud Deployment*

# Infrastructure as Code

Another automated way to perform the deployment is by applying Infrastructure as Code using Terraform.

This will allow the creation of the entire infrastructure without the need to manually create EC2 instances, security groups, or open ports.

![Infrastructure as Code](https://github.com/debiantano/temp/blob/main/5.PNG)
*Figure 8: Infrastructure as Code*

To carry out this procedure, a new repository dedicated to Terraform has been established. This repository is structured into two separate folders: one for `social-app` and another for `atproto`.

\[
\boxed{
\text{Terraform Repository}
}
\]

It is essential to have Terraform installed on your local machine, adjust the AWS user variables, and run the commands detailed below:

```bash
terraform init
terraform plan
terraform apply
```

These commands will start the process of building all the necessary infrastructure without the need to access the AWS web interface.

