using Microsoft.AspNetCore.Mvc;
namespace OneWeb.Api.DTOs
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public ApiError? Error { get; set; }
        public ResponseMeta Meta { get; set; } = new();
    }
    public class ApiError
    {
        public string Code { get; set; } = default!;
        public string Message { get; set; } = default!;
        public string ErrorId { get; set; } = default!;
        public int HttpStatusCode { get; set; }
        public bool Retryable { get; set; }

        public List<FieldViolation> FieldViolations { get; set; } = [];
    }
    public class FieldViolation
    {
        public string Field { get; set; } = default!;
        public string Description { get; set; } = default!;
    }
    public class ResponseMeta
    {
        public string RequestId { get; set; } = default!;
        public string Timestamp { get; set; } = default!;
    }
    public sealed class ErrorDescriptor
    {
        public string Code { get; init; } = default!;
        public string Message { get; init; } = default!;
        public int StatusCode { get; init; }
        public bool Retryable { get; init; }

        public IEnumerable<FieldViolation>? Violations { get; init; }
    }
    public static class ApiResponseFactory
    {
        public static ApiResponse<T> Success<T>(
        T data,
        HttpContext context)
        {
            return new ApiResponse<T>
            {
                Success = true,
                Data = data,
                Error = null,
                Meta = BuildMeta(context)
            };
        }

        public static IActionResult Ok<T>(
            T data,
            HttpContext context)
        {
            return new OkObjectResult(
                Success(data, context));
        }

        public static IActionResult Created<T>(
            T data,
            HttpContext context,
            string? location = null)
        {
            var response = Success(data, context);

            if (!string.IsNullOrWhiteSpace(location))
            {
                return new CreatedResult(location, response);
            }

            return new ObjectResult(response)
            {
                StatusCode = StatusCodes.Status201Created
            };
        }

        public static IActionResult Accepted<T>(
            T data,
            HttpContext context)
        {
            return new ObjectResult(
                Success(data, context))
            {
                StatusCode = StatusCodes.Status202Accepted
            };
        }
        public static ApiResponse<object?> Fail(
    ErrorDescriptor error,
    HttpContext? context = null)
        {
            return new ApiResponse<object?>
            {
                Success = false,
                Data = null,
                Error = new ApiError
                {
                    Code = error.Code,
                    Message = error.Message,
                    ErrorId = context?.TraceIdentifier ?? string.Empty,
                    HttpStatusCode = error.StatusCode,
                    Retryable = error.Retryable,
                    FieldViolations = error.Violations?.ToList() ?? []
                },
                Meta = BuildMeta(context)
            };
        }
        private static ResponseMeta BuildMeta(HttpContext context)
        {
            return new ResponseMeta
            {
                RequestId = context.TraceIdentifier,
                Timestamp = DateTime.UtcNow.ToString("O")
            };
        }
    }
}
