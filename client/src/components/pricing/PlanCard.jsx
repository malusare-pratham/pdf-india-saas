import React from 'react';
import { FaCheck, FaTimes, FaCrown } from 'react-icons/fa';
import './PlanCard.css';

const PlanCard = ({ plan, isPopular, onSelect, isActive, loading }) => {
    return (
        <div className={`plan-card ${isPopular ? 'popular' : ''}`}>
            {isPopular && <div className="popular-badge">Most Popular</div>}
            
            <div className="plan-header">
                {plan.type === 'Premium' && <FaCrown className="crown-icon" />}
                <h3>{plan.name}</h3>
                <div className="price">
                    <span className="currency">₹</span>
                    <span className="amount">{plan.price}</span>
                    <span className="duration">/month</span>
                </div>
            </div>

            <ul className="features-list">
                {plan.features.map((feature, index) => (
                    <li key={index} className={feature.included ? 'included' : 'excluded'}>
                        {feature.included ? <FaCheck className="icon-check" /> : <FaTimes className="icon-times" />}
                        {feature.text}
                    </li>
                ))}
            </ul>

            <button 
                className={`plan-btn ${isPopular ? 'btn-popular' : ''}`} 
                onClick={() => onSelect(plan)}
                disabled={loading || isActive}
            >
                {loading ? 'Please wait...' : isActive ? 'Current Plan' : (plan.price === 0 ? 'Start for Free' : 'Upgrade Now')}
            </button>
        </div>
    );
};

export default PlanCard;
