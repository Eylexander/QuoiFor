const chalk = require('chalk');
const moment = require('moment');

// Initalise the database
const fs = require('fs');
const db = require('better-sqlite3');

// Create better console logs
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports = async (client) => {

    // Initiate the database
    if (!fs.existsSync('./database')) { fs.mkdirSync('./database'); };
    const cnt = new db('./database/counter.sqlite');
    const data = new db('./database/data.sqlite');
    const trig = new db('./database/triggers.sqlite');

    // Define the counter.sqlite database for the system
    const counter = cnt.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'counter';").get();
    if (!counter['count(*)']) {
        cnt.prepare("CREATE TABLE counter (id TEXT PRIMARY KEY, tag TEXT, number NUMBER);").run();
        // Ensure that the "id" row is always unique and indexed.
        cnt.prepare("CREATE UNIQUE INDEX idx_counter_id ON counter (id);").run();
        cnt.pragma("asynchronous = 1");
        cnt.pragma("journal_mode = wal");
    }

    // Define the data.sqlite database for the system
    const dataDB = data.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'data';").get();
    if (!dataDB['count(*)']) {
        data.prepare("CREATE TABLE data (id INTEGER PRIMARY KEY AUTOINCREMENT, quoi TEXT);").run();
        // Ensure that the "id" row is always unique and indexed.
        data.prepare("CREATE UNIQUE INDEX idx_data_id ON data (id);").run();
        data.pragma("asynchronous = 1");
        data.pragma("journal_mode = wal");
    }

    // Define the triggers.sqlite database for the system
    const triggers = trig.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'triggers';").get();
    if (!triggers['count(*)']) {
        trig.prepare("CREATE TABLE triggers (id INTEGER PRIMARY KEY AUTOINCREMENT, trigger TEXT);").run();
        // Ensure that the "id" row is always unique and indexed.
        trig.prepare("CREATE UNIQUE INDEX idx_triggers_id ON triggers (id);").run();
        trig.pragma("asynchronous = 1");
        trig.pragma("journal_mode = wal");
    }

    log(chalk.green(`Logged in as ${client.user.tag}!`));

    setInterval(async () => {
        await client.user.setActivity("Quoi ?");
        await client.user.setStatus('online');
    }, 1000);
};