const crypto = require('crypto');
const axios = require('axios');

function buildSignedMessage(fields, signedFieldNames) {
  return signedFieldNames
    .split(',')
    .map((name) => `${name.trim()}=${fields[name.trim()]}`)
    .join(',');
}

function signEsewaPayload({ totalAmount, transactionUuid, productCode }) {
  const secret = process.env.ESEWA_SECRET_KEY;
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('base64');
}

/**
 * Verifies the signature on a redirected eSewa payload (already base64-decoded
 * to a JS object). The payload contains `signed_field_names` listing the
 * comma-separated field names that the signature covers, plus the signature
 * itself. We rebuild the message from those fields and HMAC-SHA256 against
 * our merchant secret.
 */
function verifyEsewaCallback(payload) {
  if (!payload || typeof payload !== 'object') return false;
  const { signed_field_names: signedFieldNames, signature } = payload;
  if (!signedFieldNames || !signature) return false;

  const message = buildSignedMessage(payload, signedFieldNames);
  const expected = crypto
    .createHmac('sha256', process.env.ESEWA_SECRET_KEY)
    .update(message)
    .digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(String(signature))
    );
  } catch {
    return false;
  }
}

async function checkEsewaStatus({ totalAmount, transactionUuid, productCode }) {
  const url = process.env.ESEWA_STATUS_URL;
  const res = await axios.get(url, {
    params: {
      product_code: productCode,
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
    },
    timeout: 10000,
  });
  return res.data;
}

module.exports = {
  signEsewaPayload,
  verifyEsewaCallback,
  checkEsewaStatus,
};
