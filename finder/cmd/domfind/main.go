package main

import (
	"fmt"
	"log/slog"
	"os"

	//Connection handler
	"bufio"
	"context"
	"net"
	"os/signal"
	"strings"
	"syscall"
	"time"

	//Internal
	"domfind/internal/daemon"
	"domfind/internal/finder"
)

func main() {
	// Default params
	daemon.Params.Ver = "1.1.0"
	daemon.Params.Minlength = 5
	daemon.Params.Maxlength = 255
	daemon.Params.SockPath = "/tmp/domfind.sock"

	// App timeout to update maxmind DB files
	go func() {
		time.Sleep(7 * 24 * time.Hour)
		slog.Warn("TERMINATING APP TO DB UPDATE ONCE PER SEVEN DAYS!")
		os.Exit(0) // App needs to be restarted by watchdog (systemd or node.js which starts it)
	}()

	//Early Init
	fmt.Println("Domain Matcher", daemon.Params.Ver)
	defer slog.Info("App closed")
	slog.Info("Index directory", "shdir", daemon.Args.Shdir)

	slog.Debug("Bounds are:", slog.Int("Minlength", daemon.Params.Minlength), slog.Int("Maxlength", daemon.Params.Maxlength))

	//Start socket
	slog.Debug("Trying to delete old socket", "SockPath", daemon.Params.SockPath)
	if err := os.RemoveAll(daemon.Params.SockPath); err != nil {
		slog.Error("Error while deleting old sock", "err", err)
		os.Exit(1)
	}
	//Start listener
	slog.Info("Starting listener", "SockPath", daemon.Params.SockPath)
	listener, err := net.Listen("unix", daemon.Params.SockPath)
	if err != nil {
		slog.Error("Error while Listen", "err", err)
		os.Exit(1)
	}
	defer listener.Close()
	defer slog.Debug("Listener closed", "SockPath", daemon.Params.SockPath)

	//change permissions
	slog.Debug("Changing permissions", "SockPath", daemon.Params.SockPath)
	if err := os.Chmod(daemon.Params.SockPath, 0770); err != nil {
		slog.Warn("Cannot change permissions on Sock", "err", err)
	}

	//Catch Terminate
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		slog.Warn("Catch terminate signal")
		os.RemoveAll(daemon.Params.SockPath)
		os.Exit(0)
	}()

	slog.Info("Daemon is listening on", "SockPath", daemon.Params.SockPath)
	for {
		//Catch request
		conn, err := listener.Accept()
		if err != nil {
			slog.Error("Error while Accepting connection", "err", err)
			continue
		}
		//Start logic
		go domfind(conn)
	}
}

func domfind(conn net.Conn) {
	defer conn.Close()
	defer slog.Debug("Connection closed: domfind()")

	//Create context timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	//Free resources if ended within 10 seconds
	defer cancel()

	slog.Info("Client connected")

	//Read request
	reader := bufio.NewReader(conn)
	command, err := reader.ReadString('\n')
	if err != nil {
		slog.Error("Error while reading request", "err", err)
		return
	}
	//Parse command
	slog.Debug("Received", "command", command)
	command = strings.TrimSpace(command)
	input := strings.SplitN(command, ";", 2)

	//Use Select for time control
	responseChan := make(chan string, 1)
	slog.Info("GOT", "string", input[1], "mode", input[0])

	// Send task to Alt Grep
	result := domfindProcess(input[0], input[1])
	responseChan <- result
	slog.Debug("Done!", "result", result)

	//select awaits events in chans
	select {
	case response := <-responseChan:
		slog.Debug("Writing result to socket")
		//Writing response
		_, err = conn.Write([]byte(response))
		if err != nil {
			slog.Error("Error writing response", "err", err)
			return
		}
	case <-ctx.Done():
		//Timeout!
		slog.Error("Timeout while completing request", "command", command)
		conn.Write([]byte(":red_circle: ERROR: Context timeout\n"))
	}
	slog.Info("Response sent succesfully")
}

// Completing request
func domfindProcess(mode string, query string) string {
	defer slog.Debug("domfindProcess() ended", "query", query)
	query = strings.TrimSpace(query)

	switch mode {
	case "ip":
		slog.Debug("Sending", "mode", mode, "query", query, "to", "processIP()")
		return finder.ProcessIP(query)
	case "domain":
		slog.Debug("Sending", "mode", mode, "query", query, "to", "processDomain()")
		return finder.ProcessDomain(query)
	}
	slog.Error("GOT WRONG", "mode", mode)
	return ":red_circle: Internal err: Wrong mode type"
}
