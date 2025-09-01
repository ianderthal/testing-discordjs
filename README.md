## Setup

- create a directory on your server and move into it
- `git clone` the repo
- run `npm install` to install dependencies
-
- Separate `.env` will development and production tokens. Copy `.env.sample` and rename `.env.development` and `.env.production`, filling in the token values.
- copy `.config.sample.json` and rename to `.config.development.json` and `.config.production.json` to create config files
  - credentials can be found in discord app hub
  - copy and paste credentials into the files
  - copy the correct application ID into the correct files
- `NODE_ENV=development node deploy-commands.js` for commands
- `NODE_ENV=production node index.js` to start the server