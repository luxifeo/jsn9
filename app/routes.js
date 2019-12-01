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
            res.render(process.cwd()+ '/views/chat2.ejs', {username: req.user.username})
        } else {
            // console.log('not authenticated')
            res.render(process.cwd() + '/views/index.ejs')
        }
    })
    app.route('/register')
        .post((req, res, next) => {
            if(req.body.password != req.body.passwordConf) {
              return res.json({'error': 'The confirm is not correct'})
            }
            if(/\s+/.test(req.body.username) || /\s+/.test(req.body.password)) {
              return res.json({'error': 'Username and password must not contain spaces'})
            }
            User.findOne({ username: req.body.username }, function (err, user) {
                if (err) {
                    next(err);
                } else if (user) {
                    res.json({'error': 'The username is used'})
                } else {
                    const user = new User({ username: req.body.username, password: req.body.password })
                    user.save(function (err, result) {
                        if (err)
                            res.json({error: 'We can\'t save'})
                        else {
                            next(null, user)
                        }
                    })
                }
            })
        }, passport.authenticate('local', {failureRedirect: '/loginerror'}),
            (req, res) => {
                res.redirect('/')
            }
        )
    app.get('/loginerror', (req, res) => {
      res.json({error: 'Invalid username/password'})
    })
    app.post('/login', passport.authenticate('local', {failureRedirect: '/loginerror'}), (req, res) => {
        // console.log(req.user)
        res.redirect('/')
    })
}