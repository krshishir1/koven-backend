import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback', 
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      
      const newUser = {
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        given_name: profile.name.givenName,
        family_name: profile.name.familyName,
        picture: profile.photos[0].value,
      };

      try {
        
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          
          user.lastLogin = Date.now();
          await user.save();
          done(null, user);
        } else {
          
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


passport.serializeUser((user, done) => {
  done(null, user.id);
});


passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});