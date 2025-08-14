/**
 * External dependencies
 */
const { registerPaymentMethod } = window.wc.wcBlocksRegistry;
const { getSetting } = window.wc.wcSettings;
const { decodeEntities } = window.wp.htmlEntities;
const { createElement } = window.wp.element;

/**
 * Internal dependencies
 */
const settings = getSetting( 'moneybag_data', {} );
const defaultLabel = 'Moneybag Payment';
const label = decodeEntities( settings.title ) || defaultLabel;

/**
 * Content component for Moneybag payment method.
 */
const Content = () => {
    return decodeEntities( settings.description || '' );
};

/**
 * Label component
 */
const Label = () => {
    const icon = settings.icon ? createElement('img', {
        src: settings.icon,
        alt: label,
        style: { marginRight: '10px', maxHeight: '24px' }
    }) : null;
    
    return createElement('span', {
        style: { display: 'flex', alignItems: 'center' }
    }, icon, label);
};

/**
 * Moneybag payment method config object.
 */
const MoneybagPaymentMethod = {
    name: 'moneybag',
    label: createElement(Label),
    content: createElement(Content),
    edit: createElement(Content),
    canMakePayment: () => true,
    ariaLabel: label,
    supports: {
        features: settings.supports || [],
    },
};

registerPaymentMethod( MoneybagPaymentMethod );