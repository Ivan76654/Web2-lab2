import pool from './index';

async function getByUsername(username: string) {
  const sqlQuery = 'SELECT * FROM users WHERE username = $1;';

  return pool.query(sqlQuery, [username]);
}

async function updateIpBlacklistOnFailedLoginAttempt(ipAddress?: string) {
  if (!ipAddress)
    return;

  try {
    let sqlQuery = `SELECT * FROM ipblacklist WHERE ipaddress = $1`;
    let result = await pool.query(sqlQuery, [ipAddress]);

    if (result.rowCount == 0) {
      sqlQuery = `INSERT INTO ipblacklist(ipaddress, loginattempts) VALUES ($1, $2);`;

      await pool.query(sqlQuery, [ipAddress, 1]);

    } else {
      sqlQuery = 'UPDATE ipblacklist SET loginattempts = $1 WHERE ipaddress = $2;';

      await pool.query(sqlQuery, [result.rows[0].loginattempts + 1, ipAddress]);
    }

  } catch (err) {
    console.log(err.message);

    throw err
  }
}

async function clearIpAddressFromIpBlacklistOnSuccessfulLogin(ipAddress?: string) {
  if (!ipAddress)
    return;

  const sqlQuery = `DELETE FROM ipblacklist WHERE ipaddress = $1;`;

  await pool.query(sqlQuery, [ipAddress]);
}

export {
  getByUsername,
  updateIpBlacklistOnFailedLoginAttempt,
  clearIpAddressFromIpBlacklistOnSuccessfulLogin
};
