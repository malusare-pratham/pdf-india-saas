const PLAN_CONFIG = {
    free: {
        planCode: 'free',
        displayName: 'Free',
        amount: 0,
        durationDays: 0,
        userPlanType: 'free',
        subscriptionPlanName: 'free',
    },
    pro_monthly: {
        planCode: 'pro_monthly',
        displayName: 'Pro Monthly',
        amount: 149,
        durationDays: 30,
        userPlanType: 'premium',
        subscriptionPlanName: 'premium_monthly',
    },
    enterprise_monthly: {
        planCode: 'enterprise_monthly',
        displayName: 'Enterprise Monthly',
        amount: 499,
        durationDays: 30,
        userPlanType: 'premium',
        subscriptionPlanName: 'premium_monthly',
    },
};

const createIdBundle = () => {
    const stamp = Date.now();
    const rnd = Math.floor(Math.random() * 1000000);
    return {
        transactionId: `txn_${stamp}_${rnd}`,
        orderId: `order_${stamp}_${rnd}`,
        paymentId: `pay_${stamp}_${rnd}`,
        invoice: `INV-${stamp}-${rnd}`,
    };
};

module.exports = {
    PLAN_CONFIG,
    createIdBundle,
};

