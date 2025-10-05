package response

import (
	"github.com/gin-gonic/gin"
	"trackmymoney/pkg/errorcode"
)

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Success returns a successful response
func Success(c *gin.Context, data interface{}) {
	c.JSON(200, Response{
		Code:    int(errorcode.Success),
		Message: "success",
		Data:    data,
	})
}

// ErrorWithCode returns an error response with business error code
func ErrorWithCode(c *gin.Context, errCode errorcode.ErrorCode, message string) {
	if message == "" {
		message = errCode.Message()
	}
	c.JSON(errCode.HTTPStatus(), Response{
		Code:    int(errCode),
		Message: message,
	})
}

// ErrorWithCodeAndData returns an error response with business error code and additional data
func ErrorWithCodeAndData(c *gin.Context, errCode errorcode.ErrorCode, message string, data interface{}) {
	if message == "" {
		message = errCode.Message()
	}
	c.JSON(errCode.HTTPStatus(), Response{
		Code:    int(errCode),
		Message: message,
		Data:    data,
	})
}

// Legacy methods for backward compatibility (deprecated)

func Error(c *gin.Context, code int, message string) {
	c.JSON(code, Response{
		Code:    code,
		Message: message,
	})
}

func BadRequest(c *gin.Context, message string) {
	ErrorWithCode(c, errorcode.BadRequest, message)
}

func NotFound(c *gin.Context, message string) {
	ErrorWithCode(c, errorcode.NotFound, message)
}

func InternalError(c *gin.Context, message string) {
	ErrorWithCode(c, errorcode.InternalError, message)
}
