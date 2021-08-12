import http from 'axios';

const auth = { token: '5d52eb2ab86ed', storeID: 'z3wC6KInW4yp1kgiuTPLUSLend5Wmv0TvkPJFHesFtIei0EQUALS' }; //TODO need to change
//const clientID = 'qphbrq8n5q5pyscl30qf0gdivq3ln84';
const baseURL = 'https://apps.minibc.com';

/**
 * Initialises payment in MiniBC, payment should be processed within 5 minutes of calling this function.
 * @param {string} checkout_id - BigCommerce checkout ID.
 * @param {string} gateway_id - BigCommerce gateway ID.
 * @param {string} method_type - BigCommerce payment method type.
 * @param {number} order_id - BigCommerce order ID.
 * @param {string} intent - defaults to 'payment', gets logged to MINIBC database.
 * @param {string} currency - defaults to 'USD', the currency in which payment will be processed.
 * @returns {Promise}
 */
export function setupPayment(checkout_id, gateway_id = 'chargelogic', order_id = '', intent = 'payment', currency = 'USD') {
    let payload = { checkout_id, order_id, gateway_id, currency, intent };
    payload = Object.assign(payload, auth);

    return http.post(baseURL + '/apps/recurring/checkouts/payment/init', payload);
}

/**
 * Processes payment using the provided information. Also updates the order's status and transaction ID.
 * @param {string} checkout_id - BigCommerce checkout ID.
 * @param {number} order_id - BigCommerce order ID.
 * @param {string} gateway_id - BigCommerce gateway ID.
 * @param {Object} payment - payment details (tokenised card or vaulted card).
 * @param {string} intent - defaults to 'payment'.
 * @param {string} amount - the amount to be processed, contains a value and a currency.
 * @param {string} auth_token - the gateway's auth token.
 * @returns {Promise}
 */
export function processPayment(checkout_id, order_id, gateway_id, payment, value, currency, auth_token, intent = 'payment') {
    let amount = { value, currency }
    let payload = { checkout_id, order_id, gateway_id, payment, amount, auth_token, intent };
    payload = Object.assign(payload, auth);

    return http.post(baseURL + '/apps/recurring/checkouts/payment', payload);
}
