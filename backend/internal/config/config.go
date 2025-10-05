package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server    ServerConfig    `yaml:"server"`
	Database  DatabaseConfig  `yaml:"database"`
	Auth      AuthConfig      `yaml:"auth"`
	Log       LogConfig       `yaml:"log"`
	Market    MarketConfig    `yaml:"market"`
	Scheduler SchedulerConfig `yaml:"scheduler"`
}

type ServerConfig struct {
	Port string `yaml:"port"`
	Mode string `yaml:"mode"` // debug, release, test
}

type DatabaseConfig struct {
	Driver string `yaml:"driver"`
	DSN    string `yaml:"dsn"`
}

type AuthConfig struct {
	Username string `yaml:"username"`
	Password string `yaml:"password"`
	JWTSecret string `yaml:"jwt_secret"`
}

type LogConfig struct {
	Level      string `yaml:"level"`       // debug, info, warn, error
	OutputFile string `yaml:"output_file"` // log file path
	MaxSize    int    `yaml:"max_size"`    // max size in MB
	MaxBackups int    `yaml:"max_backups"` // max number of old log files
	MaxAge     int    `yaml:"max_age"`     // max age in days
}

type MarketConfig struct {
	BaseURL    string `yaml:"base_url"`    // Market service URL
	Timeout    int    `yaml:"timeout"`     // Request timeout in seconds
	MaxRetries int    `yaml:"max_retries"` // Maximum number of retries
}

type SchedulerConfig struct {
	Enabled       bool   `yaml:"enabled"`
	CheckInterval int    `yaml:"check_interval"` // Check interval in seconds
	Timezone      string `yaml:"timezone"`
}

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
