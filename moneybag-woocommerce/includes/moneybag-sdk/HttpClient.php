<?php
if (! defined('ABSPATH')) {
    exit;
}

class MoneybagSdk_HttpClient
{
    protected $timeout;
    protected $retry_attempts;
    protected $retry_delay_base = 1; // seconds

    public function __construct($timeout = 30, $retry_attempts = 3)
    {
        $this->timeout        = absint($timeout);
        $this->retry_attempts = absint($retry_attempts);
    }

    /**
     * Makes a GET request.
     *
     * @param string $url
     * @param array  $headers
     * @return array
     * @throws MoneybagSdk_MoneybagException
     */
    public function get(string $url, array $headers = []): array
    {
        return $this->request($url, 'GET', $headers);
    }

    /**
     * Makes a POST request.
     *
     * @param string $url
     * @param array  $headers
     * @param string $body
     * @return array
     * @throws MoneybagSdk_MoneybagException
     */
    public function post(string $url, array $headers = [], string $body = ''): array
    {
        return $this->request($url, 'POST', $headers, $body);
    }

    /**
     * Generic request method with retry logic and SSL error handling.
     *
     * @param string $url
     * @param string $method
     * @param array  $headers
     * @param string $body
     * @return array
     * @throws MoneybagSdk_MoneybagException
     */
    protected function request(string $url, string $method, array $headers = [], string $body = ''): array
    {
        $args = array(
            'method'     => $method,
            'timeout'    => $this->timeout,
            'headers'    => $headers,
            'sslverify'  => true,
        );

        if ('POST' === $method) {
            $args['body'] = $body;
        }

        for ($attempt = 0; $attempt <= $this->retry_attempts; $attempt++) {
            // Debug logging
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Moneybag API Request: ' . $method . ' ' . $url);
                error_log('Moneybag API Headers: ' . print_r($headers, true));
                if ($body) {
                    error_log('Moneybag API Body: ' . $body);
                }
            }
            
            $response = ('GET' === $method) ? wp_remote_get($url, $args) : wp_remote_post($url, $args);

            if (is_wp_error($response)) {
                $error_message = $response->get_error_message();

                // Detect cURL error 60 (SSL issue)
                if (strpos($error_message, 'cURL error 60') !== false) {
                    throw new MoneybagSdk_MoneybagException(
                        'SSL certificate verification failed (cURL error 60). ' .
                            'Your server might be missing a valid CA certificate bundle. ' .
                            'Please contact your hosting provider or server admin to fix this issue.'
                    );
                }

                // Retry if more attempts are allowed
                if ($attempt < $this->retry_attempts) {
                    $delay = pow(2, $attempt) * $this->retry_delay_base;
                    error_log(sprintf(
                        'Moneybag HTTP Client: Network error (%s). Retrying in %d seconds (Attempt %d/%d).',
                        $error_message,
                        $delay,
                        $attempt + 1,
                        $this->retry_attempts + 1
                    ));
                    sleep($delay);
                    continue;
                } else {
                    throw new MoneybagSdk_MoneybagException('Network error during API request: ' . $error_message);
                }
            }

            $status_code   = wp_remote_retrieve_response_code($response);
            $response_body = wp_remote_retrieve_body($response);
            
            // Debug logging for response
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Moneybag API Response Status: ' . $status_code);
                error_log('Moneybag API Response Body: ' . $response_body);
            }
            $decoded_body  = json_decode($response_body, true);

            if ($status_code >= 200 && $status_code < 300) {
                return $decoded_body ?: [
                    'success'     => false,
                    'message'     => 'Empty or invalid JSON response.',
                    'body'        => $response_body,
                    'status_code' => $status_code,
                ];
            } else {
                return [
                    'success'     => false,
                    'message'     => isset($decoded_body['message']) ? $decoded_body['message'] : 'API error occurred.',
                    'status_code' => $status_code,
                    'body'        => $response_body,
                ];
            }
        }

        // Shouldn't reach here, but fallback just in case.
        throw new MoneybagSdk_MoneybagException('Failed to connect to Moneybag API after multiple retries.');
    }
}
