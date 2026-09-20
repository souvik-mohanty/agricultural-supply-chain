package com.agrolink.order;

import com.agrolink.common.exception.ServiceUnavailableException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PaymentGatewayTest {

    @Test
    void withoutCredentialsPaymentsAreDisabledButTheAppStillStarts() {
        PaymentGateway gateway = new PaymentGateway("", "");

        assertThat(gateway.isConfigured()).isFalse();
        assertThatThrownBy(() -> gateway.createOrder(100, "receipt")).isInstanceOf(ServiceUnavailableException.class);
        assertThatThrownBy(() -> gateway.verifySignature("o", "p", "s")).isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    void acceptsTheHmacRazorpayWouldProduce() {
        PaymentGateway gateway = new PaymentGateway("rzp_test_key", "secret");
        // Reference value from: printf 'order_1|pay_1' | openssl dgst -sha256 -hmac secret
        String signature = "52115a0d3400de9e86aade1f1b6eba9e8974604f4e267a9e9a16633a4c8dd2cb";

        assertThat(PaymentGateway.hmacSha256Hex("order_1|pay_1", "secret")).isEqualTo(signature);
        assertThat(gateway.verifySignature("order_1", "pay_1", signature)).isTrue();
    }

    @Test
    void rejectsTamperedOrMissingSignatures() {
        PaymentGateway gateway = new PaymentGateway("rzp_test_key", "secret");
        String signature = PaymentGateway.hmacSha256Hex("order_1|pay_1", "secret");

        assertThat(gateway.verifySignature("order_1", "pay_2", signature)).isFalse();
        assertThat(gateway.verifySignature("order_2", "pay_1", signature)).isFalse();
        assertThat(gateway.verifySignature("order_1", "pay_1", "deadbeef")).isFalse();
        assertThat(gateway.verifySignature("order_1", "pay_1", null)).isFalse();
    }
}
