import passport from "passport";
import local from "passport-local";
import userModel from "../dao/models/users.model.js";
import { createHash, isCorrect } from "../utils.js";
import githubService from "passport-github2";
import jwt from "passport-jwt";

const LocalStrategy = local.Strategy;
const JwtStrategy = jwt.Strategy;
const ExtractJwt = jwt.ExtractJwt;

const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["coderCookieToken"];
  }
  return token;
};

const initPassport = () => {
  passport.use(
    "jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
        secretOrKey: "secretCode",
      },
      async (jwt_payload, done) => {
        try {
          return done(null, jwt_payload);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(
    "github",
    new githubService(
      {
        clientID: "Iv1.f404a03d79d38515",
        clientSecret: "266d2064da8d10c6ffccb3e18543d80618d3f255",
        callbackURL: "http://localhost:8080/api/session/githubcallback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log(profile);
          const user = await userModel.findOne({ email: profile._json.email });
          if (!user) {
            const newUser = {
              firstName: profile._json.name,
              lastName: "",
              email: profile._json.email,
              password: "",
            };
            const result = await userModel.create(newUser);
            return done(null, result);
          } else {
            return done(null, user);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(
    "register",
    new LocalStrategy(
      { passReqToCallback: true, usernameField: "email" },
      async (req, username, password, done) => {
        const { firstName, lastName, email } = req.body;
        try {
          const user = await userModel.findOne({ email: username });
          if (user) {
            console.log("The user is already registered");
            return done(null, false);
          }
          const newUser = {
            firstName,
            lastName,
            email,
            password: createHash(password),
          };
          const result = await userModel.create(newUser);
          return done(null, result);
        } catch (error) {
          return done("Error getting user" + error);
        }
      }
    )
  );

  passport.use(
    "login",
    new LocalStrategy(
      { passReqToCallback: true, usernameField: "email" },
      async (req, username, password, done) => {
        try {
          const user = await userModel.findOne({ email: username });
          if (!user) {
            console.log("The user don't exist");
            return done(null, false);
          }
          if (!isCorrect(user, password)) return done(null, false);

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser(async (id, done) => {
    const user = await userModel.findById(id);
    done(null, user);
  });
};

export default initPassport;
