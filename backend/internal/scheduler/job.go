package scheduler

import "context"

// Job represents a scheduled job
type Job interface {
	// Name returns the name of the job
	Name() string

	// Execute runs the job logic
	Execute(ctx context.Context) error
}
