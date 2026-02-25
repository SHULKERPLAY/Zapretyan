package geomanager

import (
	"archive/tar"
	"compress/gzip"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"os"
	"path"
	"strings"
	"time"

	"github.com/oschwald/geoip2-golang"

	"domfind/internal/daemon"
)

// Paths to City and ASN GeoLite2 Databases
var CityDB = path.Join(daemon.Params.AppPath, "GeoLite2-City.mmdb")
var ASNDB = path.Join(daemon.Params.AppPath, "GeoLite2-ASN.mmdb")

// Language of database requests
const lang = "ru"

// Map of known ISPs. (ASN -> Presentable Name)
var customISPNames = map[uint]string{
	714:    "Apple Inc.",
	2709:   "Apple Inc.",
	6185:   "Apple Inc.",
	11508:  "The Constant Company LLC (VULTR)",
	20473:  "The Constant Company LLC (VULTR)",
	40504:  "The Constant Company LLC (VULTR)",
	46407:  "The Constant Company LLC (VULTR)",
	54094:  "The Constant Company LLC (VULTR)",
	13335:  "Cloudflare Inc.",
	14789:  "Cloudflare Inc.",
	394536: "Cloudflare Inc.",
	395747: "Cloudflare Inc.",
	400095: "Cloudflare Inc.",
	7224:   "Amazon Inc.",
	10291:  "Amazon Inc.",
	16509:  "Amazon Inc.",
	19047:  "Amazon Inc.",
	63088:  "Amazon Inc.",
	14618:  "Amazon Inc.",
	21664:  "Amazon Inc.",
	40045:  "Amazon Inc.",
	399834: "Amazon Inc.",
	13949:  "Google LLC",
	15169:  "Google LLC",
	19425:  "Google LLC",
	22577:  "Google LLC",
	22859:  "Google LLC",
	26684:  "Google LLC",
	36039:  "Google LLC",
	36040:  "Google LLC",
	40873:  "Google LLC",
	13414:  "Twitter Inc.",
	35995:  "Twitter Inc.",
	54888:  "Twitter Inc.",
	63179:  "Twitter Inc.",
	32934:  "Meta Platforms Inc.",
	63293:  "Meta Platforms Inc.",
	23454:  "Akamai Technologies",
	20189:  "Akamai Technologies",
	32787:  "Akamai Technologies",
	20940:  "Akamai Technologies",
	200005: "Akamai Technologies",
	63949:  "Akamai Technologies",
	48337:  "Akamai Technologies",
	24940:  "Hetzner Online GmbH",
	213230: "Hetzner Online GmbH",
	212317: "Hetzner Online GmbH",
	215859: "Hetzner Online GmbH",
	62014:  "Telegram Messenger",
	62041:  "Telegram Messenger",
	59930:  "Telegram Messenger",
	14061:  "DigitalOcean LLC",
	46652:  "DigitalOcean LLC",
	62567:  "DigitalOcean LLC",
	393406: "DigitalOcean LLC",
	394362: "DigitalOcean LLC",
	13238:  "Yandex LLC",
	47764:  "Mail.Ru Group",
	60476:  "Mail.Ru Group",
	49505:  "Selectel",
	50340:  "Selectel",
	12389:  "Rostelecom (PJSC)",
	3216:   "VimpelCom (Beeline)",
	8359: 	"MTS PJSC",
	50646: 	"MTS PJSC",
	25159:  "MegaFon",
	12714:  "NetByNet (Megafon)",
	31133:  "Megafon (PJSC)",
	25513:  "Moscow City Telephone Network PJSC",
	42610:  "Rostelecom MRB Moscow",
	21127:  "TTK JSC",
	// More ASN name mappings can be added
}

// Data for fill customISPNames map
func complexISPRanges() {
	// Microsoft
	msSingle := []uint{
		3598, 5761, 6182, 6194, 6291, 6584, 12076, 13399, 13811, 14719, 14783,
		17144, 17345, 20046, 22692, 23468, 25796, 26222, 30135, 30520, 30575,
		31792, 32476, 36006, 40066, 46182, 54396, 63245, 63314, 395496, 395524,
		395851, 396463, 397096, 397466, 397996, 398575, 398961, 400884,
	}
	msRange := []ASNRing{
		{8068, 8075},
		{398656, 398661},
		{400572, 400582},
	}
	FillASNMap(customISPNames, "Microsoft Corporation", msSingle, msRange)
}

// ASNRing gets Min to Max range for FillASNMap()
type ASNRing struct {
	Min uint
	Max uint
}

// FillASNMap fills customISPNames map with single records and ranges for one ASN org.
// Usage: FillASNMap(customISPNames, "Big Corp", singles ([]uint{ 1, 2, 3, }), ranges ([]ASNRing{ {10, 20}, {100, 200}, })
func FillASNMap(m map[uint]string, name string, singles []uint, ranges []ASNRing) {
	// Add single numbers
	for _, asn := range singles {
		m[asn] = name
	}
	// Add ranges of numbers
	for _, r := range ranges {
		for i := r.Min; i <= r.Max; i++ {
			m[i] = name
		}
	}
}

