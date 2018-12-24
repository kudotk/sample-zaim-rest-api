const express = require('express')
const cors = require('cors')
const passport = require('passport')
const OAuth1Strategy = require('passport-oauth1')
const session = require('express-session')
const morgan = require('morgan')
const oauth = require('oauth').OAuth
const config = require('config')
const bodyParser = require('body-parser');

/**
 * Environment
 */

// zaim OAuthパラメータ
const zaimOauthOptions = {
    requestTokenURL: 'https://api.zaim.net/v2/auth/request',
    accessTokenURL: 'https://api.zaim.net/v2/auth/access',
    consumerKey: config.get('zaim.consumerId'),
    consumerSecret: config.get('zaim.consumerSecret'),
    signatureMethod: "HMAC-SHA1",
}

// zaim他パラメータ
const zaim = {
    oauth1StrategyOptions: Object.assign(zaimOauthOptions,
        {
            userAuthorizationURL: 'https://auth.zaim.net/users/auth',
            callbackURL: "http://127.0.0.1:4000/auth/callback",
        }),

    // Zaim user oauth token which passport sets
    userToken: config.get('zaim.userToken'),
    userTokenSecret: config.get('zaim.userTokenSecret')
}


/**
 * Express
 */
const app = express()
app.use(cors())
app.use(morgan('short'))
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'pug')


/**
 * Passport
 */
passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))
passport.use(new OAuth1Strategy(zaimOauthOptions,
    function (token, tokenSecret, profile, done) {
        zaim.userToken = token
        zaim.userTokenSecret = tokenSecret
        return done(null, profile)
    }
));
app.use(passport.initialize())
app.use(passport.session())


/**
 * Session
 */
const sessionOptions = {
    secret: 'keyboard cat',
    cookie: {},
    resave: false,
    saveUninitialized: true
}
if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sessionOptions.cookie.secure = true // serve secure cookies
}
app.use(session(sessionOptions))


/**
 * Routing
 */

// index
app.get('/', (req, res) => {
    res.render('index', {})
});

// 認証
app.get('/auth', passport.authenticate('oauth'));

app.get('/auth/callback',
    passport.authenticate('oauth', {failureRedirect: '/'}),
    function (req, res) {
        res.render('auth-callback', {
            token: zaim.userToken,
            tokenSecret: zaim.userTokenSecret
        })
    });


// zaim OAuth認証情報ヘッダ
const oauthHeader = new oauth(
    zaimOauthOptions.requestTokenURL,
    zaimOauthOptions.accessTokenURL,
    zaimOauthOptions.consumerKey,
    zaimOauthOptions.consumerSecret,
    '1.0A',
    null,
    zaimOauthOptions.signatureMethod
);

// ユーザー情報取得
app.get('/user/info', (req, res) => {
    oauthHeader.get(
        'https://api.zaim.net/v2/home/user/verify',
        zaim.userToken,
        zaim.userTokenSecret,
        function (e, data, zaimRes) {
            if (e) console.error(e);
            res.render('result', {
                result: JSON.stringify(JSON.parse(data), null, '  ')
            })
        });
})

// 指定カテゴリの合計金額取得
app.post('/category/total', (req, res) => {
    const category = req.body.category

    oauthHeader.get(
        'https://api.zaim.net/v2/home/category',
        zaim.userToken,
        zaim.userTokenSecret,
        function (e, data, zaimRes) {
            if (e) {
                console.log(e)
                return
            }

            const json = JSON.parse(data)
            let categoryId
            json.categories.some((elm) => {
                if (elm.name === category) {
                    categoryId = elm.id
                    return true
                }
                return false
            })
            if (!categoryId) {
                res.render('result', {
                    result: "カテゴリが見つかりませんでした"
                })
                return
            }

            let total = 0
            const params = '?mapping=1&category_id=' + categoryId + '&mode=payment'
            oauthHeader.get(
                'https://api.zaim.net/v2/home/money' + params,
                zaim.userToken,
                zaim.userTokenSecret,
                function (e, data, zaimRes) {
                    const json = JSON.parse(data)
                    json.money.forEach((elm) => {
                        total += elm.amount
                    })
                    res.render('result', {
                        result: JSON.stringify(JSON.parse('{ "totalAmount": ' + total + '}'), null, '  ')
                    })
                })

        });
})

app.listen(4000)
