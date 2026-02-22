package resolve

import (
	"context"
	"log/slog"
	"net"
	"time"

	"domfind/internal/daemon"
)

// ResolveOne requires a Domain or IP and returns one IP address as a String.
// If input is Domain: Function returns first resolved IPv4 address.
func ResolveOne(input string) (string) {

	// Check if it is not IP
	if net.ParseIP(input) != nil {
		slog.Info("ResolveOne() Got IP in input. Returning IP")
		return input
	}

	// Set DNS resolve timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Resolving IP
	ips, err := daemon.Params.Resolver.LookupIP(ctx, "ip", input)
	if err != nil {
		slog.Warn("Failed to resolve", "input", input, "err", err)
		return ""
	}

	if len(ips) == 0 {
		slog.Warn("IPs not found in ResolveOne()")
		return ""
	}

	// Return first IPv4 address
	for _, ip := range ips {
		if ipv4 := ip.To4(); ipv4 != nil {
			return ipv4.String()
		}
	}

	// If IPv4 not found: return first valid IP
	return ips[0].String()
}