# Infrastructure as Code (IaC) Project with Terraform and AWS

This project uses [Terraform](https://developer.hashicorp.com/terraform/install) to manage and deploy infrastructure on AWS.

## Prerequisites

To execute this IaC, you will need:
1. [Terraform](https://developer.hashicorp.com/terraform/install) installed.
2. The **terraform.tfvars** file in each folder of the project configured with your AWS account variables.

### Required Variables

The following variables must be configured in the **terraform.tfvars** file:

- `aws_access_key`: Your AWS access key.
- `aws_secret_key`: Your AWS secret key.
- `key_name`: The name of the key pair generated in the EC2 service.
- `private_key_path`: The path to the private key file of the key pair.

These variables can be found once you have an [AWS account](https://aws.amazon.com).

## Steps to Deploy the Infrastructure

1. **Initialize the working directory**:

   Initializes a working directory containing Terraform configuration files.

   ```bash
   terraform init
   ```

2. **Develop an execution plan**:

   Generates an execution plan, showing the actions that will be taken to achieve the desired state of the infrastructure.

   ```bash
   terraform plan
   ```

3. **Apply the changes**:

   Applies the necessary changes to achieve the desired infrastructure state as defined in the configuration files.

   ```bash
   terraform apply
   ```

4. **Destroy the infrastructure**:

   Destroys the infrastructure managed by Terraform.

   ```bash
   terraform destroy
   ```
