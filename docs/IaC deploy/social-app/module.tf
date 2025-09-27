# Variables
variable "aws_access_key" {}
variable "aws_secret_key" {}
variable "key_name" {}
variable "private_key_path" {}
variable "region" {
  default = "us-east-1"
}

# Provider
provider "aws" {
  region     = var.region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

# Resources
# Ami
resource "aws_instance" "ec2-social-app" {
  instance_type = "t2.micro"
  ami           = "ami-04b70fa74e45c3917"
  key_name      = var.key_name
  user_data     = file("userdata.tpl")

  vpc_security_group_ids = [aws_security_group.security-socialapp.id]

  tags = {
    Name = "ec2-social-app"
  }
}

# Default VPC
resource "aws_default_vpc" "default" {}

# Security group
resource "aws_security_group" "security-socialapp" {
  name        = "security-socialapp"
  description = "allow ssh on 22 & http on port 80"
  vpc_id      = aws_default_vpc.default.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
    egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Output
output "instance_id" {
  value = aws_instance.ec2-social-app.id
}

output "instance_public_ip" {
  value = aws_instance.ec2-social-app.public_ip
}

output "aws_instance_public_dns" {
  value = aws_instance.ec2-social-app.public_dns
}
