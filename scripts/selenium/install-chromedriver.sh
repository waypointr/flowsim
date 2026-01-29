#!/bin/bash

# wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - 

# wget --no-check-certificate -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
# echo "deb http://dl.google.com/linux/chrome/deb/ stable main" | tee -a /etc/apt/sources.list.d/google-chrome.list
# apt-get update -qqy
# apt-get install -y google-chrome-stable=114.0.5735.90-1

# # INSTALL_VERSION="114.0.5735.90"
# # wget --no-verbose -O /tmp/chrome.deb https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${INSTALL_VERSION}-1_amd64.deb \
# #   && apt install -yqq --allow-downgrades fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 libgtk-4-1 libnspr4 libnss3 libu2f-udev libvulkan1 libxcomposite1 libxdamage1 libxfixes3 libxkbcommon0 libxrandr2 xdg-utils \
# #   && apt install -y --allow-downgrades /tmp/chrome.deb \
# #   && rm /tmp/chrome.deb

# CHROME_VERSION=$(google-chrome-stable --version)
# CHROME_FULL_VERSION=${CHROME_VERSION%%.*}
# CHROME_MAJOR_VERSION=${CHROME_FULL_VERSION//[!0-9]}
# rm /etc/apt/sources.list.d/google-chrome.list
# CHROMEDRIVER_VERSION=$(curl -s https://chromedriver.storage.googleapis.com/LATEST_RELEASE_"${CHROME_MAJOR_VERSION%%.*}")
# export CHROMEDRIVER_VERSION
# curl -L -O "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip"
# unzip chromedriver_linux64.zip && chmod +x chromedriver && mv chromedriver /usr/local/bin
# chromedriver -version
# which chromedriver
# which google-chrome
# rm -f chromedriver chromedriver_linux64.zip LICENSE.chromedriver
