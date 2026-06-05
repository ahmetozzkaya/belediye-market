const pool = require('./db');

let cachedId = null;

const getMunicipalityId = async () => {
  if (cachedId) return cachedId;
  const result = await pool.query('SELECT id FROM municipalities LIMIT 1');
  if (!result.rows.length) throw new Error('Veritabanında belediye kaydı bulunamadı');
  cachedId = result.rows[0].id;
  return cachedId;
};

module.exports = { getMunicipalityId };
