package errorcode

// ErrorCode represents business error codes
type ErrorCode int

const (
	// Success codes
	Success ErrorCode = 0

	// Client error codes (1000-1999)
	BadRequest       ErrorCode = 1000
	Unauthorized     ErrorCode = 1001
	Forbidden        ErrorCode = 1002
	NotFound         ErrorCode = 1003
	ValidationError  ErrorCode = 1004
	InvalidParameter ErrorCode = 1005

	// Server error codes (2000-2999)
	InternalError   ErrorCode = 2000
	DatabaseError   ErrorCode = 2001
	ServiceError    ErrorCode = 2002
	ExternalAPIError ErrorCode = 2003

	// Business logic error codes (3000+)
	AssetNotFound     ErrorCode = 3000
	AssetAlreadyExists ErrorCode = 3001
	InsufficientBalance ErrorCode = 3002
)

// Message returns the default error message for the error code
func (e ErrorCode) Message() string {
	messages := map[ErrorCode]string{
		Success: "success",

		// Client errors
		BadRequest:       "Invalid request",
		Unauthorized:     "Authentication required",
		Forbidden:        "Access forbidden",
		NotFound:         "Resource not found",
		ValidationError:  "Validation failed",
		InvalidParameter: "Invalid parameter",

		// Server errors
		InternalError:    "Internal server error",
		DatabaseError:    "Database error",
		ServiceError:     "Service error",
		ExternalAPIError: "External API error",

		// Business logic errors
		AssetNotFound:      "Asset not found",
		AssetAlreadyExists: "Asset already exists",
		InsufficientBalance: "Insufficient balance",
	}

	if msg, ok := messages[e]; ok {
		return msg
	}
	return "Unknown error"
}

// HTTPStatus returns the recommended HTTP status code for the error code
func (e ErrorCode) HTTPStatus() int {
	switch {
	case e == Success:
		return 200
	case e >= 1000 && e < 2000:
		// Client errors
		switch e {
		case Unauthorized:
			return 401
		case Forbidden:
			return 403
		case NotFound:
			return 404
		default:
			return 400
		}
	case e >= 2000 && e < 3000:
		// Server errors
		return 500
	case e >= 3000:
		// Business logic errors (return 200 with error code in body)
		return 200
	default:
		return 500
	}
}
