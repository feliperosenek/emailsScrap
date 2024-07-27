# Use a imagem oficial do Node.js como base
FROM node:18

# Atualizar o sistema e instalar dependências adicionais
RUN apt-get update && apt-get install -y \
  curl \
  git \
  libasound2 \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libpango1.0-0 \
  libxshmfence1 \
  libglu1-mesa \
  libxtst6 \
  libx11-xcb1 \
  libxrender1 \
  libxi6 \
  libdbus-glib-1-2 \
  libxfixes3 \
  libxcursor1 \
  libxss1 \
  libglib2.0-0 \
  libnss3-dev \
  libgconf-2-4 \
  libgtk-3-0

# Instalar nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash

# Configurar as variáveis de ambiente para nvm e node
ENV NVM_DIR /root/.nvm
ENV NODE_VERSION 18

# Instalar o Node.js usando nvm
RUN bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm use $NODE_VERSION && nvm alias default $NODE_VERSION"

# Definir o diretório de trabalho no contêiner
WORKDIR /app

# Clonar o repositório
RUN git clone https://github.com/feliperosenek/emailsScrap.git .

# Navegar até o diretório do repositório
WORKDIR /app/emailsScrap

# Instalar as dependências do projeto
RUN npm install

# Comando para iniciar a aplicação
CMD ["npm", "start"]

# Expor a porta em que a aplicação estará rodando
EXPOSE 3000
