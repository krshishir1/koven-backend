import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback', // Matches the route in auth.js
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      // This is the "verify" callback that runs on successful Google login
      const newUser = {
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        given_name: profile.name.givenName,
        family_name: profile.name.familyName,
        picture: profile.photos[0].value,
      };

      try {
        // Find user by their Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, update last login and pass them to Passport
          user.lastLogin = Date.now();
          await user.save();
          done(null, user);
        } else {
          // New user, create them in the database
          user = await User.create(newUser);
          done(null, user);
        }
      } catch (err) {
        console.error(err);
        done(err, null);
      }
    }
  )
);

// Stores just the user's MongoDB _id in the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Retrieves the full user object from the DB using the _id from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});