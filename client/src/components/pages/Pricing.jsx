import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlanCard from '../pricing/PlanCard';
import { createPaymentOrder, getMySubscription, subscribeToPlan, verifyPayment } from '../../service/api';
import { useAuth } from '../../context/AuthContext';
import './Pricing.css';

const Pricing = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [activePlanCode, setActivePlanCode] = useState('free');
    const [loadingPlan, setLoadingPlan] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const loadRazorpayScript = async () => {
        if (window.Razorpay) return true;
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const plans = [
        {
            code: 'free',
            name: "Free",
            price: 0,
            type: "Standard",
            features: [
                { text: "Up to 5 files per task", included: true },
                { text: "Standard processing speed", included: true },
                { text: "Basic Govt Form presets", included: true },
                { text: "File storage for 2 hours", included: true },
                { text: "No Ads on dashboard", included: false },
                { text: "Priority Support", included: false }
            ]
        },
        {
            code: 'pro_monthly',
            name: "Pro",
            price: 149,
            type: "Premium",
            features: [
                { text: "Unlimited files per task", included: true },
                { text: "Lightning fast processing", included: true },
                { text: "Advanced OCR & Editing", included: true },
                { text: "Cloud storage for 30 days", included: true },
                { text: "Ad-free experience", included: true },
                { text: "24/7 Priority Support", included: true }
            ]
        },
        {
            code: 'enterprise_monthly',
            name: "Enterprise",
            price: 499,
            type: "Business",
            features: [
                { text: "Everything in Pro", included: true },
                { text: "Custom API Access", included: true },
                { text: "Bulk Govt Processing", included: true },
                { text: "Dedicated Account Manager", included: true },
                { text: "White-label reports", included: true },
                { text: "Custom integration support", included: true }
            ]
        }
    ];

    useEffect(() => {
        const loadCurrentPlan = async () => {
            if (!user) {
                setActivePlanCode('free');
                return;
            }

            try {
                const res = await getMySubscription();
                const subscription = res.data?.data?.subscription;
                if (!subscription) {
                    setActivePlanCode('free');
                    return;
                }

                if (subscription.plan_name === 'premium_monthly') {
                    setActivePlanCode('pro_monthly');
                } else if (subscription.plan_name === 'premium_yearly') {
                    setActivePlanCode('enterprise_monthly');
                } else {
                    setActivePlanCode('free');
                }
            } catch (error) {
                setActivePlanCode(user.plan_type === 'premium' ? 'pro_monthly' : 'free');
            }
        };

        loadCurrentPlan();
    }, [user]);

    const handlePlanSelection = async (plan) => {
        setErrorMessage('');
        setStatusMessage('');

        if (!user) {
            navigate('/login');
            return;
        }

        setLoadingPlan(plan.code);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            let res;
            if (plan.price === 0) {
                res = await subscribeToPlan(plan.code, 'mock');
            } else {
                try {
                    const razorpayLoaded = await loadRazorpayScript();
                    if (!razorpayLoaded) {
                        throw new Error('Unable to load payment gateway. Check internet connection and try again.');
                    }

                    const orderRes = await createPaymentOrder(plan.code);
                    const orderData = orderRes.data?.data;

                    if (!orderData?.orderId || !orderData?.keyId) {
                        throw new Error('Invalid payment order response from server.');
                    }

                    res = await new Promise((resolve, reject) => {
                        const options = {
                            key: orderData.keyId,
                            amount: orderData.amount,
                            currency: orderData.currency || 'INR',
                            name: 'PDF India',
                            description: `${plan.name} Subscription`,
                            order_id: orderData.orderId,
                            prefill: {
                                name: user?.full_name || '',
                                email: user?.email || '',
                            },
                            theme: { color: '#2563eb' },
                            handler: async (response) => {
                                try {
                                    const verifyRes = await verifyPayment({
                                        planCode: plan.code,
                                        razorpay_order_id: response.razorpay_order_id,
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_signature: response.razorpay_signature,
                                    });
                                    resolve(verifyRes);
                                } catch (verifyErr) {
                                    reject(verifyErr);
                                }
                            },
                            modal: {
                                ondismiss: () => reject(new Error('Payment cancelled by user.')),
                            },
                        };

                        const paymentObject = new window.Razorpay(options);
                        paymentObject.on('payment.failed', (resp) => {
                            const msg = resp?.error?.description || 'Payment failed.';
                            reject(new Error(msg));
                        });
                        paymentObject.open();
                    });
                } catch (paymentInitErr) {
                    const initMsg = paymentInitErr?.response?.data?.message || paymentInitErr?.message || '';
                    const allowMockFallback =
                        initMsg.includes('Razorpay keys are not configured on server') ||
                        initMsg.includes('Cannot POST /api/v1/payment/create-order');

                    if (!allowMockFallback) {
                        throw paymentInitErr;
                    }

                    // Temporary fallback for local testing until Razorpay keys are configured.
                    res = await subscribeToPlan(plan.code, 'mock');
                    setStatusMessage('Payment gateway not configured. Plan activated in test mode.');
                }
            }

            const apiUser = res.data?.data?.user;
            if (apiUser) {
                updateUser(apiUser);
            }
            setActivePlanCode(plan.code);
            setStatusMessage(res.data?.message || 'Plan updated successfully.');
        } catch (error) {
            const status = error.response?.status;
            if (status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }

            const apiMessage = error.response?.data?.message || error.response?.data?.error;
            setErrorMessage(apiMessage || error.message || 'Plan update failed. Please try again.');
        } finally {
            setLoadingPlan('');
        }
    };

    return (
        <div className="pricing-page">
            <div className="container">
                <div className="pricing-header">
                    <h1>Simple, Transparent <span className="blue-text">Pricing</span></h1>
                    <p>Choose the plan that works best for your document needs.</p>
                </div>
                {statusMessage && <p className="pricing-status">{statusMessage}</p>}
                {errorMessage && <p className="pricing-error">{errorMessage}</p>}

                <div className="pricing-grid">
                    {plans.map((plan, index) => (
                        <PlanCard 
                            key={index} 
                            plan={plan} 
                            isPopular={plan.name === "Pro"} 
                            onSelect={handlePlanSelection}
                            isActive={activePlanCode === plan.code}
                            loading={loadingPlan === plan.code}
                        />
                    ))}
                </div>

                <div className="pricing-faq">
                    <h3>Frequently Asked Questions</h3>
                    <div className="faq-grid">
                        <div className="faq-item">
                            <h4>Can I cancel anytime?</h4>
                            <p>Yes, you can cancel your subscription at any time from your dashboard settings.</p>
                        </div>
                        <div className="faq-item">
                            <h4>Is my data safe?</h4>
                            <p>Absolutely. We use industry-standard encryption and never store your files longer than needed.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
