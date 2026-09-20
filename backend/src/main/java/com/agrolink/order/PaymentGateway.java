package com.agrolink.order;

import com.agrolink.common.exception.ServiceUnavailableException;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Thin wrapper around Razorpay. The app starts without Razorpay credentials; payment endpoints then answer 503
 * instead of the whole application failing to boot.
 */
@Component
public class PaymentGateway {

    public static final String CURRENCY = "INR";

    private final String keyId;
    private final String keySecret;
    private final RazorpayClient client;

    public PaymentGateway(@Value("${razorpay.key:}") String keyId, @Value("${razorpay.secret:}") String keySecret) {
        this.keyId = keyId;
        this.keySecret = keySecret;
        try {
            this.client = StringUtils.hasText(keyId) && StringUtils.hasText(keySecret)
                    ? new RazorpayClient(keyId, keySecret)
                    : null;
        } catch (RazorpayException e) {
            throw new IllegalStateException("Invalid Razorpay configuration", e);
        }
    }

    public boolean isConfigured() {
        return client != null;
    }

    /** The public key id the browser needs to open Razorpay Checkout. */
    public String getKeyId() {
        return keyId;
    }

    /** @return the Razorpay order id */
    public String createOrder(long amountInPaise, String receipt) {
        requireConfigured();
        JSONObject request = new JSONObject();
        request.put("amount", amountInPaise);
        request.put("currency", CURRENCY);
        request.put("receipt", receipt);
        try {
            return client.orders.create(request).get("id");
        } catch (RazorpayException e) {
            throw new ServiceUnavailableException("Payment provider error: " + e.getMessage());
        }
    }

    /** Checks the checkout signature: HMAC-SHA256 of {@code orderId|paymentId} with the key secret. */
    public boolean verifySignature(String razorpayOrderId, String razorpayPaymentId, String signature) {
        requireConfigured();
        if (signature == null) {
            return false;
        }
        String expected = hmacSha256Hex(razorpayOrderId + "|" + razorpayPaymentId, keySecret);
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8));
    }

    static String hmacSha256Hex(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Could not compute HMAC", e);
        }
    }

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new ServiceUnavailableException("Online payments are not configured (set RAZORPAY_KEY and RAZORPAY_SECRET)");
        }
    }
}
