import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import { findUserByEmail, createUser } from './repository/auth.repository.js';
import logger from '../../shared/logger/logger.js';

dotenv.config();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-secret',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    const name = profile.displayName || profile.name?.givenName || 'Google User';
    const googleId = profile.id;

    if (!email) {
      return done(new Error("No email returned from Google profile"), false);
    }

    let user = await findUserByEmail(email);

    if (!user) {
      logger.info(`[Auth] Creating new user via Google OAuth for ${email}`);
      const newUser = {
        id: "user-" + Math.random().toString(36).substring(2, 11),
        email,
        googleId,
        password: "OAUTH_USER", // OAuth user account
        name,
        title: "New CareerPilot Student",
        targetRole: "Full-Stack Developer",
        xp: 0,
        level: 1,
        streak: 1,
        readinessScore: 35,
        streakHistory: [new Date().toISOString().split('T')[0]],
        skills: [],
        completedQuests: [],
        achievements: [],
        scores: {
          resume: 10,
          dsa: 10,
          projects: 10,
          communication: 10,
          interview: 10
        },
        onboarded: false
      };
      await createUser(newUser);
      user = newUser;
    } else if (!user.googleId) {
      user.googleId = googleId;
    }

    done(null, user);
  } catch (error) {
    logger.error("[Auth] Google Strategy Error:", error);
    done(error, false);
  }
}));

export default passport;
