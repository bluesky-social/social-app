#!/bin/bash
# Añadir la clave GPG para Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
# Añadir el repositorio de Docker
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu focal stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
# Actualizar el sistema
sudo apt update -y
# Iniciar y habilitar Docker
sudo apt install -y docker-ce 
sudo systemctl start docker
sudo systemctl enable docker
# Añadir el usuario ubuntu al grupo docker
sudo usermod -aG docker ubuntu
# Descargar y ejecutar la imagen Docker
sudo docker pull public.ecr.aws/t8b2r8w9/social-app:latest
sudo docker run -d --name social-app -p 80:8100 public.ecr.aws/t8b2r8w9/social-app:latest /bin/sh -c "/usr/bin/bskyweb serve"
# Configurar iptables para redirigir el tráfico del puerto 80 al 8100
sudo iptables -A PREROUTING -t nat -i enX0 -p tcp --dport 80 -j REDIRECT --to-port 8100
#sudo netfilter-persistent save