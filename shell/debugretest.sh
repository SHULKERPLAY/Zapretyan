#!/bin/bash
echo discordrkn-retest v1.3
#Repeat today's send
echo detecting directory
bashdir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
echo cleanup
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
rm -rf $jsdir/send/

rm $bashdir/new.txt
rm $bashdir/newip.txt
mv $bashdir/old.txt $bashdir/new.txt
mv $bashdir/oldip.txt $bashdir/newip.txt
echo 'Done. Executing discordrkn.sh'
$bashdir/discordrkn.sh
