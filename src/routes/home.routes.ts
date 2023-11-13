import {Router, Request, Response} from 'express';
import pool from '../db';
import ipBlacklist from '../middleware/ipBlacklist';
import {
  clearIpAddressFromIpBlacklistOnSuccessfulLogin,
  getByUsername,
  updateIpBlacklistOnFailedLoginAttempt
} from '../db/queryHelper';

const homeRoutes = Router();

homeRoutes.get('/', (req, res) => {
  res.render('home', {
    sqlInjectionEnabled: false,
    sqlInjectionFormSubmitted: false,
    brokenAuthenticationEnabled: false,
    brokenAuthenticationFormSubmitted: false,
    error: undefined
  });
});

homeRoutes.post('/sqlInjection', (req, res) => {
  const vulnerabilityOn = !!req.body.sqlInjectionVulnerability;

  (async () => {
    const sql = vulnerabilityOn ? `SELECT * FROM users WHERE username = '${req.body.username}' AND password = '${req.body.password}';` :
      `SELECT * FROM users WHERE username = $1 AND password = $2;`;

    try {
      const params = vulnerabilityOn ? [] : [req.body.username, req.body.password];
      const result = await pool.query(sql, params);

      if (result.rowCount && result.rowCount > 0) {
        const userData = result.rows;

        res.render('home', {
          sqlInjectionEnabled: vulnerabilityOn,
          sqlInjectionFormSubmitted: true,
          userData: JSON.stringify(userData),
          brokenAuthenticationEnabled: false,
          brokenAuthenticationFormSubmitted: false,
          error: undefined
        });

      } else {
        res.render('home', {
          sqlInjectionEnabled: vulnerabilityOn,
          sqlInjectionFormSubmitted: true,
          brokenAuthenticationEnabled: false,
          brokenAuthenticationFormSubmitted: false,
          error: 'Username or password are incorrect.'
        });
      }

    } catch (err) {
      console.log(err.message);
      res.render('home', {
        sqlInjectionEnabled: vulnerabilityOn,
        sqlInjectionFormSubmitted: true,
        brokenAuthenticationEnabled: false,
        brokenAuthenticationFormSubmitted: false,
        error: 'Something went wrong.'
      });
    }

  })();
});

homeRoutes.post('/brokenAuthentication', ipBlacklist, (req: Request, res: Response) => {
  const vulnerabilityOn = !!req.body.brokenAuthVulnerability;
  const sqlQuery = `SELECT * FROM users WHERE username = $1 AND password = $2;`;
  const username = req.body.loginUsername;
  const password = req.body.loginPassword;

  console.log('Attempting to log in.');

  (async () => {
    try {
      const result = await pool.query(sqlQuery, [username, password]);
      const userResult = await getByUsername(username);
      const userExists = userResult.rowCount && userResult.rowCount > 0;

      if (vulnerabilityOn) {
        if (result.rowCount == 0) {
          res.render('home', {
            sqlInjectionEnabled: false,
            sqlInjectionFormSubmitted: false,
            brokenAuthenticationEnabled: vulnerabilityOn,
            brokenAuthenticationFormSubmitted: true,
            error: !userExists ? `Username '${username}' does not exist.` : 'Wrong password.'
          });

        } else {
          res.render('home', {
            sqlInjectionEnabled: false,
            sqlInjectionFormSubmitted: false,
            brokenAuthenticationEnabled: vulnerabilityOn,
            brokenAuthenticationFormSubmitted: true,
            userData: result.rows[0],
            error: undefined
          });
        }

      } else {
        if (result.rowCount == 0) {
          await updateIpBlacklistOnFailedLoginAttempt(req.socket.remoteAddress);

          res.render('home', {
            sqlInjectionEnabled: false,
            sqlInjectionFormSubmitted: false,
            brokenAuthenticationEnabled: vulnerabilityOn,
            brokenAuthenticationFormSubmitted: true,
            error: 'Username or password are incorrect.'
          });

        } else {
          await clearIpAddressFromIpBlacklistOnSuccessfulLogin(req.socket.remoteAddress);

          res.render('home', {
            sqlInjectionEnabled: false,
            sqlInjectionFormSubmitted: false,
            brokenAuthenticationEnabled: vulnerabilityOn,
            brokenAuthenticationFormSubmitted: true,
            userData: result.rows[0],
            error: undefined
          });
        }

      }

    } catch (err) {
      console.log(err);

      res.sendStatus(500);
    }

  })();


});

export default homeRoutes;