var GeoService *GeoServices

// GeoService stores mmdb databases connections
type GeoServices struct {
	CityDB *geoip2.Reader
	ASNDB  *geoip2.Reader
}

// Initialize GeoManager on import
func init() {
	defer slog.Debug("init() ended")

	// Fill customISPNames map with Big ranges
	complexISPRanges()
	slog.Info("ASN Map elements defined!", "length", len(customISPNames))

	// Check and update
	UpdateGeoLite("GeoLite2-City", CityDB)
	UpdateGeoLite("GeoLite2-ASN", ASNDB)
	
	// Initialize service
	GeoService = NewGeoService("GeoLite2-City.mmdb", "GeoLite2-ASN.mmdb")
}

// NewGeoService opening MaxMind databases
func NewGeoService(cityPath, asnPath string) (*GeoServices) {
	defer slog.Debug("NewGeoService() ended")
	city, err := geoip2.Open(cityPath)
	if err != nil {
		slog.Error("Error while opening City Database!", "err", err)
		slog.Error("All features requiring GeoLite service disabled!")
		daemon.Params.Nommdb = true
		return nil
	}

	asn, err := geoip2.Open(asnPath)
	if err != nil {
		city.Close()
		slog.Error("Error while opening ASN Database!", "err", err)
		slog.Error("All features requiring GeoLite service disabled!")
		daemon.Params.Nommdb = true
		return nil
	}

	return &GeoServices{CityDB: city, ASNDB: asn}
}

// Closes MaxMind Database connections
func (s *GeoServices) Close() {
	s.CityDB.Close()
	s.ASNDB.Close()
}

func UpdateGeoLite(editionID string, targetPath string) {
	defer slog.Debug("UpdateGeoLite() ended")
	slog.Debug("Target path", "path", targetPath)
	info, err := os.Stat(targetPath)

	// Если файла нет или он старше 7 дней
	if os.IsNotExist(err) || time.Since(info.ModTime()) > 7*24*time.Hour {
		slog.Warn("Database too old or not exist. Updating...", "db", editionID)
		downloadAndExtractGeoLite(editionID, targetPath)
	} else {
		slog.Info("Database valid.", "db", editionID, "updated", info.ModTime().Format("02.01.2006"))
	}
}

func downloadAndExtractGeoLite(editionID, targetPath string) {
	defer slog.Debug("downloadAndExtractGeoLite() ended")
	// Official GeoLite2 (GeoLite2-ASN, GeoLite2-City)
	url := fmt.Sprintf("https://download.maxmind.com/geoip/databases/%s/download?suffix=tar.gz", editionID)

	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)
	slog.Debug("HTTP/GET", "url", url)
	if err != nil {
		slog.Error("Error while sending HTTP request!", "editionID", editionID, "err", err)
		return
	}

	// Works as curl -u ACCOUNT_ID:PASSKEY
	req.SetBasicAuth(daemon.Args.MaxmindID, daemon.Args.MaxmindPass)

	resp, err := client.Do(req)
	if err != nil {
		slog.Error("Error while downloadling GeoLite 2 DB! Check your ID and Password", "editionID", editionID, "err", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		slog.Debug("HTTP/GET", "httpCode", resp.StatusCode)
		slog.Error("Error while downloadling GeoLite 2 DB! Check your ID and Password", "editionID", editionID, "httpCode", resp.StatusCode)
		return
	}

	// Unpacking
	gzr, err := gzip.NewReader(resp.Body)
	slog.Debug("Created new gzip reader")
	if err != nil {
		slog.Error("Error while unpacking archive", "editionID", editionID, "err", err)
		return
	}
	defer gzr.Close()

	tr := tar.NewReader(gzr)
	slog.Debug("Created new tar reader")
	for {
		header, err := tr.Next()
		if err == io.EOF {
			slog.Error("Error while unpacking archive", "editionID", editionID, "err", err)
			break
		}
		if err != nil {
			slog.Error("Error while unpacking archive", "editionID", editionID, "err", err)
			return
		}

		// Searching .mmdb inside archive
		if strings.HasSuffix(header.Name, ".mmdb") {
			tmpFile, err := os.Create(targetPath + ".tmp")
			if err != nil {
				slog.Error("Error while creating file", "editionID", editionID, "err", err)
				return
			}
			if _, err := io.Copy(tmpFile, tr); err != nil {
				tmpFile.Close()
				slog.Error("Error while copying file", "editionID", editionID, "err", err)
				return
			}
			tmpFile.Close()
			os.Rename(targetPath+".tmp", targetPath)
			slog.Info("Update Successful.", "editionID", editionID)
			return
		}
	}
	slog.Error("Error: .mmdb file not found inside archive!")
}

// ResultData is an reply structure
type ResultData struct {
	IP       string // Query IP Address
	Country  string // Country String e.g. "🇷🇺 Россия"
	City     string // City string
	Provider string // Filtered ISP name
	ASN      uint // ISP ASN. e.g. for Google Cloud it will be "15169"
}

