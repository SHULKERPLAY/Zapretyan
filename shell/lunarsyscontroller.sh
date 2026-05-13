#!/bin/bash

# Bash CRON replacement. Cron works bad across my different systems. 
# Systemd timers is overkill for every little thing.
# So i made this once. And now i made a remake of old thing.

# Usage

# case "$current_state" in
# $someNeededState)
#   action one % or more &
#   last_run_state="$current_state"
#   ;;
# $anotherState) ...

# ALWAYS PLACE "&" AFTER LONG-RUNNING TASKS IF POSSIBLE!
# If you don't: long running task will hang the cycle and skip all further tasks until current task ends

# Examples what to place instad of "$someNeededState)" metioned above. You can combine some within bash syntax
# Format: WeekDay/Day/Month/Year/HourMinute
# WeekDays: Mon, Tue, Wed, Thu, Fri, Sat, Sun

# If you need exactly date and time
# "Sun/14/12/2025/1954")

# Every Day in 09:00
# */*/*/*/0900)

# Every Monday in 05:05
# Mon/*/*/*/0505)

# Every 1st day of month
# */01/*/*/0000)

# 1 or 15 day of any month in 00:00
# */01/*/*/0000 | */15/*/*/0000)

# 1 to 9 day of any month in 00:00
# */0[1-9]/*/*/0000)

# 10 to 28 day of any month in 00:00
# */1[0-9]/*/*/0000 | */2[0-8]/*/*/0000)

# Get current dir
bashdir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd "$bashdir"

# Prevent repeating in same minute
last_run_state=""

while true
do
    # Comlile in sinle string: Mon/12/05/2026/1845
    # %a - Weekday (Mon), %d - Day (12), %m - Month (05), %Y - Year (2026), %H%M - Time HourMinute (1845)
    current_state=$(date "+%a/%d/%m/%Y/%H%M")

    # Check if task for this state already started
    if [[ "$current_state" != "$last_run_state" ]]; then

        case "$current_state" in
            # Strict date and time
            "Sun/15/08/2026/1959")
                /h/h/datetime.sh & # ALWAYS PLACE "&" AFTER LONG-RUNNING TASKS IF POSSIBLE
                last_run_state="$current_state"
                ;;

            # Every Day in 09:00 (* as wildcards)
            */*/*/*/0900)
                /h/h/everyday.sh &
                last_run_state="$current_state"
                ;;

            # Every Monday in 05:05
            Mon/*/*/*/0505)
                /h/h/weekly-task.sh &
                last_run_state="$current_state"
                ;;

            # Every 1st day of month
            */01/*/*/0000)
                /h/h/monthly-cleanup.sh &
                last_run_state="$current_state"
                ;;
        esac
    fi

    # Sleep for 30 seconds is enough to not skip a minute
    # And not spam system Date
    sleep 30
done
