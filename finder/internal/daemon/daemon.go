package daemon

import (
	"flag"
	"log/slog"
	"net"
	"context"
	"time"
	"os"
	"path/filepath"

	//Fancy logger
	"github.com/lmittmann/tint"
)

var Params *GlobalParams

type GlobalParams struct {
	Ver string
	Minlength int
	Maxlength int
	SockPath string
	Index string
	Comindex string
	Ipindex string
	Resolver *net.Resolver
	Nommdb bool
}

var Args *AppArgs

type AppArgs struct {
	Shdir       string
	Loglevel    string
	MaxmindID   string
	MaxmindPass string
}

func init() {
	defer slog.Debug("daemon.init() ended")
	// Init params
	Params = &GlobalParams{}
	Args = &AppArgs{}

	//Parse Flags and setup Logger
	parseFlags()

	//Required flags
	flagRequired(Args.Shdir)
	flagRequired(Args.MaxmindID)
	flagRequired(Args.MaxmindPass)

	//Check neccesary files
	checkFile(Args.Shdir, "new.txt", true)
	checkFile(Args.Shdir, "community.txt", true)
	checkFile(Args.Shdir, "newip.txt", true)
	Params.Index = filepath.Join(Args.Shdir, "new.txt")
	Params.Comindex = filepath.Join(Args.Shdir, "community.txt")
	Params.Ipindex = filepath.Join(Args.Shdir, "newip.txt")

	// Define DNS resolver
	Params.Resolver = &net.Resolver{
		PreferGo: true, // Ignore CGO resolver
		Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
			d := net.Dialer{
				Timeout: time.Second * 5,
			}
			// Set DNS server address. We can use 8.8.8.8:53 or 1.1.1.1:53
			return d.DialContext(ctx, "udp", "1.1.1.1:53")
		},
	}
	slog.Info("Daemon Loaded!")
}

/* Also we can use os.args
import "os"
args := os.Args
if s := &args.Shdir; len(args) > 1 {
	*s = args[1]
	fmt.Println("arg1 is:", *s)
} */

func parseFlags() {
	slog.Debug("Parsing flags...")

	// Define flags (name, default, description)
	defer slog.Debug("parseFlags() ended")
	flag.StringVar(&Args.Shdir, "indexdir", "", "Path to folder with new.txt, newip.txt, community.txt")
	flag.StringVar(&Args.Loglevel, "log", "", "Set log level: 'info', 'warn', 'error' or 'debug'")
	flag.StringVar(&Args.MaxmindID, "maxmindid", "", "Set MaxMind ID to access db download")
	flag.StringVar(&Args.MaxmindPass, "maxmindpass", "", "Set MaxMind password to access db download")
	flag.BoolVar(&Params.Nommdb, "nommdb", false, "Disable MaxMind related features (false/true)")
	flag.Parse()
	// Prepare Logger
	setupLogger()
	slog.Debug("Got flags.", "flags", Args)
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

func setupLogger() {
	defer slog.Debug("setupLogger() ended")
	// Default Level: Info
	level := slog.LevelInfo
	addsource := false
	// Selecting Level
	if Args.Loglevel != "" {
		switch Args.Loglevel {
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
		if critical { os.Exit(1) }
		return
	}
	// Close when success
	defer file.Close()
	slog.Info("OK", "Available", fullPath)
}