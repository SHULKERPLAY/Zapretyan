#!/bin/bash

#F69cking cron doesn't work on any of my systems
#So this started by systemd and executing things every day by time
while true
do
    timecurrent=$(date +%H%M)
#        if [ "$timecurrent" -eq "0500" ]; then
#             /sbin/shutdown -r now
#        else
#             echo
#        fi
        if [ "$timecurrent" -eq "0505" ]; then
             /h/h/index.sh & echo done
        else
             echo
        fi
        if [ "$timecurrent" -eq "0900" ]; then
             /h/h/discordrkn.sh
        else
            echo
        fi
        
#        if [ "$timecurrent" -eq "2040" ]; then
#            echo eeeeeeeeeeeeeeeeeeeeeeeeeeee
#        else
#            echo
#        fi
#
    sleep 40
done
