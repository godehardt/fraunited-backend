require('dotenv').config({ path: './core/.env.local' });

//Switch to the 'admin' database and authenticate as root user
db = db.getSiblingDB('admin');
db.auth(process.env.MONGO_INITDB_ROOT_USERNAME, process.env.MONGO_INITDB_ROOT_PASSWORD);

// Switch to the 'robocup' database
db = db.getSiblingDB('robocup');
// Create a user with readWrite access to the 'robocup' database
let appuser = {
        user: process.env.ROBO_USER,
        pwd: process.env.ROBO_PASS,
        roles: ['readWrite']
};
db.createUser(appuser);
quit();