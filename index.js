import express from "express";
import apiRouter from "./router/api.mjs"

import passport from "passport";
import LocalStrategy from "passport-local";
import gs from "passport-github2";
const GitHubStrategy = gs.Strategy;
import session from 'express-session';
import bodyParser from 'body-parser';

import https from "https";
https.globalAgent.options.rejectUnauthorized = false;

const app = express();

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}));

app.use(bodyParser.urlencoded({ extended: false }));

console.log(process.env.GITHUB_CLIENT_ID);
console.log(process.env.GITHUB_CLIENT_SECRET);

let githubStrategy = new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log('Github user profile')
    console.dir(profile);
    let localRegisteredUsers = ["jackhclee"];

    if (localRegisteredUsers.includes(profile.username)) {
        console.log(`OK I find the user ${profile.username}`)
        return done(null, {id: profile.id, username: profile.username})
    }
    // User.findOrCreate({ githubId: profile.id }, function (err, user) {
    //   return done(err, user);
    // });
  }
);

// passport.use(new LocalStrategy(function (username, password, cb) {
//     console.log(`username ${username}`)
//     console.log(`password ${password}`)
//     return cb(null, { id: 1, username: "jack" })
// }))

passport.use(githubStrategy)

app.get('/auth/github',
  passport.authenticate('github', { scope: [ 'user:email' ] }));

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    console.log("/auth/github/callback called")
    res.redirect('/protected');
  });

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        console.log(`serializeUser`)
        cb(null, { id: user.id, username: user.username });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        console.log(`deserializeUser`)
        return cb(null, user);
    });
});

app.use(passport.session());

app.get("/login", (req, res) => {
    res.send(`
    <html>
    <head></head>
    <body>
    <h1>Sign in</h1>
    <a href="/auth/github">Github</a><br />
    or Local
<form action="/login/password" method="post">
    <section>
        <label for="username">Username</label>
        <input id="username" name="username" type="text" autocomplete="username" required autofocus>
    </section>
    <section>
        <label for="current-password">Password</label>
        <input id="current-password" name="password" type="password" autocomplete="current-password" required>
    </section>
    <button type="submit">Sign in</button>
    ${req.session.messages}
</form>
</body>
</html>
    `)
})

app.post('/login/password', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureMessage: true
}));

app.get("/protected", (req, res) => {
    console.log(`req.user ${req.user}`);
    console.dir(req.user);
    if (req.user) {
        res.send(`You are authenticated! ${req.user.username}`)
    } else {
        res.redirect("/auth/github")
    }
})

app.post('/login/passwordd', (req, res) => {
    console.log(req.body)
});

app.use("/api", apiRouter)

app.listen(3000);