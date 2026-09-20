package com.agrolink.rfq;

/**
 * OPEN      buyer asked for a quote, the seller has not answered yet
 * QUOTED    the seller sent a quote; the buyer can accept or reject it (the seller may replace it)
 * ACCEPTED  the buyer accepted the quote; the buyer can now create and pay the order at the quoted price
 * REJECTED  the buyer rejected the quote
 * CANCELLED the buyer withdrew the request
 * EXPIRED   the deadline passed while the RFQ was still OPEN or QUOTED
 */
public enum RfqStatus {
    OPEN,
    QUOTED,
    ACCEPTED,
    REJECTED,
    CANCELLED,
    EXPIRED
}
