#!/bin/bash

#Repeat today's send
bashdir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
. $bashdir/config.cfg
rm $shdir/v2ray.zip
rm $shdir/checkone.txt
rm $shdir/checktwo.txt
rm $shdir/checkthree.txt
rm $shdir/checkfour.txt
rm $shdir/bansite.txt
rm $shdir/unbansite.txt
rm $shdir/banip.txt
rm $shdir/unbanip.txt
rm -rf $shdir/ru-block-v2ray-rules-release/
rm -rf $shdir/msgbuff/

rm $bashdir/new.txt
rm $bashdir/newip.txt
mv $bashdir/old.txt $bashdir/new.txt
mv $bashdir/oldip.txt $bashdir/newip.txt

$bashdir/discordrkn.sh
