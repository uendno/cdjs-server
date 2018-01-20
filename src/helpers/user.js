const randomstring = require('randomstring');
const User = require('../models/User');

exports.prepareAdminUser = () => {
    // Prepare admin user
    return User.findOne({
        email: 'admin@cdjs.com'
    })
        .then(user => {
            if (!user) {
                const password = randomstring.generate();

                console.log("Initial username: admin@cdjs.com");
                console.log("Initial password: " + password);

                const admin = new User({
                    email: 'admin@cdjs.com',
                    password
                });

                return admin.save();
            }
        });
};