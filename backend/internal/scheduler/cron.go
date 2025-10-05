package scheduler

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// CronSchedule represents a simplified cron schedule
// Format: "minute hour day month weekday"
// Example: "0 6 * * *" means 6:00 AM every day
// Supports:
// - Numbers: 0, 1, 2, etc.
// - Wildcards: *
// - Ranges: 1-5
// - Lists: 1,3,5
type CronSchedule struct {
	minute  []int // 0-59
	hour    []int // 0-23
	day     []int // 1-31
	month   []int // 1-12
	weekday []int // 0-6 (0=Sunday)
}

// ParseCron parses a cron expression
func ParseCron(expr string) (*CronSchedule, error) {
	fields := strings.Fields(expr)
	if len(fields) != 5 {
		return nil, fmt.Errorf("invalid cron expression: expected 5 fields, got %d", len(fields))
	}

	schedule := &CronSchedule{}

	var err error
	schedule.minute, err = parseField(fields[0], 0, 59)
	if err != nil {
		return nil, fmt.Errorf("invalid minute field: %w", err)
	}

	schedule.hour, err = parseField(fields[1], 0, 23)
	if err != nil {
		return nil, fmt.Errorf("invalid hour field: %w", err)
	}

	schedule.day, err = parseField(fields[2], 1, 31)
	if err != nil {
		return nil, fmt.Errorf("invalid day field: %w", err)
	}

	schedule.month, err = parseField(fields[3], 1, 12)
	if err != nil {
		return nil, fmt.Errorf("invalid month field: %w", err)
	}

	schedule.weekday, err = parseField(fields[4], 0, 6)
	if err != nil {
		return nil, fmt.Errorf("invalid weekday field: %w", err)
	}

	return schedule, nil
}

// parseField parses a single field of a cron expression
func parseField(field string, min, max int) ([]int, error) {
	// Wildcard with step (e.g., "*/5" means every 5 units)
	if strings.HasPrefix(field, "*/") {
		stepStr := strings.TrimPrefix(field, "*/")
		step, err := strconv.Atoi(strings.TrimSpace(stepStr))
		if err != nil {
			return nil, fmt.Errorf("invalid step value: %s", stepStr)
		}
		if step <= 0 {
			return nil, fmt.Errorf("step must be positive: %d", step)
		}
		values := make([]int, 0)
		for i := min; i <= max; i += step {
			values = append(values, i)
		}
		return values, nil
	}

	// Wildcard
	if field == "*" {
		values := make([]int, max-min+1)
		for i := range values {
			values[i] = min + i
		}
		return values, nil
	}

	// List (e.g., "1,3,5")
	if strings.Contains(field, ",") {
		parts := strings.Split(field, ",")
		values := make([]int, 0, len(parts))
		for _, part := range parts {
			val, err := strconv.Atoi(strings.TrimSpace(part))
			if err != nil {
				return nil, fmt.Errorf("invalid value: %s", part)
			}
			if val < min || val > max {
				return nil, fmt.Errorf("value %d out of range [%d, %d]", val, min, max)
			}
			values = append(values, val)
		}
		return values, nil
	}

	// Range (e.g., "1-5")
	if strings.Contains(field, "-") {
		parts := strings.Split(field, "-")
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid range: %s", field)
		}
		start, err := strconv.Atoi(strings.TrimSpace(parts[0]))
		if err != nil {
			return nil, fmt.Errorf("invalid range start: %s", parts[0])
		}
		end, err := strconv.Atoi(strings.TrimSpace(parts[1]))
		if err != nil {
			return nil, fmt.Errorf("invalid range end: %s", parts[1])
		}
		if start < min || start > max || end < min || end > max || start > end {
			return nil, fmt.Errorf("invalid range [%d, %d], expected [%d, %d]", start, end, min, max)
		}
		values := make([]int, end-start+1)
		for i := range values {
			values[i] = start + i
		}
		return values, nil
	}

	// Single value
	val, err := strconv.Atoi(strings.TrimSpace(field))
	if err != nil {
		return nil, fmt.Errorf("invalid value: %s", field)
	}
	if val < min || val > max {
		return nil, fmt.Errorf("value %d out of range [%d, %d]", val, min, max)
	}
	return []int{val}, nil
}

// Next returns the next scheduled time after the given time
func (c *CronSchedule) Next(after time.Time) time.Time {
	// Start from the next minute
	t := after.Add(time.Minute).Truncate(time.Minute)

	// Try up to 4 years in the future (to avoid infinite loops)
	maxAttempts := 366 * 24 * 60 * 4
	for i := 0; i < maxAttempts; i++ {
		if c.matches(t) {
			return t
		}
		t = t.Add(time.Minute)
	}

	// Should never reach here
	return after.AddDate(100, 0, 0)
}

// matches checks if a time matches the schedule
func (c *CronSchedule) matches(t time.Time) bool {
	return contains(c.minute, t.Minute()) &&
		contains(c.hour, t.Hour()) &&
		contains(c.day, t.Day()) &&
		contains(c.month, int(t.Month())) &&
		contains(c.weekday, int(t.Weekday()))
}

// contains checks if a slice contains a value
func contains(slice []int, val int) bool {
	for _, v := range slice {
		if v == val {
			return true
		}
	}
	return false
}
