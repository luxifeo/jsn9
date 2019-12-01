const passport = require('passport');
const User = require('../model/user')
const LocalStrategy = require('passport-local').Strategy;

module.exports = function (app) {
    app.use(passport.initialize());
    app.use(passport.session());
    passport.serializeUser(function (user, done) {
        done(null, user.id)
    })
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user)
        })
    })
    passport.use(new LocalStrategy(
        function (username, password, done) {
            User.authenticate(username, password, function (err, user) {
                if (err)
                    return done(err)
                if (!user) return done(null, false);
                return done(null, user)
            })
        }))
}