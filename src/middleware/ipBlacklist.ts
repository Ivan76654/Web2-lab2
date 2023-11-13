import { Request, Response, NextFunction } from 'express';
import pool from '../db';

function ipBlacklist(req: Request, res: Response, next: NextFunction) {
  const vulnerabilityOn = !!req.body.brokenAuthVulnerability;

  if (vulnerabilityOn) {
    console.log('Clearing IP address blacklist.');

    const deleteQuery = 'DELETE FROM ipblacklist;';

    pool.query(deleteQuery, []);

    next();

  } else {
    console.log('Checking IP blacklist.');

    (async () => {
      const ipAddress = req.socket.remoteAddress;
      const getBlackListQuery = `SELECT * FROM ipblacklist WHERE ipAddress = $1;`;

      try {
        const result = await pool.query(getBlackListQuery, [ipAddress]);

        if (result.rowCount == 0) {
          console.log(`IP address ${ipAddress} was not found in IP blacklist.`);

          next();

        } else {
          const ipAddressLoginAttempts = result.rows[0].loginattempts;

          if (ipAddressLoginAttempts >= 5) {
            console.log(`IP address ${ipAddress} is blocked.`);

            res.status(429);
            res.send('Your IP address has been blocked due to too many failed login attempts.');
          } else {
            next();
          }

        }

      } catch (err) {
        console.log(err.message);

        res.sendStatus(500);
      }
    })();

  }

}

export default ipBlacklist;
