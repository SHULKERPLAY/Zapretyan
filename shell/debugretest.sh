#!/bin/bash

#Repeat today's send
bashdir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
rm $bashdir/new.txt
rm $bashdir/newip.txt
mv $bashdir/old.txt $bashdir/new.txt
mv $bashdir/oldip.txt $bashdir/newip.txt

$bashdir/discordrkn.sh
