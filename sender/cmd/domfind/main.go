package main

import (
	"flag"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"

	//Connection handler
	"bufio"
	"context"
	"net"
	"os/signal"
	"regexp"
	"strings"
	"syscall"
	"time"
	"unicode/utf8"

	//Fancy logger
	"github.com/lmittmann/tint"
)

// Default params
const ver = "1.0.0"
const minlength = 5
const maxlength = 255
const sockPath = "/tmp/domfind.sock"

var index, comindex, ipindex string

type AppArgs struct {
	Shdir       string
	Loglevel    string
	MaxmindID   string
	MaxmindPass string
}

func main() {
	args := &AppArgs{}
	
	//Early Init
	fmt.Println("Domain Matcher", ver)
	defer slog.Info("App closed")
	//Parse Flags
	parseFlags(&AppArgs{})
	//Required flags
	flagRequired(args.Shdir)
	flagRequired(args.MaxmindID)
	flagRequired(args.MaxmindPass)
	slog.Info("Index directory", "shdir", args.Shdir)
	//Check neccesary files
	checkFile(args.Shdir, "new.txt", true)
	checkFile(args.Shdir, "community.txt", true)
	checkFile(args.Shdir, "newip.txt", true)
	index = filepath.Join(args.Shdir, "new.txt")
	comindex = filepath.Join(args.Shdir, "community.txt")
	ipindex = filepath.Join(args.Shdir, "newip.txt")

	slog.Debug("Bounds are:", slog.Int("minlength", minlength), slog.Int("maxlength", maxlength))

	//Start socket
	slog.Debug("Trying to delete old socket", "sockPath", sockPath)
	if err := os.RemoveAll(sockPath); err != nil {
		slog.Error("Error while deleting old sock", "err", err)
		os.Exit(1)
	}
	//Start listener
	slog.Info("Starting listener", "sockPath", sockPath)
	listener, err := net.Listen("unix", sockPath)
	if err != nil {
		slog.Error("Error while Listen", "err", err)
		os.Exit(1)
	}
	defer listener.Close()
	defer slog.Debug("Listener closed", "sockPath", sockPath)

	//change permissions
	slog.Debug("Changing permissions", "sockPath", sockPath)
	if err := os.Chmod(sockPath, 0770); err != nil {
		slog.Warn("Cannot change permissions on Sock", "err", err)
	}

	//Catch Terminate
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		slog.Warn("Catch terminate signal")
		os.RemoveAll(sockPath)
		os.Exit(0)
	}()

	slog.Info("Daemon is listening on", "sockPath", sockPath)
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

/* Also we can use os.args
import "os"
args := os.Args
if s := &args.Shdir; len(args) > 1 {
	*s = args[1]
	fmt.Println("arg1 is:", *s)
} */

func parseFlags(args *AppArgs) {
	slog.Debug("Parsing flags...")

	// Define flags (name, default, description)
	defer slog.Debug("parseFlags() ended")
	flag.StringVar(&args.Shdir, "indexdir", "", "Path to folder with new.txt, newip.txt, community.txt")
	flag.StringVar(&args.Loglevel, "log", "", "Set log level: 'info', 'warn', 'error' or 'debug'")
	flag.StringVar(&args.MaxmindID, "maxmindid", "", "Set MaxMind ID to access db download")
	flag.StringVar(&args.MaxmindPass, "maxmindpass", "", "Set MaxMind password to access db download")
	flag.Parse()

	// Prepare Logger
	setupLogger(&args.Loglevel)
	slog.Debug("Got flags.", "flags", &args)
}

func flagRequired(test string) {
	defer slog.Debug("flagRequired() ended")
	slog.Debug("Reqired!", "flag", test)
	if test == "" {
		slog.Error("Missing required arguments!")
		flag.Usage()
		os.Exit(1)
	}
}

