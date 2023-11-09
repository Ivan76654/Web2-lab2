import { Router } from 'express';
import pool from '../db';

const homeRoutes = Router();

homeRoutes.get('/', (req, res) => {
  res.render('home', {
    sqlInjectionEnabled: false,
    formSubmitted: false,
    error: undefined
  });
});

homeRoutes.post('/sqlInjection', (req, res) => {
  const vulnerabilityOn = !!req.body.sqlInjectionVulnerability;

  (async () => {
    const sql = vulnerabilityOn ? `SELECT * FROM users WHERE username = '${req.body.username}' AND password = '${req.body.password}';` :
      `SELECT * FROM users WHERE username = $1 AND password = $2;`

    try {
      const params = vulnerabilityOn ? [] : [req.body.username, req.body.password];
      const result = await pool.query(sql, params);

      if (result.rowCount && result.rowCount > 0) {
        const userData = result.rows;

        res.render('home', {
          sqlInjectionEnabled: vulnerabilityOn,
          formSubmitted: true,
          userData: JSON.stringify(userData),
          error: undefined
        });

      } else {
        res.render('home', {
          sqlInjectionEnabled: vulnerabilityOn,
          formSubmitted: true,
          error: 'Username or password are incorrect.'
        });
      }

    } catch (err) {
      res.render('home', {
        sqlInjectionEnabled: vulnerabilityOn,
        formSubmitted: true,
        error: err.message
      });
    }

  })();
});

export default homeRoutes;
