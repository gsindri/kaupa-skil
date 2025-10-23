export const FEATURE_EMAIL_CHECKOUT_ONE_PAGE = true
export const FEATURE_TRADITIONAL_CHECKOUT = false

export const CART_ROUTE = FEATURE_EMAIL_CHECKOUT_ONE_PAGE ? '/dashboard/cart' : '/dashboard/orders'