func setupLogger(levelName *string) {
	defer slog.Debug("setupLogger() ended")
	// Default Level: Info
	level := slog.LevelInfo
	addsource := false
	// Selecting Level
	if levelName != nil {
		switch *levelName {
		case "debug":
			level = slog.LevelDebug
			addsource = true
		case "warn":
			level = slog.LevelWarn
		case "error":
			level = slog.LevelError
		}
	}
	//init logger
	logger := slog.New(tint.NewHandler(os.Stdout, &tint.Options{
		Level:      level,
		TimeFormat: "15:04:05",
		NoColor:    false,
		AddSource:  addsource,
	}))
	slog.SetDefault(logger)
	slog.Info("Log level", "level", level)
}

func checkFile(dir string, filename string, critical bool) {
	// Get file path
	fullPath := filepath.Join(dir, filename)
	defer slog.Debug("checkFile() ended", "file", fullPath)

	// Can we read file?
	file, err := os.Open(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			slog.Error("File Not Found!", "path", fullPath)
		} else if os.IsPermission(err) {
			slog.Error("Not permitted to read file.", "path", fullPath)
		} else {
			slog.Error("Error while trying to read file.", "err", err)
		}
		if critical {
			os.Exit(1)
		}
		return
	}
	// Close when success
	defer file.Close()
	slog.Info("OK", "Available", fullPath)
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
		return processIP(query)
	case "domain":
		slog.Debug("Sending", "mode", mode, "query", query, "to", "processDomain()")
		return processDomain(query)
	}
	slog.Error("GOT WRONG", "mode", mode)
	return ":red_circle: Internal err: Wrong mode type"
}

// Struct search results
type SearchResult struct {
	Count      int
	Matches    []string
	ExactMatch bool
}

// For mode IP
func processIP(ip string) string {
	defer slog.Debug("processIP() ended", "ip", ip)
	slog.Debug("Validating syntax", "ip", ip)
	//Validate IP
	parsedIP := net.ParseIP(ip)
	if parsedIP == nil || strings.Contains(ip, "/") {
		slog.Warn("BAD IP ADRESS!", "ip", ip)
		return fmt.Sprintf(":red_circle: **Недопустимый IPv4 адрес!** (%s)", ip)
	}
	//Check for IPv4 structure
	if parsedIP.To4() == nil {
		slog.Warn("NOT AN IPv4!", "ip", ip)
		return ":red_circle: Поддерживаются только IPv4 адреса."
	}
	slog.Debug("Checks passed", "ip", ip)
	//Strict search
	slog.Debug("Searching", "ip", ip, "in", ipindex)
	res, err := grepFile(ipindex, ip, true)
	if err != nil {
		slog.Error("Error while searching", "ip", ip)
		return fmt.Sprintf(":red_circle: Ошибка при поиске адреса: %v", err)
	}

	// If find something, then it banned
	if res.Count < 1 {
		slog.Info("Not found matching lines!")
		return fmt.Sprintf(":green_heart: __%s__ **не найден** в реестре блокировок РКН!", ip)
	}
	slog.Info("Found matching IP!")
	return fmt.Sprintf(":large_orange_diamond: __%s__ **был найден** в реестре блокировок РКН!", ip)
}