// GetIPInfo collecting data from mmdb by query string
func (s *GeoServices) GetIPInfo(inputIP string) *ResultData {
	defer slog.Debug("GetIPInfo() ended")

	// Validate IP
	ip := net.ParseIP(inputIP)
	if ip == nil {
		slog.Warn("Wrong IP format!", "ip", inputIP)
		return nil
	}

	result := &ResultData{IP: inputIP}

	slog.Info("Got mmdb request", "ip", inputIP)

	// Collecting data: City
	cityRecord, err := s.CityDB.City(ip)
	if err != nil {
		slog.Error("Error while reading MaxMind City Database", "err", err)
		return nil
	}

	slog.Debug("Got city Record", "cityRecord", cityRecord)

	// Get country code from city
	isoCode := cityRecord.Country.IsoCode
	countryName := cityRecord.Country.Names[lang] // Russian output
	if countryName == "" {
		countryName = "Неизвестная страна"
	}
	
	slog.Debug("Got country", "countryName", countryName)

	// Put Unicode country flag to its name
	if isoCode != "" {
		result.Country = fmt.Sprintf("%s %s", isoCodeToEmoji(isoCode), countryName)
	} else {
		result.Country = countryName
	}

	// Output City
	result.City = cityRecord.City.Names[lang] // Russian output
	if result.City == "" {
		result.City = "Неизвестный город"
	}

	slog.Debug("Got City", "result.City", result.City)

	// Get ISP and make name more readable
	asnRecord, err := s.ASNDB.ASN(ip)
	if err != nil {
		// If IP not found in ASN base
		result.Provider = "Неизвестный провайдер"
	} else {
		result.ASN = asnRecord.AutonomousSystemNumber
		rawOrg := asnRecord.AutonomousSystemOrganization
		
		// Convert raw ISP name 
		result.Provider = processISPName(result.ASN, rawOrg)
		slog.Debug("Got ASN", "ASN", result.ASN, "Provider", result.Provider, "raw", rawOrg)
	}

	return result
}

// GetIPASN returns only ASN uint from mmdb by query string 
func (s *GeoServices) GetIPASN (inputIP string) uint {
	defer slog.Debug("GetIPASN() ended")

	// Validate IP
	ip := net.ParseIP(inputIP)
	if ip == nil {
		slog.Warn("Wrong IP format!", "ip", inputIP)
		return 0
	}

	slog.Info("Got mmdb request", "ip", inputIP)
	var result uint

	// Get ASN
	asnRecord, err := s.ASNDB.ASN(ip)
	if err != nil {
		// If IP not found in ASN base
		result = 0
	} else {
		result = asnRecord.AutonomousSystemNumber
		slog.Debug("Got ASN", "ASN", result)
	}

	return result
}

// Compares ASN (uint) with map of known orgs. Returns empty string if no matches
func GetKnownASNOrg(asn uint) string {
	if friendlyName, ok := customISPNames[asn]; ok {
		return friendlyName
	} else { return "" }
}

// processISPName cleans provider raw AS name to be more presentable
func processISPName(asn uint, rawName string) string {
	defer slog.Debug("processISPName() ended")
	// Check known ISP mapping
	if friendlyName, ok := customISPNames[asn]; ok {
		return friendlyName
	}

	// Clean raw name if ISP not in map
	// All to uppercase to suffix deletion
	clean := strings.ToUpper(rawName)
	
	// Erasing theese parts of Raw names
	replacer := strings.NewReplacer(
		" LLC", "",
		" INC.", "",
		" INC", "",
		" CORP.", "",
		" CORPORATION", "",
		" CORP", "",
		" LTD.", "",
		" LTD", "",
		" LIMITED", "",
		" GMBH", "",
		" S.R.L.", "",
		" BV", "",
		" N.V.", "",
		",", "", // Erase commas
		".", "", // Erase dots
		" INTERNATIONAL", "",
		" NETWORK", "",
		" NETWORKS", "",
		" SOLUTIONS", "",
		" TELECOM", "",
		" COMMUNICATIONS", "",
	)
	clean = replacer.Replace(clean)
	
	// Trim spaces
	clean = strings.TrimSpace(clean)

	// Convert to Title Case
	// strings.Title is deprecated but it will work for now
	clean = strings.Title(strings.ToLower(clean))

	slog.Debug("Converted", "asn", asn, "raw", rawName, "to", clean)

	return clean
}

// isoCodeToEmoji translates country characters to unicode flags. e.g. "RU" to "🇷🇺"
func isoCodeToEmoji(countryCode string) string {
	defer slog.Debug("isoCodeToEmoji() ended")
	if len(countryCode) != 2 {
		return ""
	}
	countryCode = strings.ToUpper(countryCode)
	// Unicode magic: shift characters code to country flags range
	return string(rune(countryCode[0])+127397) + string(rune(countryCode[1])+127397)
}



