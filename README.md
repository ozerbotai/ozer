# Ozer
Annoyed by WhatsApp voice messages? Convert them to text.

![Ozer chat](home-desktop-en.svg)

# Architecture
- Node.js
- Vanilla JS for the front end
- EJS (Embedded JavaScript templating) 
- SSL
- [Supabase](https://supabase.com)
- [Baileys](https://github.com/WhiskeySockets/Baileys)
- AWS EC2
- Visual Studio Code

# How to install and run on dev machine
- Get nodejs v20.11.1
- Clone this repo
- `cd ozer`
- `npm install`
- Create a supabase db and run `database-migration.sql`
- Create your own `.env.local` (See `.env.local.example`)
- `npx nodemon`

# How to use the service on dev machine
- Open http://localhost/connect on a browser
- Let Ozer get your profile from your google account.
- On the test phone, open WhatsApp, go to "Linked devices", "Link a device" and scan QR code shown on the web.
- Use another whatsapp account to send a "ping" text message to the test whatsapp account.
- Expect a "pong" message.
- Use another whatsapp account to send an audio message to the test whatsapp account.
- Expect the message to be converted to text.

# Setup a new deploy server 
- create an EC2 instance in AWS
- On aws configure the security group of the instance to allow inbound TCP connections from anyware-IPv4 to port 443
- `ssh -i /path-to-key.pem ubuntu@serverUrl`
- `sudo vi /etc/ssh/sshd_config`: uncomment `ClientAliveInterval` and set its value to `3600`, uncomment `ClientAliveCountMax` and set its value to `3`.
- `sudo service ssh restart`
- disconnect ssh and reconnect again
- Make sure your keys are present in `~/.ssh/authorized_keys`
- Make sure server contains github deploy key `.ssh/github`
- `eval "$(ssh-agent -s)"`
- `ssh-add ~/.ssh/github`
- `vi ~/.bashrc` and add these lines at the end
```
if [ -z "$SSH_AUTH_SOCK" ]; then
    eval "$(ssh-agent -s)"
fi
ssh-add ~/.ssh/github
cd ozer
PS1='\[\e[0;WHATEVER_COLOR_NUMBER_YOU_WANTm\]\u@WHATEVER_SERVER_NAME_YOU_WANT\[\e[m\]:\[\e[0;34m\]\w\[\e[m\]\$ '
```
- `git clone git@github.com:ozerbotai/ozer.git`
- `cd ozer`
- `sudo apt-get update`
- `sudo apt-get install libatk-bridge2.0-0 libcups2 libxkbcommon-x11-0 libxcomposite1`
- `sudo apt-get install libxdamage1 libxfixes3 libxrandr2`
- `sudo apt-get install libgbm-dev`
- `sudo apt-get install libpango-1.0-0 libpangocairo-1.0-0 libasound2`
- `chmod +x src/express-index.js`
- `sudo cp deployment/ozer.service /etc/systemd/system`
- `sudo vi /etc/systemd/system/ozer.service and edit --max-old-space-size=XXX`
- `sudo systemctl daemon-reload`
- `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
- close ssh session and connect again
- `nvm --version` (just to make sure it works)
- `nvm install v20.11.1`
- Create the server's `.env.local` (See `.env.local.example`)
- `npm install`
- Goto [How to install/renew the https certificate in a server](#how-to-installrenew-the-https-certificate-in-a-server), and follow the steps to create a https certificate
- connect another ssh terminal and run: `journalctl --follow -u ozer`
- `sudo systemctl enable ozer`
- `sudo systemctl restart ozer`

# Updgrade server OS version and packages
- `lsb_release -a`
- `./cli-utils/stop-aws.sh`
- `sudo apt-get update`
- `sudo unattended-upgrades --dry-run`
- `sudo unattended-upgrades`
- `sudo apt upgrade`
- `sudo apt dist-upgrade`
- `sudo apt full-upgrade`
- Consider upgrading nvm, node and npm versions
- `sudo reboot`

# Deploy to a server
- `ssh -i /path-to-key.pem ubuntu@serverIpOrDomainName`
- `./cli-utils/stop-aws.sh`
- `git pull`
- Check `database-migration.sql`, see if there is a migration to be executed.
- `rm -rf node_modules` (optional)
- `npm install`
- make sure `.env.local` is up to date
- connect another ssh terminal and run: `./cli-utils/log-follow.sh`
- `./cli-utils/restart-aws.sh`
- create a tag with the code that is being deployed, e.g. `staging-2024-05-27-14-39`
- push the tag to github

# View the server logs
- To see logs in real time: `./cli-utils/log-follow.sh`
- To see past logs: `./cli-utils/log-vi.sh`
- To see past logs with word wrap: `./cli-utils/log-word-wrap.sh` 

# Delete server logs
- `sudo journalctl --rotate`
- `sudo journalctl --vacuum-time=1s`

# Whatsapp library (baileys)
- https://whiskeysockets.github.io/docs/intro
- We use a custom version of the library hosted on https://github.com/ozerbotai/baileys
- We use github packages to host the npm custom package.


# How to install/renew the https certificate in a server

- Enable port 80 in aws server
  - Go to AWS console.
  - Go to EC2
  - Go to instances
  - Click on the instance in which you want to enable port 80 (Not in a link, just in any part of the row)
  - Click on "Security"
  - Click on the link under "Security groups"
  - Click on "Edit inbound rules"
  - "Add rule"
  - Type: "HTTP"
  - Source: "Anywhere-IPV4" 
  - Click on "Save Rules"
- Stop Ozer
  - `sudo systemctl stop ozer`
- install certbot to get a https certificate
  - `sudo apt-get install -y certbot`
- Reboot server (If necessary)
  - `sudo reboot`
- When rebooted, reconnect to server by SSL
- Create server's firewall rules por https (port 443)
- Get https certificate
  - `sudo certbot certonly --standalone -d serverDomain`
  - When asked for data, fill up the fields
- Copy both certificate files to /ozer/certs
  - `cd ~/ozer`
  - `mkdir certs` (if folder certs does not exists)
  - `cd certs`
  - `sudo cp /etc/letsencrypt/live/serverDomain/fullchain.pem .`
  - `sudo cp /etc/letsencrypt/live/serverDomain/privkey.pem .`
- Give permission to the files.
  - `cd ~/ozer/certs`
  - `sudo chmod 644 fullchain.pem`
  - `sudo chmod 644 privkey.pem`
- allow Node to run in a port under 1024 
  - `sudo setcap 'cap_net_bind_service=+ep' $(which node)`
- If necessary, add the following keys to the .env.local file
  - `SSL_KEY=./certs/privkey.pem`
  - `SSL_CERT=./certs/fullchain.pem`
  - `PORT=443`
- Restart Ozer
  - `sudo systemctl restart ozer`
- Disable port 80 in aws server (opposite directions to the ones in "Enable port 80 in aws server")

# How to install/renew a https certificate in the local machine for development

- `mkdir -p ~/ssl`
- `cd ~/ssl`
- `openssl req -nodes -new -x509 -keyout server.key -out server.cert -days 365`
- Complete values paths in `SSL_KEY` and `SSL_CERT` in `.env.local`

# Graceful shutdown debug
- On staging and prod you can use `./cli-utils/stop-aws.sh` for a graceful shutdown
- If something prevents the server from a graceful shutdown you can debug that in the dev environment.
- To graceful shutdown Ozer in a dev machine: `kill $(ps -ef | grep express-index | grep -v grep | awk '{print $2}')`
- To debug what is preventing Ozer from shutting down:
  - `package.json`: Add `"why-is-node-running": "^2.2.2"` dependency
  - `express-index.js`:
```
  httpsServer.close(() => {
    ...
    console.log('Finished destroying baileys connections.');
    setTimeout(function () {
      const log2 = require('why-is-node-running')
      log2() // logs out active handles that are keeping the process running
    }, 5000);
  });
```
# Contributors
- [Ramiro Monllor](https://github.com/ramiro-monllor)
- [Gabriel Reiter](https://github.com/gabireiter)
- [Oscar Guindzberg](https://github.com/oscarguindzberg)
