#!/bin/bash

#F69cking cron doesn't work on any of my systems
#So this started by systemd and executing things every day by time

#Usage
#        if [ "$weekd/$day/$month/$year/$time" -eq "Sun/14/12/2025/1954" ]; then
#            echo oiia
#        else
#            echo iiia
#        fi
while true
do
    time=$(date +%H%M)
#redefine day
        if [ "$time" -eq "0000" ]; then
            weekd=$(date +%a)
            day=$(date +%d)
            month=$(date +%m)
            year=$(date +%Y)
        fi

        if [ "$time" -eq "0505" ]; then
             /h/h/index.sh & echo 'done'
        else
             echo
        fi
        if [ "$time" -eq "0900" ]; then
             /h/h/discordrkn.sh
        else
            echo
        fi
    sleep 40
done
