const passport = require('passport')
const User = require('../model/user')

module.exports = function (app) {
    app.get('/logout', (req, res) => {
        req.logout()
        res.redirect('/')
    })
    app.get('/', (req, res) => {
        // console.log(req.user)
        if (req.isAuthenticated()) {
            res.render(process.cwd()+ '/views/chat.ejs', {username: req.user.username})
        } else {
            // console.log('not authenticated')
            res.render(process.cwd() + '/views/index.ejs')
        }
    })
    app.route('/register')
        .post((req, res, next) => {
            User.findOne({ username: req.body.username }, function (err, user) {
                if (err) {
                    next(err);
                } else if (user) {
                    res.redirect('/')
                } else {
                    const user = new User({ username: req.body.username, password: req.body.password })
                    user.save(function (err, result) {
                        if (err)
                            res.redirect('/')
                        else {
                            next(null, user)
                        }
                    })
                }
            })
        }, passport.authenticate('local'),
            (req, res) => {
                res.json(req.user)
            }
        )
    app.post('/login', passport.authenticate('local'), (req, res) => {
        console.log(req.user)
        res.redirect('/')
    })
}