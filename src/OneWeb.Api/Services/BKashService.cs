using Microsoft.Extensions.Options;
using System.Text;
using System.Text.Json;

namespace OneWeb.Api;

    public class BKashService :IBKashService
    {
        private readonly HttpClient _httpClient;
        private readonly BKashConfig _config;
        private readonly ILogger<BKashService> _logger;
        private readonly TokenCache _tokenCache;

        public BKashService(
            HttpClient httpClient,
            IOptions<BKashConfig> config,
            ILogger<BKashService> logger)
        {
            _httpClient = httpClient;
            _config = config.Value;
            _logger = logger;
            _tokenCache = new TokenCache();

            _httpClient.BaseAddress = new Uri(_config.BaseUrl);
        }

        public async Task<GrantTokenResponse> GrantTokenAsync()
        {
            try
            {
                var request = new
                {
                    app_key = _config.AppKey,
                    app_secret = _config.AppSecret
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(request),
                    Encoding.UTF8,
                    "application/json");

                var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                    "/tokenized-checkout/auth/grant-token")
                {
                    Content = content
                };

                httpRequest.Headers.Accept.Add( new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
                httpRequest.Headers.Add("username", _config.Username);
                httpRequest.Headers.Add("password", _config.Password);

                var response = await _httpClient.SendAsync(httpRequest);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    var error = JsonSerializer.Deserialize<ErrorResponse>(responseContent);
                    throw new Exception($"Failed to grant token: {error?.errorMessageEn ?? responseContent}");
                }

                var result = JsonSerializer.Deserialize<GrantTokenResponse>(responseContent);

                // Update token cache
                _tokenCache.IdToken = result.id_token;
                _tokenCache.RefreshToken = result.refresh_token;
                _tokenCache.ExpiresAt = DateTime.UtcNow.AddSeconds(
                    result.expires_in.HasValue ? result.expires_in.Value - 60 : _config.TokenExpirySeconds - 60);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error granting token");
                throw;
            }
        }

        public async Task<RefreshTokenResponse> RefreshTokenAsync(string refreshToken)
        {
            try
            {
                var request = new
                {
                    app_key = _config.AppKey,
                    app_secret = _config.AppSecret,
                    refresh_token = refreshToken
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(request),
                    Encoding.UTF8,
                    "application/json");

                var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                    "/tokenized-checkout/auth/refresh-token")
                {
                    Content = content
                };

                httpRequest.Headers.Add("username", _config.Username);
                httpRequest.Headers.Add("password", _config.Password);

                var response = await _httpClient.SendAsync(httpRequest);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    var error = JsonSerializer.Deserialize<ErrorResponse>(responseContent);
                    throw new Exception($"Failed to refresh token: {error?.errorMessageEn ?? responseContent}");
                }

                var result = JsonSerializer.Deserialize<RefreshTokenResponse>(responseContent);

                // Update token cache
                _tokenCache.IdToken = result.id_token;
                _tokenCache.RefreshToken = result.refresh_token;
                _tokenCache.ExpiresAt = DateTime.UtcNow.AddSeconds(
                    result.expires_in.HasValue ? result.expires_in.Value - 60 : _config.TokenExpirySeconds - 60);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing token");
                throw;
            }
        }

        private async Task<string> GetValidTokenAsync()
        {
            if (!_tokenCache.IsValid || string.IsNullOrEmpty(_tokenCache.IdToken))
            {
                await GrantTokenAsync();
            }
            else if (_tokenCache.ExpiresAt < DateTime.UtcNow.AddMinutes(5)) // Refresh before expiry
            {
                await RefreshTokenAsync(_tokenCache.RefreshToken);
            }

            return _tokenCache.IdToken;
        }

        public async Task<CreateAgreementResponse> CreateAgreementAsync(CreateAgreementRequest request)
        {
            var token = await GetValidTokenAsync();

            var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                "/tokenized-checkout/agreement/create")
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new
                    {
                        payerReference = request.PayerReference,
                        callbackURL = request.CallbackURL
                    }),
                    Encoding.UTF8,
                    "application/json")
            };

            httpRequest.Headers.Add("Authorization", token);
            httpRequest.Headers.Add("X-App-Key", _config.AppKey);

            var response = await _httpClient.SendAsync(httpRequest);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var error = JsonSerializer.Deserialize<ErrorResponse>(content);
                throw new Exception($"Create agreement failed: {error?.errorMessageEn ?? content}");
            }

            return JsonSerializer.Deserialize<CreateAgreementResponse>(content);
        }

        public async Task<ExecuteAgreementResponse> ExecuteAgreementAsync(string agreementId)
        {
            var token = await GetValidTokenAsync();

            var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                "/tokenized-checkout/agreement/execute")
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new { agreementId = agreementId }),
                    Encoding.UTF8,
                    "application/json")
            };

            httpRequest.Headers.Add("Authorization", token);
            httpRequest.Headers.Add("X-App-Key", _config.AppKey);

            var response = await _httpClient.SendAsync(httpRequest);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var error = JsonSerializer.Deserialize<ErrorResponse>(content);
                throw new Exception($"Execute agreement failed: {error?.errorMessageEn ?? content}");
            }

            return JsonSerializer.Deserialize<ExecuteAgreementResponse>(content);
        }

        public async Task<CreatePaymentResponse> CreatePaymentAsync(CreatePaymentRequest request)
        {
            var token = await GetValidTokenAsync();

            var payload = new
            {
                payerReference = request.PayerReference,
                callbackURL = request.CallbackURL,
                amount = request.Amount.ToString("F2"),
                currency = request.Currency ?? "BDT",
                intent = request.Intent ?? "sale",
                merchantInvoiceNumber = request.MerchantInvoiceNumber
            };

            var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                "/tokenized-checkout/payment/create")
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json")
            };

            httpRequest.Headers.Add("Authorization", token);
            httpRequest.Headers.Add("X-App-Key", _config.AppKey);

            var response = await _httpClient.SendAsync(httpRequest);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var error = JsonSerializer.Deserialize<ErrorResponse>(content);
                throw new Exception($"Create payment failed: {error?.errorMessageEn ?? content}");
            }

            return JsonSerializer.Deserialize<CreatePaymentResponse>(content);
        }

        public async Task<CreatePaymentWithAgreementResponse> CreatePaymentWithAgreementAsync(CreatePaymentWithAgreementRequest request)
        {
            var token = await GetValidTokenAsync();

            var payload = new
            {
                agreementId = request.AgreementId,
                payerReference = request.PayerReference,
                callbackURL = request.CallbackURL,
                amount = request.Amount.ToString("F2"),
                currency = request.Currency ?? "BDT",
                intent = request.Intent ?? "sale",
                merchantInvoiceNumber = request.MerchantInvoiceNumber
            };

            var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                "/tokenized-checkout/payment-with-agreement/create")
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json")
            };

            httpRequest.Headers.Add("Authorization", token);
            httpRequest.Headers.Add("X-App-Key", _config.AppKey);

            var response = await _httpClient.SendAsync(httpRequest);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var error = JsonSerializer.Deserialize<ErrorResponse>(content);
                throw new Exception($"Create payment with agreement failed: {error?.errorMessageEn ?? content}");
            }

            return JsonSerializer.Deserialize<CreatePaymentWithAgreementResponse>(content);
        }

        public async Task<ExecutePaymentResponse> ExecutePaymentAsync(string paymentId)
        {
            var token = await GetValidTokenAsync();

            var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                "/tokenized-checkout/payment/execute")
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new { paymentId = paymentId }),
                    Encoding.UTF8,
                    "application/json")
            };

            httpRequest.Headers.Add("Authorization", token);
            httpRequest.Headers.Add("X-App-Key", _config.AppKey);

            var response = await _httpClient.SendAsync(httpRequest);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var error = JsonSerializer.Deserialize<ErrorResponse>(content);
                throw new Exception($"Execute payment failed: {error?.errorMessageEn ?? content}");
            }

            return JsonSerializer.Deserialize<ExecutePaymentResponse>(content);
        }

        public async Task<ExecutePaymentResponse> ExecutePaymentWithAgreementAsync(string paymentId)
        {
            var token = await GetValidTokenAsync();

            var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                "/tokenized-checkout/payment-with-agreement/execute")
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new { paymentId = paymentId }),
                    Encoding.UTF8,
                    "application/json")
            };

            httpRequest.Headers.Add("Authorization", token);
            httpRequest.Headers.Add("X-App-Key", _config.AppKey);

            var response = await _httpClient.SendAsync(httpRequest);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var error = JsonSerializer.Deserialize<ErrorResponse>(content);
                throw new Exception($"Execute payment with agreement failed: {error?.errorMessageEn ?? content}");
            }

            return JsonSerializer.Deserialize<ExecutePaymentResponse>(content);
        }

        public async Task<QueryPaymentResponse> QueryPaymentAsync(string paymentId)
        {
            var token = await GetValidTokenAsync();

            var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                "/tokenized-checkout/query/payment")
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new { paymentId = paymentId }),
                    Encoding.UTF8,
                    "application/json")
            };

            httpRequest.Headers.Add("Authorization", token);
            httpRequest.Headers.Add("X-App-Key", _config.AppKey);

            var response = await _httpClient.SendAsync(httpRequest);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var error = JsonSerializer.Deserialize<ErrorResponse>(content);
                throw new Exception($"Query payment failed: {error?.errorMessageEn ?? content}");
            }

            return JsonSerializer.Deserialize<QueryPaymentResponse>(content);
        }

        public async Task<QueryAgreementResponse> QueryAgreementAsync(string agreementId)
        {
            var token = await GetValidTokenAsync();

            var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                "/tokenized-checkout/query/agreement")
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new { agreementId = agreementId }),
                    Encoding.UTF8,
                    "application/json")
            };

            httpRequest.Headers.Add("Authorization", token);
            httpRequest.Headers.Add("X-App-Key", _config.AppKey);

            var response = await _httpClient.SendAsync(httpRequest);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var error = JsonSerializer.Deserialize<ErrorResponse>(content);
                throw new Exception($"Query agreement failed: {error?.errorMessageEn ?? content}");
            }

            return JsonSerializer.Deserialize<QueryAgreementResponse>(content);
        }

        public async Task<RefundResponse> RefundAsync(RefundRequest request)
        {
            var token = await GetValidTokenAsync();

            var payload = new
            {
                paymentId = request.PaymentId,
                refundAmount = request.RefundAmount,
                trxId = request.TransactionId,
                reason = request.Reason,
                sku = request.Sku
            };

            var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                "/tokenized-checkout/refund/payment/transaction")
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json")
            };

            httpRequest.Headers.Add("Authorization", token);
            httpRequest.Headers.Add("X-App-Key", _config.AppKey);

            var response = await _httpClient.SendAsync(httpRequest);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var error = JsonSerializer.Deserialize<ErrorResponse>(content);
                throw new Exception($"Refund failed: {error?.errorMessageEn ?? content}");
            }

            return JsonSerializer.Deserialize<RefundResponse>(content);
        }

        public async Task<RefundStatusResponse> RefundStatusAsync(RefundStatusRequest request)
        {
            var token = await GetValidTokenAsync();

            var payload = new
            {
                paymentId = request.PaymentId,
                trxId = request.TransactionId
            };

            var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                "/tokenized-checkout/refund/payment/status")
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json")
            };

            httpRequest.Headers.Add("Authorization", token);
            httpRequest.Headers.Add("X-App-Key", _config.AppKey);

            var response = await _httpClient.SendAsync(httpRequest);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                var error = JsonSerializer.Deserialize<ErrorResponse>(content);
                throw new Exception($"Refund status failed: {error?.errorMessageEn ?? content}");
            }

            return JsonSerializer.Deserialize<RefundStatusResponse>(content);
        }
    }