// For mode domain
func processDomain(domain string) string {
	defer slog.Debug("processDomain() ended", "domain", domain)
	slog.Debug("Validating syntax", "domain", domain)
	// Validate Regexp
	validName := regexp.MustCompile(`^[ёЁа-яА-Яa-zA-Z0-9.-]+$`)
	if !validName.MatchString(domain) {
		slog.Warn("BAD CHARACTERS AT", "domain", domain)
		return fmt.Sprintf(":red_circle: Недопустимый символ в __**%s**__.", domain)
	}

	// All to lowercase
	domain = strings.ToLower(domain)
	slog.Debug("Converted to lowercase", "domain", domain)

	// Validate Length
	slog.Debug("Validating length", "domain", domain)
	length := utf8.RuneCountInString(domain)
	if length < minlength {
		slog.Warn("Search string is too short!")
		return fmt.Sprintf(":red_circle: Минимальная длинна запроса - %d символов", minlength)
	}
	if length > maxlength {
		slog.Warn("Search string is too long!")
		return fmt.Sprintf(":red_circle: Максимальная длинна запроса - %d символов", maxlength)
	}
	slog.Debug("Checks passed")
	// Get struct from search
	slog.Debug("Searching", "domain", domain, "in", index)
	rknRes, err := grepFile(index, domain, false)
	var output strings.Builder

	if err == nil {
		if rknRes.Count < 1 {
			slog.Info("Not found matching patterns!")
			output.WriteString(fmt.Sprintf(":green_heart: __%s__ **не найден** в реестре блокировок РКН!", domain))
		} else { // Proceed to reply builder based on Struct info and put result to 'output'
			slog.Info("Found matching:", "rknRes.Count", rknRes.Count)
			output.WriteString(formatDomainOutput(domain, rknRes, ":orange_heart: Нашла в **реестре РКН**"))
		}
	} else { // if error
		slog.Error("Error while searching domain", "err", err)
		output.WriteString(fmt.Sprintf(":red_circle: Ошибка при поиске домена: %v", err))
	}
	slog.Debug("First Phase output:", "part", output.String())

	// Community search
	slog.Debug("Searching", "domain", domain, "in", comindex)
	comRes, err := grepFile(comindex, domain, false)
	if err == nil && comRes.Count > 0 {
		slog.Info("Found matching patterns (community):", "comRes.Count", comRes.Count)
		// Add newline if result was written
		if output.Len() > 0 {
			output.WriteString("\n")
		}
		// Proceed to reply builder based on Struct info and append result to 'output'
		output.WriteString(formatDomainOutput(domain, comRes, ":light_blue_heart: Нашла в **комьюнити-листе**"))
	} else {
		slog.Info("Not found matching community patterns!")
	}
	slog.Debug("Final Phase output:", "part", output.String())

	// Return completed output
	return output.String()
}

// Grep Alt
func grepFile(filepath string, query string, strict bool) (SearchResult, error) {
	defer slog.Debug("grepFile() ended", "filepath", filepath, "query", query, "strict", strict)
	slog.Debug("Open file", "filepath", filepath)
	file, err := os.Open(filepath)
	if err != nil {
		slog.Error("Error opening file", "err", err)
		return SearchResult{}, err
	}
	defer file.Close()
	defer slog.Debug("Close file", "filepath", filepath)

	var res SearchResult
	scanner := bufio.NewScanner(file)

	for scanner.Scan() {
		// .Text() to ignore newlines
		line := scanner.Text()

		match := false
		if strict {
			//Strict mode for IP search
			if line == query {
				match = true
			}
		} else {
			//Common mode for searching domains
			if strings.Contains(line, query) {
				match = true
			}
		}

		if match {
			res.Count++
			if line == query {
				res.ExactMatch = true
				slog.Debug("Found ExactMatch!")
			}
			//Store 10 matches
			if len(res.Matches) < 10 {
				res.Matches = append(res.Matches, line)
			}
		}
	}
	slog.Debug("Store", "matches", res.Matches)
	// Return struct
	return res, nil
}

// Output generation
func formatDomainOutput(domain string, res SearchResult, headerShort string) string {
	// If less than 6 results
	defer slog.Debug("formatDomainOutput() ended", "domain", domain, "res", res, "headerShort", headerShort)
	slog.Debug("Formatting output")
	if res.Count < 6 {
		slog.Debug("Style is 'All results'", "res.Count", res.Count)
		matchText := "эти домены"
		if res.ExactMatch {
			matchText = fmt.Sprintf("точное совпадение **`%s`**, все совпадения", domain)
		}
		// sed Alt
		list := strings.Join(res.Matches, "__, __")
		slog.Debug("Style returns", "list", list)
		return fmt.Sprintf("%s %s: __%s__.", headerShort, matchText, list)
	}

	// If more than 5 results
	slog.Debug("Style is 'First matches'", "res.Count", res.Count)
	firstResult := res.Matches[0]
	matchText := fmt.Sprintf("__%s__", firstResult)
	if res.ExactMatch {
		matchText = fmt.Sprintf("точное совпадение **`%s`**", domain)
	}

	// headerShort is a prefix results
	slog.Debug("Style returns", "headerShort", headerShort, "matchText", matchText, "and", res.Count-1)
	return fmt.Sprintf("%s %s и ещё **%d доменов**! Измените запрос для получения более точного или объёмного результата.", headerShort, matchText, res.Count-1)
}
