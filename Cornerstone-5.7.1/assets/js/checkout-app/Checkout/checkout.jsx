import React, { Fragment } from 'react';
import { formatMoney } from 'accounting';
import { createCheckoutService } from '@bigcommerce/checkout-sdk';
import Panel from '../components/Panel/panel';
import SubmitButton from '../components/SubmitButton/submit-button';
import Billing from '../Billing/billing';
import Cart from '../Cart/cart';
import Customer from '../Customer/customer';
import LoginPanel from '../LoginPanel/login-panel';
import Payment from '../Payment/payment';
import Shipping from '../Shipping/shipping';
import Layout from './Layout/layout';
import LoadingState from './LoadingState/loading-state';
import styles from './checkout.scss';
import http from 'axios';
import { setupPayment, processPayment } from '../../theme/services/minibc.service';
import Terms from '../Terms/Terms';
const KCHARGE_LOGIC = 'chargelogic';

export default class Checkout extends React.PureComponent {
    constructor(props) {
        super(props);

        this.service = createCheckoutService();

        this.state = {
            isPlacingOrder: false,
            showSignInPanel: false,
        };
    }

    componentDidMount() {
        Promise.all([
            this.service.loadCheckout(),
            this.service.loadShippingCountries(),
            this.service.loadShippingOptions(),
            this.service.loadBillingCountries(),
            this.service.loadPaymentMethods(),
        ]).then(() => {
            this.unsubscribe = this.service.subscribe((state) => {
                this.setState(state);
            });
        });
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    render() {
        const { data, errors, statuses } = this.state;

        if (!data) {
            return (
                <Layout body={
                    <LoadingState />
                } />
            );
        }

        if (this.state.showSignInPanel) {
            return (
                <Layout body={
                    <LoginPanel
                        errors={ errors.getSignInError() }
                        isSigningIn={ statuses.isSigningIn() }
                        onClick={ (customer) => this.service.signInCustomer(customer)
                            .then(() => this.service.loadShippingOptions())
                        }
                        onClose={ () => this.setState({ showSignInPanel: false }) } />
                } />
            );
        }

        return (
            <Layout body={
                <Fragment>
                    <div className={ styles.body }>
                        <Panel body={
                            <form onSubmit={ (event) => this._submitOrder(event, data.getCustomer().isGuest) }>
                                <Customer
                                    customer={ data.getCustomer() }
                                    billingAddress={ data.getBillingAddress() }
                                    isSigningOut={ statuses.isSigningOut() }
                                    onClick={ () => this.service.signOutCustomer()
                                        .then(() => this.service.loadShippingOptions()) }
                                    onChange={ (customer) => this.setState({ customer }) }
                                    onSignIn={ () => this.setState({ showSignInPanel: true }) } />

                                <Shipping
                                    addressFields = {data.getShippingAddressFields()}
                                    customer={ data.getCustomer() }
                                    consignments={ data.getConsignments() }
                                    cart={ data.getCart() }
                                    isUpdatingConsignment={ statuses.isUpdatingConsignment }
                                    isCreatingConsignments={ statuses.isCreatingConsignments }
                                    isUpdatingShippingAddress={ statuses.isUpdatingShippingAddress }
                                    address={ data.getShippingAddress() }
									countries={ data.getShippingCountries() }
                                    commentEnable = {this.state.data.getConfig().checkoutSettings.enableOrderComments}
                                    comment={data.getCheckout().customerMessage}
                                    onCommentChange = {(comment)=>{
                                        this.service.updateCheckout({ customerMessage: comment })
                                    }}
                                    options={ data.getShippingOptions() }
                                    selectedOptionId={ data.getSelectedShippingOption() ? data.getSelectedShippingOption().id : '' }
                                    isSelectingShippingOption ={ statuses.isSelectingShippingOption }
                                    onShippingOptionChange={ (optionId) => this.service.selectShippingOption(optionId) }
                                    onConsignmentUpdate={ (consignment) => (
                                        consignment.id ?
                                            this.service.updateConsignment(consignment) :
                                            this.service.createConsignments([consignment])
                                        )
                                    }
                                    onAddressChange={ (shippingAddress) => {
                                        this.setState({ shippingAddress })
                                        this.service.updateShippingAddress(shippingAddress)
                                    }} />

                                <Payment
                                    errors={ errors.getSubmitOrderError() || this.state.paymentError }
                                    methods={ data.getPaymentMethods() }
                                    onClick={ (name, gateway) => {
                                        this.setState({ selectedMethod: name });
                                        this.service.initializePayment({ methodId: name, gatewayId: gateway });
                                    }}
                                    onChange={ (payment) => this.setState({ payment }) } />

                                <Billing
                                    multishipping={ (data.getConsignments() || []).length > 1 }
                                    address={ data.getBillingAddress() }
                                    countries={ data.getBillingCountries() }
                                    sameAsShippingAddress={
                                        (this.state.billingAddressSameAsShippingAddress === undefined) ||
                                        this.state.billingAddressSameAsShippingAddress
                                    }
                                    onChange ={ (billingAddress) => this.setState({ billingAddress }) }
                                    onSelect ={ (billingAddressSameAsShippingAddress) => this.setState({ billingAddressSameAsShippingAddress })  } />
								<Terms
                                    enable ={this.state.data.getConfig().checkoutSettings.enableTermsAndConditions}
                                    type={this.state.data.getConfig().checkoutSettings.orderTermsAndConditionsType}
                                    link={this.state.data.getConfig().checkoutSettings.orderTermsAndConditionsLink}
                                    conditions={this.state.data.getConfig().checkoutSettings.orderTermsAndConditions}
                                />
                                <div className={ styles.actionContainer }>
                                    <SubmitButton
                                        label={ this._isPlacingOrder() ?
                                            'Placing your order...' :
                                            `Pay ${ formatMoney((data.getCheckout()).grandTotal) }`
                                        }
                                        isLoading={ this._isPlacingOrder() } />
                                </div>
                            </form>
                        } />
                    </div>

                    <div className={ styles.side }>
                        <Cart
                            checkout={ data.getCheckout() }
                            cartLink={ (data.getConfig()).links.cartLink } />
                    </div>
                </Fragment>
            } />
        );
    }

    _isPlacingOrder() {
        const { statuses } = this.state;

        return this.state.isPlacingOrder && (
            statuses.isSigningIn() ||
            statuses.isUpdatingShippingAddress() ||
            statuses.isUpdatingBillingAddress() ||
            statuses.isSubmittingOrder()
        );
    }

    _submitOrder(event, isGuest) {
        let billingAddressPayload = this.state.billingAddressSameAsShippingAddress ?
            this.state.shippingAddress :
            this.state.billingAddress;

        billingAddressPayload = { ...billingAddressPayload, email: this.state.customer.email };

        let { payment } = this.state;

        this.setState({ isPlacingOrder: true });
        event.preventDefault();

        let promises = [
            isGuest ? this.service.continueAsGuest(this.state.customer) : Promise.resolve(),
            this.service.updateBillingAddress(billingAddressPayload),
        ];

        Promise.all(promises)
        .then(state => state[1].data)
        .then(data => {
            if (this.state.selectedMethod === 'cheque') {
                let checkout = data.getCheckout();
                return this.createOrder().then(orderId => {
                    return setupPayment(checkout.id).then(response => {
                        const authToken = response.data.auth_token;
                        const card = {
                            'number': payment.paymentData.ccNumber,
                            'code': payment.paymentData.ccCvv,
                            'expiry_month': payment.paymentData.ccExpiry.month,
                            'expiry_year': payment.paymentData.ccExpiry.year
                        }

                        return this._payWithMiniBC(checkout, orderId, card, authToken, 0, checkout.cart.currency.code).then(transaction => {
                            if(!transaction.data.success) {
                                let error = 'An error has occured while processing your credit card information. Please ensure the information provided is correct.';
                                this.setState({paymentError: {message: error}});
                                return new Promise((resolve, reject) => { reject(error); });
                            } else {
                                let url = `https://www.ribon.ca/api/live/4j2yr9mzig/put`;
                                let params = {
                                    uri: `/v2/orders/${orderId}`,
                                    query: {
                                        payment_method: 'Credit Card'
                                    }
                                }

                                http.post(url, params).then(resp => {
                                    window.location.href = data.getConfig().links.orderConfirmationLink;
                                }).catch(error => {
                                    window.location.href = data.getConfig().links.orderConfirmationLink;
                                });
                            }
                        });
                    });
                });
            } else {
                this.service.submitOrder({ payment }).then(resp => {
                    window.location.href = data.getConfig().links.orderConfirmationLink;
                });
            }
        })
        .catch(error => {
            console.log('error', error);
            this.setState({ isPlacingOrder: false });
        });
    }

    /**
	 * Processes an order and its payment in MiniBC.
	 * @param {string} checkoutID - BigCommerce checkout ID.
	 * @param {Object} method - selected payment method.
	 * @param {number} appliedCredit - the amount of store credit applied to the order.
	 * @param {number} grandTotal - the total value of the order.
	 * @param {string} authToken - the gateway's auth token.
	 * @param {string} intent - the payment intent.
	 * @returns {Promise}
	 */
	_payWithMiniBC(checkout, orderId, card, authToken, amount, currency) {
		let paymentProfile = {
			method: 'credit_card',
			save_payment: false,
			credit_card: card,
			address: {
				first_name: checkout.billingAddress.firstName,
				last_name: checkout.billingAddress.lastName,
				email_address: checkout.billingAddress.email,
				street_1: checkout.billingAddress.address1,
				street_2: checkout.billingAddress.address2,
				city: checkout.billingAddress.city,
				state: checkout.billingAddress.stateOrProvince,
				country_iso2: checkout.billingAddress.countryCode,
				phone: checkout.billingAddress.phone,
				zip: checkout.billingAddress.postalCode
			}
        };

        return processPayment(checkout.id, orderId, KCHARGE_LOGIC, paymentProfile, amount, currency, authToken);
    }

    createOrder(payment_provider_id = 'Credit Card', useStoreCredit = false, customerMessage = '') {
		return new Promise((resolve, reject) => {
			http.post('/internalapi/v1/checkout/order', { payment_provider_id, customerMessage, useStoreCredit }).then(response => {
				resolve(response.data.data.order.orderId);
			}, error => {
				return reject(error.error);
			});
		});
	}
}
