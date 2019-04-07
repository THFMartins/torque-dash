const express = require('express');
const router = express.Router();
const Log = require('../../models').Log;
const User = require('../../models').User;
const Session = require('../../models').Session;
const keysMap = require('../../torquekeys');
const util = require('../../util/util');
const _ = require('lodash');
const moment = require('moment');

// Torque sends data through GET request rather than post
router.get('/', async (req, res) => {
    console.log('---------------------');
    console.log(req.query.kff1005);
    console.log(req.query.kff1006);
    console.log('---------------------');

    let { eml, session, time } = req.query;
    let lon = req.query.kff1005;
    let lat = req.query.kff1006;

    // check for duplicate gps values (when selected always send in settings + choosing pid in pid list)
    if (Array.isArray(lon)) lon = lon[0];
    if (Array.isArray(lat)) lat = lat[0];

    try {
        // Check if request has gps position data - filters out meta logs
        if(lon == null || lat == null) return res.status(200).send('OK!');

        // Check if user exists
        let user = await User.findOne({ where: { email: eml } });
        if (!user) return res.status(403).send('Invalid user account.');
            
        //Check if session already exists or create new
        let currentSession = await Session.findOrCreate({
            where: { sessionId: session } ,
            defaults: { userId: user.id }
        });

        //Check if timestamp already exists as torque app is spamming multiple requests
        let timestamp = moment(time, 'x').format('YYYY-MM-DD hh:mm:ss');
        let log = await Log.findOne({
            where: {
                sessionId: currentSession[0].dataValues.id,
                timestamp: timestamp,
            }
        });
        if(log) return res.status(403).send('Duplicate entry.');

        // Create values json by filtering out non pid values and renaming ( kd => speed )
        let values = _.omit(req.query, ['eml', 'v', 'session', 'id', 'time', 'kff1005', 'kff1006'])
        values = util.renameKeys(keysMap, values);

        // Create log in database
        log = await Log.create({
            sessionId: currentSession[0].dataValues.id,
            timestamp: timestamp,
            lon: lon,
            lat: lat,
            values: values
        });
        if (log) res.status(200).send('OK!');
    } catch (err) {
        console.log(err.message);
    }
});

module.exports = router;