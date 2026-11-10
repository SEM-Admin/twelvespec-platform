from decimal import Decimal, ROUND_HALF_UP

def price_for_target_margin(cost, margin='0.40', places='0.01'):
    cost, margin = Decimal(str(cost)), Decimal(str(margin))
    if cost < 0 or not (Decimal('0') <= margin < Decimal('1')):
        raise ValueError('Invalid cost or margin')
    return (cost / (Decimal('1') - margin)).quantize(Decimal(places), rounding=ROUND_HALF_UP)

def gross_margin(cost, sell):
    cost, sell = Decimal(str(cost)), Decimal(str(sell))
    if sell <= 0: raise ValueError('Sale must be positive')
    return (sell-cost)/sell
