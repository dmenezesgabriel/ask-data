FROM node:lts-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV ZSH=/root/.oh-my-zsh

# Base packages + Playwright/Chromium system deps — single layer
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    ca-certificates \
    gnupg \
    git \
    zsh \
    make \
    # Chromium runtime deps for Playwright
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

ENV PNPM_HOME="/usr/local/share/pnpm"
ENV PATH="${PNPM_HOME}/bin:${PATH}"

# Install Oh My Zsh (non-interactive)
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# zsh-autosuggestions plugin
RUN git clone https://github.com/zsh-users/zsh-autosuggestions \
    ${ZSH}/custom/plugins/zsh-autosuggestions

RUN sed -i 's/plugins=(git)/plugins=(git zsh-autosuggestions)/' /root/.zshrc

# Set zsh as default shell
RUN chsh -s $(which zsh)

# Coding agents
RUN curl -fsSL https://claude.ai/install.sh | bash
ENV PATH="/root/.local/bin:${PATH}"
RUN claude --version
RUN pnpm add -g opencode-ai && opencode --version
RUN pnpm add -g @earendil-works/pi-coding-agent && pi --version

WORKDIR /workspace
