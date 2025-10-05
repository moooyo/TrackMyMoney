package handlers

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
	"trackmymoney/internal/config"
	"trackmymoney/pkg/logger"
	"trackmymoney/pkg/response"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type User struct {
	Username string `json:"username"`
}

var cfg *config.Config

// SetConfig sets the config for auth handlers
func SetConfig(c *config.Config) {
	cfg = c
}

// @Summary Login
// @Description User login
// @Tags auth
// @Accept json
// @Produce json
// @Param credentials body LoginRequest true "Login credentials"
// @Success 200 {object} response.Response{data=LoginResponse}
// @Router /api/auth/login [post]
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request", zap.Error(err))
		response.BadRequest(c, err.Error())
		return
	}

	// Validate credentials
	if req.Username != cfg.Auth.Username || req.Password != cfg.Auth.Password {
		response.Error(c, 401, "Invalid username or password")
		return
	}

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": req.Username,
		"exp":      time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
	})

	tokenString, err := token.SignedString([]byte(cfg.Auth.JWTSecret))
	if err != nil {
		logger.Error("Failed to generate token", zap.Error(err))
		response.InternalError(c, "Failed to generate token")
		return
	}

	logger.Info("User logged in", zap.String("username", req.Username))
	response.Success(c, LoginResponse{
		Token: tokenString,
		User: User{
			Username: req.Username,
		},
	})
}

// @Summary Verify token
// @Description Verify JWT token
// @Tags auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} response.Response{data=User}
// @Router /api/auth/verify [get]
func VerifyToken(c *gin.Context) {
	tokenString := c.GetHeader("Authorization")
	if tokenString == "" {
		response.Error(c, 401, "No token provided")
		return
	}

	// Remove "Bearer " prefix if present
	if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
		tokenString = tokenString[7:]
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.Auth.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		response.Error(c, 401, "Invalid token")
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		response.Error(c, 401, "Invalid token claims")
		return
	}

	username, ok := claims["username"].(string)
	if !ok {
		response.Error(c, 401, "Invalid token claims")
		return
	}

	response.Success(c, User{
		Username: username,
	})
}
