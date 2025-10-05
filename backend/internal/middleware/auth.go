package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
	"trackmymoney/pkg/logger"
	"trackmymoney/pkg/response"
)

// AuthMiddleware creates a JWT authentication middleware
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			logger.Debug("Missing Authorization header")
			response.Error(c, 401, "Missing authentication token")
			c.Abort()
			return
		}

		// Remove "Bearer " prefix
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			logger.Debug("Invalid Authorization header format")
			response.Error(c, 401, "Invalid token format")
			c.Abort()
			return
		}

		// Parse and validate token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			logger.Debug("Failed to parse JWT token", zap.Error(err))
			response.Error(c, 401, "Invalid or expired token")
			c.Abort()
			return
		}

		if !token.Valid {
			logger.Debug("Invalid JWT token")
			response.Error(c, 401, "Invalid or expired token")
			c.Abort()
			return
		}

		// Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			logger.Debug("Failed to extract JWT claims")
			response.Error(c, 401, "Invalid token claims")
			c.Abort()
			return
		}

		// Store username in context for later use
		if username, ok := claims["username"].(string); ok {
			c.Set("username", username)
			logger.Debug("User authenticated", zap.String("username", username))
		} else {
			logger.Debug("Username not found in JWT claims")
			response.Error(c, 401, "Invalid token claims")
			c.Abort()
			return
		}

		c.Next()
	}
}
