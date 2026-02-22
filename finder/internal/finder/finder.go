package finder

import (
	"fmt"
	"log/slog"
	"os"
	"bufio"
	"net"
	"regexp"
	"strings"
	"unicode/utf8"

	//Internal
	"domfind/internal/daemon"
	"domfind/internal/resolve"
)

// Struct search results
type SearchResult struct {
	Count      int
	Matches    []string
	ExactMatch bool
}

// For mode IP
func ProcessIP(ip string) string {
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
	slog.Debug("Searching", "ip", ip, "in", daemon.Params.Ipindex)
	res, err := grepFile(daemon.Params.Ipindex, ip, true)
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
func ProcessDomain(domain string) string {
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
	if length < daemon.Params.Minlength {
		slog.Warn("Search string is too short!")
		return fmt.Sprintf(":red_circle: Минимальная длинна запроса - %d символов", daemon.Params.Minlength)
	}
	if length > daemon.Params.Maxlength {
		slog.Warn("Search string is too long!")
		return fmt.Sprintf(":red_circle: Максимальная длинна запроса - %d символов", daemon.Params.Maxlength)
	}
	slog.Debug("Checks passed")

	/*/////////
		PHASE 1 - Main banlist
	*//////////

	// Get struct from search
	slog.Debug("Searching", "domain", domain, "in", daemon.Params.Index)
	rknRes, err := grepFile(daemon.Params.Index, domain, false)
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

	/*/////////
		PHASE 2 - Community banlist
	*//////////

	// Community search
	slog.Debug("Searching", "domain", domain, "in", daemon.Params.Comindex)
	comRes, err := grepFile(daemon.Params.Comindex, domain, false)
	if err == nil && comRes.Count > 0 {
		slog.Info("Found matching patterns (community):", "comRes.Count", comRes.Count)
		// Add newline if result was written
		if output.Len() > 0 { output.WriteString("\n") }
		// Proceed to reply builder based on Struct info and append result to 'output'
		output.WriteString(formatDomainOutput(domain, comRes, ":light_blue_heart: Нашла в **комьюнити-листе**"))
	} else {
		slog.Info("Not found matching community patterns!")
	}
	slog.Debug("Phase 2 output:", "part", output.String())

	/*/////////
		PHASE 3 - If no matches: Resolve and check IP
	*//////////

	// Switch to skip phase 3
	var phase3 = true

	// Resolve and validate IP
	ip := resolve.ResolveOne(domain)
	if ip == "" {
		slog.Warn("Failed to resolve domain in phase 3!", "ip", ip)
		return output.String()
	}
	resolvedIP := net.ParseIP(ip)
	if resolvedIP == nil {
		slog.Warn("Failed to parse IPv4 of domain in phase 3!", "ip", ip)
		return output.String()
	}
	resolvedIPv4 := resolvedIP.To4()
	if resolvedIPv4 == nil {
		slog.Warn("Parsed IP of domain is not IPv4! Skipping phase 3!", "ip", ip)
		phase3 = false
	}

	if phase3 {
		//Strict search
		slog.Debug("Searching domain IP", "ip", ip, "in", daemon.Params.Ipindex)
		res, err := grepFile(daemon.Params.Ipindex, ip, true)
		if err != nil {
			slog.Error("Error while searching Domain IP", "ip", ip)
			return output.String()
		}

		// If find something, then it banned
		if res.Count < 1 {
			slog.Info("Not found matching IP in Phase 3!")
		} else {
			slog.Info("Found matching IP (Phase 3):", "comRes.Count", comRes.Count)
			// Add newline if result was written
			if output.Len() > 0 { output.WriteString("\n") }
			// Proceed to reply builder based on Struct info and append result to 'output'
			output.WriteString(fmt.Sprintf(":bangbang: IP Адрес домена **`%s --> %s`** был найден в **реестре РКН**!", domain, ip))
			return output.String()
		}
		slog.Debug("Phase 3 output:", "part", output.String())
	}
	
	/*/////////
		PHASE 4 - If no matches in phase 3: Compare with maxmind database
	*//////////

	// Switch to skip phase 4
	var phase4 = true

	if daemon.Params.Nommdb { phase4 = false }

	if phase4 {
		//tbd
	}

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