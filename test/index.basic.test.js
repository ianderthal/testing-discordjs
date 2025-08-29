// test/index.basic.test.js
const { expect } = require('chai');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

describe('Discord bot basic setup', function () {
  it('should create a Discord client with commands collection', function () {
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.commands = new Collection();

    expect(client).to.be.an.instanceOf(Client);
    expect(client.commands).to.be.instanceOf(Collection);
  });

});
